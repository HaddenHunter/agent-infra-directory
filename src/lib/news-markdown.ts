import type { CollectionEntry } from 'astro:content';
import { eventTypes, verificationLabels, type Verification } from './news';
import type { Locale } from '../i18n/ui';

/**
 * 把动态条目渲染为 Markdown 摘要流，供 AI 爬虫以最低成本读取。
 * 每条都带日期锚点与核验状态——时效性内容必须让读者知道"这条什么时候成立"。
 */
export function newsDigestMarkdown(locale: Locale, events: CollectionEntry<'events'>[]) {
  const sorted = [...events].sort((a, b) => b.data.eventDate.localeCompare(a.data.eventDate));

  const head =
    locale === 'zh'
      ? [
          '# Agent 动态 — agent.c8.fit',
          '',
          `> 共 ${sorted.length} 条 Agent 相关动态，每条包含日期锚点、来源链接与核验状态（已核验 / 单一来源 / 未证实 / 有争议）。`,
          '',
          '- 分类：' +
            Object.values(eventTypes)
              .map((v) => v.zh)
              .join('、'),
          '',
        ]
      : [
          '# Agent news — agent.c8.fit',
          '',
          `> ${sorted.length} agent-related entries, each with a date anchor, a source link and an explicit verification status (verified / single source / unverified / disputed).`,
          '',
          '- Categories: ' +
            Object.values(eventTypes)
              .map((v) => v.en)
              .join(', '),
          '',
        ];

  const body: string[] = [];
  let currentDate = '';

  for (const e of sorted) {
    const d = e.data;
    if (d.eventDate !== currentDate) {
      currentDate = d.eventDate;
      body.push(`## ${currentDate}`, '');
    }
    const title = locale === 'zh' ? d.titleZh : d.title;
    const summary = locale === 'zh' ? d.summaryZh : d.summary;
    const why = locale === 'zh' ? d.whyItMattersZh : d.whyItMatters;
    const caveat = locale === 'zh' ? d.caveatZh : d.caveat;
    const keyFact = locale === 'zh' ? d.keyFactZh : d.keyFact;

    body.push(`### ${title}`);
    body.push('');
    body.push(`> ${keyFact}`);
    body.push('');
    body.push(summary);
    body.push('');
    body.push(
      `- **${locale === 'zh' ? '分类' : 'Type'}:** ${eventTypes[d.type][locale]}`,
      `- **${locale === 'zh' ? '核验状态' : 'Verification'}:** ${verificationLabels[d.verification as Verification][locale]}`,
      `- **${locale === 'zh' ? '来源' : 'Source'}:** [${d.sourceName}](${d.sourceUrl})`
    );
    if (d.details.length) {
      for (const row of d.details) {
        body.push(`- **${locale === 'zh' ? row.labelZh : row.label}:** ${row.value}`);
      }
    }
    if (why) body.push('', `**${locale === 'zh' ? '推荐理由' : 'Why it matters'}:** ${why}`);
    if (caveat) body.push('', `> ${locale === 'zh' ? '注意' : 'Caveat'}: ${caveat}`);
    body.push('');
  }

  return [...head, ...body].join('\n');
}
