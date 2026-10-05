import type { CollectionEntry } from 'astro:content';
import { SITE_URL, toolUrl, type CategoryKey, type Locale } from '../i18n/ui';
import { licenseKind } from './license';

/** 工具详情页 → SoftwareApplication */
export function toolSchema(locale: Locale, tool: CollectionEntry<'tools'>) {
  const d = tool.data;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: d.name,
    description: locale === 'zh' ? d.descriptionZh : d.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux, macOS, Windows',
    url: new URL(toolUrl(locale, tool.id), SITE_URL).href,
  };
  if (d.github) schema.codeRepository = d.github;
  const kind = licenseKind(d.license);
  if (kind === 'open' || kind === 'source-available') {
    schema.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
  }
  return schema;
}

/** 分类页 → ItemList */
export function itemListSchema(
  locale: Locale,
  category: CategoryKey,
  label: string,
  tools: CollectionEntry<'tools'>[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: label,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.data.name,
      url: new URL(toolUrl(locale, tool.id), SITE_URL).href,
    })),
    url: new URL(
      locale === 'en' ? `/categories/${category}/` : `/zh/categories/${category}/`,
      SITE_URL
    ).href,
  };
}

/** 对比页 → FAQPage */
export function faqSchema(qas: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
