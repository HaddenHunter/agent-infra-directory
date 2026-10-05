#!/usr/bin/env node
/**
 * 论文元数据核验 / 回填脚本。
 *
 * 与 fetch-github.mjs 同样的分工：**机器可验证的字段由脚本回填，人写的判断不动**。
 *   - 回填：title / authors / publishedDate / updatedDate —— 全部来自 arXiv 官方 API，
 *     这是唯一权威来源。
 *   - 不动：keyFact / whyItMatters / summary 等由人写的字段。
 *   - 冲突：文件里的 title 与 arXiv 不一致时打印告警，由人判断以谁为准（多半是
 *     论文改过标题，或者是人写错了）。
 *
 * 之所以要这条流水线：arXiv 编号、作者、日期是最容易被凭记忆写错的东西。本站已经
 * 因为编造的数字与引用返工过多次，这类字段不允许手写。
 *
 * 用法：
 *   node scripts/fetch-papers.mjs                    # 核验并回填 src/content/papers/
 *   node scripts/fetch-papers.mjs --ids=2210.03629,2303.11366   # 只查，不写文件
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('src/content/papers');
const API = 'http://export.arxiv.org/api/query';
/** 单次请求的 ID 数上限。arXiv 不欢迎高频请求，分批 + 间隔。 */
const BATCH = 10;
const BATCH_DELAY_MS = 3000;

const idsFlag = process.argv.find((a) => a.startsWith('--ids='));

const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** 查一批 arXiv ID，返回 id → {title, authors, publishedDate, updatedDate} */
async function queryArxiv(ids) {
  const url = `${API}?id_list=${ids.join(',')}&max_results=${ids.length * 2}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'agent-infra-directory-papers/0.1 (+https://agent.c8.fit)' },
  });
  if (!res.ok) throw new Error(`arXiv API 返回 ${res.status} ${res.statusText}`);
  const xml = await res.text();

  const out = new Map();
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const rawId = (e.match(/<id>([^<]+)<\/id>/) || [])[1] ?? '';
    // 形如 http://arxiv.org/abs/2210.03629v3 → 2210.03629
    const id = rawId.split('/abs/')[1]?.replace(/v\d+$/, '');
    if (!id) continue;
    out.set(id, {
      title: stripTags((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? ''),
      authors: [...e.matchAll(/<name>([^<]+)<\/name>/g)].map((x) => x[1]),
      publishedDate: ((e.match(/<published>([^<]+)<\/published>/) || [])[1] ?? '').slice(0, 10),
      updatedDate: ((e.match(/<updated>([^<]+)<\/updated>/) || [])[1] ?? '').slice(0, 10),
    });
  }
  return out;
}

async function queryAll(ids) {
  const merged = new Map();
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const got = await queryArxiv(chunk);
    for (const [k, v] of got) merged.set(k, v);
    const missing = chunk.filter((id) => !got.has(id));
    if (missing.length) console.warn(`  ⚠️  arXiv 查无此 ID：${missing.join(', ')}`);
    if (i + BATCH < ids.length) await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }
  return merged;
}

if (idsFlag) {
  const ids = idsFlag.slice('--ids='.length).split(',').map((s) => s.trim()).filter(Boolean);
  const got = await queryAll(ids);
  console.log(JSON.stringify(Object.fromEntries(got), null, 2));
  console.log(`\n查到 ${got.size} / 请求 ${ids.length}`);
  process.exit(0);
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.json'));
const entries = [];
for (const file of files) {
  const full = path.join(DIR, file);
  const data = JSON.parse(await readFile(full, 'utf8'));
  if (!data.arxivId) {
    console.warn(`⚠️  ${file}: 没有 arxivId，跳过（会议论文等非 arXiv 来源需手工维护）`);
    continue;
  }
  entries.push({ file, full, data });
}

const got = await queryAll(entries.map((e) => e.data.arxivId));

let updated = 0;
const warnings = [];
for (const { file, full, data } of entries) {
  const meta = got.get(data.arxivId);
  if (!meta) {
    warnings.push(`${file}: arXiv 查无 ${data.arxivId}`);
    continue;
  }
  if (data.title && data.title !== meta.title) {
    warnings.push(`${file}: 标题不一致\n      文件="${data.title}"\n      arXiv="${meta.title}"`);
  }
  data.title = meta.title;
  data.authors = meta.authors;
  data.publishedDate = meta.publishedDate;
  data.updatedDate = meta.updatedDate;
  await writeFile(full, JSON.stringify(data, null, 2) + '\n');
  updated++;
  console.log(`✓ ${data.name}: ${meta.publishedDate} · ${meta.authors.length} 位作者`);
}

console.log(`\nupdated=${updated} / 共 ${files.length} 个文件`);
if (warnings.length) {
  console.log('\n⚠️  需要人工判断的项：');
  for (const w of warnings) console.log('  - ' + w);
}
