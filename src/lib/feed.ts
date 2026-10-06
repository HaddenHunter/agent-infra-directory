import type { CollectionEntry } from 'astro:content';
import { SITE_URL, t, type Locale } from '../i18n/ui';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const pubDate = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();

/**
 * 动态栏目的 RSS 2.0 订阅源。
 *
 * news 是站内唯一的时效性栏目，也是外部聚合器唯一值得订阅的内容，
 * 所以 feed 只覆盖 events。每条 item 指向该条的详情页（/news/<id>/），
 * pubDate 用事件发生日而不是抓取日。
 */
export function eventFeed(locale: Locale, events: CollectionEntry<'events'>[]) {
  const s = t(locale);
  const zh = locale === 'zh';
  const feedPath = zh ? '/zh/rss.xml' : '/rss.xml';
  const newsPath = zh ? '/zh/news/' : '/news/';

  const sorted = [...events].sort((a, b) =>
    b.data.eventDate.localeCompare(a.data.eventDate)
  );

  const items = sorted.map((e) => {
    const d = e.data;
    const title = zh ? d.titleZh : d.title;
    const keyFact = zh ? d.keyFactZh : d.keyFact;
    const itemUrl = `${newsPath}${e.id}/`;
    return [
      '    <item>',
      `      <title>${esc(title)}</title>`,
      `      <link>${SITE_URL}${itemUrl}</link>`,
      `      <guid isPermaLink="false">${SITE_URL}${itemUrl}</guid>`,
      `      <pubDate>${pubDate(d.eventDate)}</pubDate>`,
      `      <category>${esc(d.type)}</category>`,
      `      <description>${esc(keyFact)}</description>`,
      '    </item>',
    ].join('\n');
  });

  const latest = sorted[0]?.data.eventDate;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${s.siteName} — ${s.news}`)}</title>
    <link>${SITE_URL}${newsPath}</link>
    <atom:link href="${SITE_URL}${feedPath}" rel="self" type="application/rss+xml" />
    <description>${esc(s.newsIntro)}</description>
    <language>${zh ? 'zh-CN' : 'en'}</language>
${latest ? `    <lastBuildDate>${pubDate(latest)}</lastBuildDate>` : ''}
${items.join('\n')}
  </channel>
</rss>
`;
}
