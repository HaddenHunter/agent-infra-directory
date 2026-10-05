import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, categories, categoryKeys } from '../i18n/ui';

/**
 * llms.txt — 给 AI 的导览图。首段的"一句话定义"是 AI 压缩站点信息时
 * 优先读取的部分，因此放在最前面且高度自包含。
 */
export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');

  const lines: string[] = [
    '# AI Agent Infrastructure Directory — agentinfra.dev',
    '',
    `> A bilingual (English / 中文), fact-checked directory of ${tools.length} AI Agent infrastructure tools across ${categoryKeys.length} categories: runtime & orchestration, execution sandbox, observability, identity & permission, payment, MCP tooling, and memory. Every entry carries a self-contained, citable judgment plus a verification date.`,
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
    '## Dynamic pages (updated as events happen)',
    `- ${SITE_URL}/news.md: agent-related launches, funding, security incidents and framework changes, each with a date anchor, a source link and a verification status`,
    `- ${SITE_URL}/news/: the same digest as an HTML page with filters`,
    '',
    '## Notes',
    '- The Chinese version of every page is served under the /zh/ prefix.',
    '- Every tool page also has a Markdown rendition at /tools/{slug}.md (e.g. /tools/langgraph.md).',
    '- Star counts are point-in-time snapshots and are labelled with their as-of date.',
    '- Some entries carry an explicit caveat where a widely-repeated claim could not be verified.',
    ''
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
