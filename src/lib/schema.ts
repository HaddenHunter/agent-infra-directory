import type { CollectionEntry } from 'astro:content';
import { SITE_URL, toolUrl, type CategoryKey, type Locale } from '../i18n/ui';
import { licenseKind } from './license';
import { benchmarkCategories, benchmarkUrl } from './benchmarks';

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

/**
 * 动态详情页 → NewsArticle。
 *
 * dateModified 用核验/发布时点本身，不用构建时间；publisher 直接引用
 * BaseLayout 已经在页面上声明的 Organization 节点。
 */
export function newsArticleSchema(locale: Locale, event: CollectionEntry<'events'>) {
  const d = event.data;
  const path = locale === 'zh' ? `/zh/news/${event.id}/` : `/news/${event.id}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: locale === 'zh' ? d.titleZh : d.title,
    description: locale === 'zh' ? d.summaryZh : d.summary,
    datePublished: d.eventDate,
    dateModified: d.eventDate,
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
    articleSection: d.type,
    url: new URL(path, SITE_URL).href,
    isBasedOn: d.sourceUrl,
    citation: d.sourceUrl,
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: new URL(path, SITE_URL).href,
  };
}

/**
 * 全站 WebSite + Organization 节点，由 BaseLayout 加在每个页面的图谱最前面。
 *
 * 之前全站没有任何实体节点：每个页面各自声明 SoftwareApplication / FAQPage，
 * 但没有东西说明「这些页面属于同一个发布方」。Organization 是 E-E-A-T 与 AI
 * 引擎判断可信度时最基础的一环，而 about / methodology 页正好是它的可验证落点。
 */
export function siteSchema(locale: Locale) {
  const zh = locale === 'zh';
  const orgId = `${SITE_URL}/#organization`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': orgId,
      name: 'AI Agent Infrastructure Directory',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      description: zh
        ? '一份中英双语、逐条核验过的 AI Agent 基础设施目录。'
        : 'A bilingual, fact-checked directory of AI Agent infrastructure.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'AI Agent Infrastructure Directory',
      url: SITE_URL,
      inLanguage: zh ? 'zh-CN' : 'en',
      publisher: { '@id': orgId },
    },
  ];
}

/**
 * 基准详情页 → Dataset，用于 Google Dataset Search。
 *
 * 只写有据可查的字段：creator 取来源机构名、citation/isBasedOn 取来源链接。
 * 不写 license —— 这些基准各自的许可没有逐条核验过，宁缺毋滥。
 * contested 条目不是数据集（它们纠正的是被误传的数字），调用方不要给它们挂这个 schema。
 */
export function datasetSchema(locale: Locale, benchmark: CollectionEntry<'benchmarks'>) {
  const d = benchmark.data;
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: d.name,
    description: locale === 'zh' ? d.descriptionZh : d.description,
    url: new URL(benchmarkUrl(locale, benchmark.id), SITE_URL).href,
    creator: { '@type': 'Organization', name: d.sourceName },
    citation: d.sourceUrl,
    isBasedOn: d.sourceUrl,
    dateModified: d.lastUpdated,
    keywords: [benchmarkCategories[d.category][locale], 'LLM agent', 'benchmark'],
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
  };
  return node;
}
