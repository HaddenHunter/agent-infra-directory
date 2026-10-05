#!/usr/bin/env node
/**
 * 把站点 URL 推送给 IndexNow（Bing / Yandex / Seznam / Naver 共用该协议）。
 *
 * IndexNow 不需要账号：只要在站点根目录托管一个文件名等于 <key>、内容也恰好
 * 等于 <key> 的 .txt 文件，即可证明域名归属。那个文件就是 public/ 下的 key 文件，
 * 脚本自己去认它（文件名 === 内容），所以 key 只有一份，不会出现脚本与文件对不上。
 *
 * 用法：
 *   node scripts/ping-indexnow.mjs              # 真推
 *   node scripts/ping-indexnow.mjs --dry-run    # 只打印，不发请求
 *   SITEMAP_URL=https://localhost/sitemap-0.xml node scripts/ping-indexnow.mjs --dry-run
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const SITEMAP_URL = process.env.SITEMAP_URL ?? 'https://agent.c8.fit/sitemap-0.xml';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const PUBLIC_DIR = path.resolve('public');
/** IndexNow 单次请求的 URL 上限 */
const MAX_URLS = 10000;

/** 在 public/ 里找出 IndexNow key 文件：文件名去掉 .txt 后必须等于文件内容。 */
function findKey() {
  const candidates = [];
  for (const file of readdirSync(PUBLIC_DIR)) {
    if (!file.endsWith('.txt')) continue;
    const stem = file.slice(0, -'.txt'.length);
    if (readFileSync(path.join(PUBLIC_DIR, file), 'utf8').trim() === stem) {
      candidates.push({ key: stem, file });
    }
  }
  if (candidates.length !== 1) {
    throw new Error(
      `public/ 下应有且仅有一个 IndexNow key 文件（文件名 === 内容），实际找到 ${candidates.length} 个。`
    );
  }
  return candidates[0];
}

const { key, file } = findKey();
console.log(`key 文件：public/${file}`);

const res = await fetch(SITEMAP_URL, {
  headers: { 'User-Agent': 'agent-infra-directory-indexnow/0.1' },
});
if (!res.ok) throw new Error(`抓 sitemap 失败：HTTP ${res.status} ${SITEMAP_URL}`);

const urls = [...(await res.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
if (!urls.length) throw new Error(`sitemap 里没解析出任何 <loc>：${SITEMAP_URL}`);
if (urls.length > MAX_URLS) {
  throw new Error(`URL 数 ${urls.length} 超过 IndexNow 单次上限 ${MAX_URLS}，需要分批提交。`);
}

const host = new URL(urls[0]).host;
console.log(`sitemap：${SITEMAP_URL}`);
console.log(`host=${host}　URL 数=${urls.length}`);

if (DRY_RUN) {
  console.log('\n--dry-run：不发请求。将被提交的前 5 条：');
  for (const u of urls.slice(0, 5)) console.log('  ' + u);
  process.exit(0);
}

const payload = JSON.stringify({
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList: urls,
});

/** 403 多半是 key 文件刚随本次部署上线、CDN 还没跟上，退避重试几次再判死。 */
const ATTEMPTS = 3;
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const post = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: payload,
  });

  // IndexNow 正常返回 200（已处理）或 202（已接受，待处理）
  if (post.status === 200 || post.status === 202) {
    console.log(`\nIndexNow 已接受：HTTP ${post.status}，提交 ${urls.length} 条 URL。`);
    process.exit(0);
  }

  const body = await post.text().catch(() => '');
  if (post.status === 403 && attempt < ATTEMPTS) {
    console.warn(`第 ${attempt} 次返回 403（key 文件可能尚未生效），10 秒后重试…`);
    await new Promise((r) => setTimeout(r, 10000));
    continue;
  }
  throw new Error(
    `IndexNow 返回 HTTP ${post.status}。403 通常意味着 key 文件没部署上线，` +
      `422 意味着提交的 URL 不属于该 host。响应体：${body.slice(0, 300)}`
  );
}
