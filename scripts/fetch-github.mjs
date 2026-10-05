#!/usr/bin/env node
/**
 * 工具元数据自动采集脚本。
 *
 * 数据来源（权威性从高到低）：
 *   1. GitHub REST API  https://api.github.com/repos/{owner}/{repo}
 *      —— stars / license / language / archived / pushed_at 的一手来源。
 *      速率限制：未认证 60 次/小时，认证后 5000 次/小时。设置环境变量
 *      GITHUB_TOKEN 即可解锁。见 https://api.github.com/rate_limit
 *   2. 官方 MCP Registry  https://registry.modelcontextprotocol.io/v0/servers
 *      —— 公开 MCP 服务器的权威元数据源（server.json 清单）。
 *   3. 包注册表：npm registry / PyPI JSON API
 *      —— 版本号、月下载量、发布者。
 *   4. 目录/landscape（用于发现，不直接作为事实依据）：
 *      - https://github.com/punkpeye/awesome-mcp-servers
 *      - https://landscape.cncf.io
 *      - https://aaif.io（Agentic AI Foundation）
 *
 * 本脚本只回填"可机器验证"的字段（stars / starsAsOf / archived / lastPush），
 * 人写的 license / description / keyFact 不会被覆盖；当二者不一致时会打印告警，
 * 由人判断以谁为准（例如 Dify 的 "Dify Open Source License" 与 GitHub 的
 * NOASSERTION 就属于此类）。
 *
 * 用法：GITHUB_TOKEN=ghp_xxx npm run fetch:github
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('src/content/tools');
const TOKEN = process.env.GITHUB_TOKEN;
const TODAY = new Date().toISOString().slice(0, 10);

function parseRepo(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

async function gh(endpoint) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'agent-infra-directory',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  return res.json();
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.json'));
let updated = 0;
let skipped = 0;
const warnings = [];

for (const file of files) {
  const full = path.join(DIR, file);
  const data = JSON.parse(await readFile(full, 'utf8'));
  if (!data.github) {
    skipped++;
    continue;
  }
  const parsed = parseRepo(data.github);
  if (!parsed) {
    warnings.push(`${file}: 无法解析 github 链接`);
    skipped++;
    continue;
  }

  try {
    const repo = await gh(`/repos/${parsed.owner}/${parsed.repo}`);
    const before = data.stars;
    data.stars = repo.stargazers_count;
    data.starsAsOf = TODAY;
    if (!data.language && repo.language) data.language = repo.language;
    if (repo.archived) data.archived = true;
    else delete data.archived;
    if (repo.pushed_at) data.lastPush = repo.pushed_at.slice(0, 10);

    const spdx = repo.license?.spdx_id;
    const ghLicense = spdx && spdx !== 'NOASSERTION' ? spdx : null;
    if (ghLicense && data.license && !data.license.toUpperCase().includes(ghLicense.toUpperCase())) {
      warnings.push(
        `${file}: license 冲突 → 文件="${data.license}" / GitHub="${ghLicense}"`
      );
    }

    await writeFile(full, JSON.stringify(data, null, 2) + '\n');
    updated++;
    console.log(`✓ ${data.name}: ${before ?? '—'} → ${data.stars}`);
  } catch (e) {
    warnings.push(`${file}: ${e.status ?? ''} ${e.message}`);
    skipped++;
  }

  await new Promise((r) => setTimeout(r, 150));
}

console.log(`\nupdated=${updated} skipped=${skipped}`);
const rateLimited = warnings.filter((w) => w.includes('403'));
if (rateLimited.length && !TOKEN) {
  console.log(
    `\n⛔ 有 ${rateLimited.length} 个请求因未认证限流失败（GitHub 未认证上限为 60 次/小时）。` +
      `\n   设置 GITHUB_TOKEN 可提升至 5,000 次/小时，然后重新运行即可补齐缺失的 stars/language。` +
      `\n   示例：GITHUB_TOKEN=ghp_xxx npm run fetch:github`
  );
}
if (warnings.length) {
  console.log('\n⚠️  需要人工判断的项：');
  for (const w of warnings) console.log('  - ' + w);
}
