import type { CollectionEntry } from 'astro:content';
import { benchmarkCategories } from './benchmarks';
import { verificationLabels, type Verification } from './news';
import type { Locale } from '../i18n/ui';

/** 基准页的 Markdown 直出版本，供 AI 爬虫低成本读取。 */
export function benchmarkMarkdown(locale: Locale, b: CollectionEntry<'benchmarks'>) {
  const d = b.data;
  const lines: string[] = [
    `# ${d.name}`,
    '',
    `> ${locale === 'zh' ? d.keyFactZh : d.keyFact}`,
    '',
    locale === 'zh' ? d.descriptionZh : d.description,
    '',
    `- **${locale === 'zh' ? '分类' : 'Category'}:** ${benchmarkCategories[d.category][locale]}`,
    `- **${locale === 'zh' ? '2026 前沿' : '2026 frontier'}:** ${locale === 'zh' ? d.frontierZh : d.frontier}`,
  ];

  if (d.humanBaseline) {
    lines.push(
      `- **${locale === 'zh' ? '人类基线' : 'Human baseline'}:** ${d.humanBaseline}`
    );
  }

  lines.push(
    `- **${locale === 'zh' ? '可信度' : 'Credibility'}:** ${locale === 'zh' ? d.credibilityZh : d.credibility}`,
    `- **${locale === 'zh' ? '核验状态' : 'Verification'}:** ${verificationLabels[d.verification as Verification][locale]}`,
    `- **${locale === 'zh' ? '来源' : 'Source'}:** [${d.sourceName}](${d.sourceUrl})`,
    `- **${locale === 'zh' ? '更新日期' : 'Last updated'}:** ${d.lastUpdated}`
  );

  const debunks = locale === 'zh' ? d.debunksZh : d.debunks;
  if (debunks) {
    lines.push('', `> ${locale === 'zh' ? '常见错误说法' : 'Contested claim'}: ${debunks}`);
  }

  return lines.join('\n') + '\n';
}
