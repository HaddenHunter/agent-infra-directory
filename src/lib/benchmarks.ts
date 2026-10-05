export const benchmarkCategories = {
  general: { en: 'General capability', zh: '通用能力' },
  coding: { en: 'Coding', zh: '编码' },
  web: { en: 'Web', zh: '网页' },
  os: { en: 'Desktop / OS', zh: '桌面与操作系统' },
  safety: { en: 'Safety & security', zh: '安全' },
  mcp: { en: 'MCP', zh: 'MCP' },
  infra: { en: 'Infrastructure', zh: '基础设施' },
  contested: { en: 'Contested claims', zh: '常见错误说法' },
} as const;

export type BenchmarkCategory = keyof typeof benchmarkCategories;
export const benchmarkCategoryKeys = Object.keys(benchmarkCategories) as BenchmarkCategory[];

export const benchmarkIndexUrl = (locale: 'en' | 'zh') =>
  locale === 'en' ? '/benchmarks/' : '/zh/benchmarks/';

export const benchmarkUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/benchmarks/${slug}/` : `/zh/benchmarks/${slug}/`;

export const benchmarkMarkdownUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/benchmarks/${slug}.md` : `/zh/benchmarks/${slug}.md`;
