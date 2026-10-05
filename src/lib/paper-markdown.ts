import type { CollectionEntry } from 'astro:content';
import { arxivUrl, paperCategories, paperTiers } from './papers';
import type { Locale } from '../i18n/ui';

/**
 * 论文页的 Markdown 直出版本。
 *
 * 与工具/基准的 .md 端点一致：给 AI 爬虫一条不需要解析 HTML 的读取路径。
 * 作者、日期这些由 arXiv API 回填的字段在这里原样输出，不做二次改写。
 */
export function paperMarkdown(locale: Locale, p: CollectionEntry<'papers'>) {
  const d = p.data;
  const zh = locale === 'zh';
  const lines = [
    `# ${d.name}`,
    '',
    `> ${zh ? d.keyFactZh : d.keyFact}`,
    '',
    zh ? d.titleZh : d.title,
    '',
    `- **${zh ? '层级' : 'Tier'}:** ${paperTiers[d.tier][locale]}`,
    `- **${zh ? '分类' : 'Category'}:** ${paperCategories[d.category][locale]}`,
    `- **${zh ? '首次提交' : 'First posted'}:** ${d.publishedDate}`,
    `- **${zh ? '最新修订' : 'Latest revision'}:** ${d.updatedDate}`,
    `- **${zh ? '作者' : 'Authors'}:** ${d.authors.join(', ')}`,
    `- **arXiv:** [${d.arxivId}](${arxivUrl(d.arxivId)})`,
    '',
    zh ? d.summaryZh : d.summary,
    '',
    `## ${zh ? '为什么重要' : 'Why it matters'}`,
    '',
    zh ? d.whyItMattersZh : d.whyItMatters,
  ];

  return lines.join('\n') + '\n';
}
