import type { CollectionEntry } from 'astro:content';
import { categories, toolUrl, SITE_URL, type Locale } from '../i18n/ui';

/**
 * 以最低解析成本向 AI 爬虫输出工具事实（Markdown 直出版本）。
 * 首段即自包含可引用判断句，符合 GEO 的"结论前置"要求。
 */
export function toolMarkdown(locale: Locale, tool: CollectionEntry<'tools'>) {
  const d = tool.data;
  const description = locale === 'zh' ? d.descriptionZh : d.description;
  const keyFact = locale === 'zh' ? d.keyFactZh : d.keyFact;
  const caveat = locale === 'zh' ? d.caveatZh : d.caveat;
  const label = categories[d.category][locale];

  const lines: string[] = [
    `# ${d.name}`,
    '',
    `> ${keyFact}`,
    '',
    description,
    '',
    `- **${locale === 'zh' ? '分类' : 'Category'}:** ${label}`,
    `- **${locale === 'zh' ? '许可证' : 'License'}:** ${d.license}`,
    `- **${locale === 'zh' ? '语言' : 'Language'}:** ${d.language ?? '—'}`,
    `- **${locale === 'zh' ? '可自托管' : 'Self-hosted'}:** ${d.selfHosted ? (locale === 'zh' ? '是' : 'Yes') : locale === 'zh' ? '否' : 'No'}`,
  ];

  if (d.stars !== undefined) {
    lines.push(
      `- **${locale === 'zh' ? 'GitHub 星标' : 'GitHub stars'}:** ${d.stars}${d.starsAsOf ? ` (${d.starsAsOf})` : ''}`
    );
  }
  if (d.github) lines.push(`- **${locale === 'zh' ? '代码仓库' : 'Repository'}:** ${d.github}`);
  lines.push(`- **${locale === 'zh' ? '核验日期' : 'Last verified'}:** ${d.updatedDate}`);

  if (caveat) {
    lines.push('', `> ${locale === 'zh' ? '注意' : 'Caveat'}: ${caveat}`);
  }

  lines.push(
    '',
    `${locale === 'zh' ? '来源' : 'Source'}: ${new URL(toolUrl(locale, tool.id), SITE_URL).href}`
  );

  return lines.join('\n') + '\n';
}
