#!/usr/bin/env node
/**
 * 「诚实版」新闻采集流水线。
 *
 * 设计原则：这条流水线只负责"收集与分诊"，绝不负责"断定事实"。
 *   - 它抓 RSS、按关键词过滤、去重，然后把结果写进 content-inbox/ 作为**候选**。
 *   - 候选带 status: 'needs-review'，且**不会**出现在站点的任何页面上。
 *     （站点的 events 集合只读取 src/content/events/，而不是 content-inbox/）
 *   - 人工在 content-inbox 里挑出值得收录的，补齐 keyFact / whyItMatters 等字段，
 *     手动移动到 src/content/events/ 并设置 verification 后才能发布。
 *
 * 这样做的原因：本站在多个方案里查出过编造的用户故事与基准数字。任何
 * "抓取 → LLM 生成 → 直接发布"的链路都会把这类错误以机器速度印到站上。
 *
 * 用法：npm run fetch:news
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const INBOX_DIR = path.resolve('content-inbox');
const INBOX_FILE = path.join(INBOX_DIR, 'news-candidates.json');
const EVENTS_DIR = path.resolve('src/content/events');

/** 与 Agent 相关的过滤词。命中任意一个即进入候选。 */
const KEYWORDS = [
  'agent',
  'agentic',
  'mcp',
  'model context protocol',
  'sandbox',
  'tool use',
  'tool-use',
  'multi-agent',
  'orchestration',
  'harness',
  '智能体',
  '沙箱',
  '工具调用',
];

/**
 * 信息源。注意：RSS 地址会变，脚本会逐个报告抓取结果，
 * 失败的源在输出里一目了然，不会静默跳过。
 */
const FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/feed/' },
  { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/' },
  { name: 'Hacker News (agent)', url: 'https://hnrss.org/newest?q=agent&count=30' },
  { name: 'arXiv cs.AI', url: 'http://export.arxiv.org/rss/cs.AI' },
];

/** 只看最近多少天内的条目，避免把整站历史归档倒进待审队列 */
const MAX_AGE_DAYS = 21;
/** 每个源最多产出多少条候选，防止单个大源淹没队列 */
const MAX_PER_FEED = 25;

const UA = 'agent-infra-directory-news-collector/0.1 (+https://agent.c8.fit)';

function stripTags(s) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? stripTags(m[1]) : '';
}

/** 极简 RSS/Atom 解析：不引依赖，够用即可。 */
function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/gi) || [];
  return blocks.map((b) => {
    let link = pick(b, 'link');
    if (!link) {
      const href = b.match(/<link[^>]*href="([^"]+)"/i);
      if (href) link = href[1];
    }
    const description = pick(b, 'description') || pick(b, 'summary') || pick(b, 'content');
    return {
      title: pick(b, 'title'),
      link,
      publishedAt: pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated'),
      excerpt: description.slice(0, 400),
    };
  });
}

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** 已经进入正式集合的 URL，用于去重 */
async function publishedUrls() {
  const urls = new Set();
  try {
    for (const f of await readdir(EVENTS_DIR)) {
      if (!f.endsWith('.json')) continue;
      const d = JSON.parse(await readFile(path.join(EVENTS_DIR, f), 'utf8'));
      if (d.sourceUrl) urls.add(d.sourceUrl);
    }
  } catch {
    /* 目录不存在时忽略 */
  }
  return urls;
}

const existing = await loadJson(INBOX_FILE, []);
const known = new Set(existing.map((c) => c.link));
const published = await publishedUrls();

const report = [];
const added = [];

for (const feed of FEEDS) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      report.push(`✗ ${feed.name}: HTTP ${res.status}`);
      continue;
    }
    const xml = await res.text();
    const items = parseFeed(xml);

    let hits = 0;
    let skippedOld = 0;
    for (const item of items) {
      if (hits >= MAX_PER_FEED) break;
      if (!item.title || !item.link) continue;
      if (known.has(item.link) || published.has(item.link)) continue;

      // 时效过滤：日期可解析且过旧则跳过；解析不出则保留（宁多审不可漏）
      const ts = Date.parse(item.publishedAt);
      if (!Number.isNaN(ts)) {
        const ageDays = (Date.now() - ts) / 86400000;
        if (ageDays > MAX_AGE_DAYS) {
          skippedOld++;
          continue;
        }
      }

      const hay = `${item.title} ${item.excerpt}`.toLowerCase();
      const matched = KEYWORDS.filter((k) => hay.includes(k.toLowerCase()));
      if (!matched.length) continue;

      const candidate = {
        ...item,
        source: feed.name,
        matchedKeywords: matched,
        status: 'needs-review',
        fetchedAt: new Date().toISOString().slice(0, 10),
      };
      existing.push(candidate);
      known.add(item.link);
      added.push(candidate);
      hits++;
    }
    report.push(
      `✓ ${feed.name}: ${items.length} items, ${hits} new candidates` +
        (skippedOld ? `, ${skippedOld} skipped as older than ${MAX_AGE_DAYS}d` : '')
    );
  } catch (e) {
    report.push(`✗ ${feed.name}: ${e.message}`);
  }
}

await mkdir(INBOX_DIR, { recursive: true });
await writeFile(INBOX_FILE, JSON.stringify(existing, null, 2) + '\n');

console.log('采集结果：');
for (const line of report) console.log('  ' + line);
console.log(`\n新增候选 ${added.length} 条，累计待审 ${existing.length} 条`);
console.log(`待审文件：content-inbox/news-candidates.json`);
console.log(
  '\n⚠️  这些候选不会出现在站点上。请人工挑选、补齐 keyFact 与 whyItMatters 后，' +
    '\n   再移动到 src/content/events/ 并设置 verification。'
);
