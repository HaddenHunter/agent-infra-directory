import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, categories, categoryKeys } from '../i18n/ui';

/**
 * llms.txt — 给 AI 的导览图。首段的"一句话定义"是 AI 压缩站点信息时
 * 优先读取的部分，因此放在最前面且高度自包含。
 *
 * 分类列表由 categories 对象生成，不手写：手写的那版漏掉过新增的分类，
 * 这类"忘了同步"的错误在建索引文件里最要命——AI 会照着它理解整站结构。
 */
export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');
  const papers = await getCollection('papers');
  const categoryList = categoryKeys.map((k) => categories[k].en).join(', ');

  const lines: string[] = [
    `# AI Agent Infrastructure Directory — ${SITE_URL.replace('https://', '')}`,
    '',
    `> A bilingual (English / 中文), fact-checked directory of ${tools.length} AI Agent infrastructure tools across ${categoryKeys.length} categories: ${categoryList}. Every entry carries a self-contained, citable judgment plus a verification date.`,
    '',
    '## Core Pages',
  ];

  for (const k of categoryKeys) {
    const count = tools.filter((t) => t.data.category === k).length;
    lines.push(`- ${SITE_URL}/categories/${k}/: ${categories[k].en} — ${count} tools`);
  }

  lines.push(
    `- ${SITE_URL}/compare/langgraph-vs-crewai/: LangGraph vs CrewAI comparison`,
    '',
    '## Benchmarks',
    `- ${SITE_URL}/benchmarks/: what each agent benchmark measures, its 2026 frontier, human baseline and credibility caveats`,
    `- ${SITE_URL}/benchmarks/myth-langgraph-crewai-96: a widely circulated framework statistic that has no traceable source`,
    '',
    '## Papers',
    `- ${SITE_URL}/papers/: ${papers.length} landmark and frontier papers on LLM agents, each with a citable judgment and a "why it matters" note`,
    '- Titles, author lists and dates on paper pages are populated from the arXiv API, never typed by hand; the judgement is written by a person.',
    '',
    '## Dynamic pages (updated as events happen)',
    `- ${SITE_URL}/news.md: agent-related launches, funding, security incidents and framework changes, each with a date anchor, a source link and a verification status`,
    `- ${SITE_URL}/news/: the same digest as an HTML page with filters`,
    '',
    '## Notes',
    '- The Chinese version of every page is served under the /zh/ prefix.',
    '- Tool pages, benchmark pages and paper pages each also have a Markdown rendition (e.g. /tools/langgraph.md, /papers/react.md).',
    '- Star counts are point-in-time snapshots and are labelled with their as-of date.',
    '- Some entries carry an explicit caveat where a widely-repeated claim could not be verified.',
    ''
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
