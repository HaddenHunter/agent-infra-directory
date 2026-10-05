export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** 七个一级分类。key 同时是路由 slug。 */
export const categories = {
  runtime: { en: 'Runtime & Orchestration', zh: '运行时与编排' },
  sandbox: { en: 'Execution Sandbox', zh: '执行沙箱与安全' },
  observability: { en: 'Observability', zh: '可观测性与调试' },
  identity: { en: 'Identity & Permission', zh: '身份与权限管理' },
  payment: { en: 'Payment Infrastructure', zh: '支付与商业化' },
  mcp: { en: 'MCP & Tooling', zh: 'MCP 工具协议与集成' },
  memory: { en: 'Memory & State', zh: '记忆与状态层' },
} as const;

export type CategoryKey = keyof typeof categories;
export const categoryKeys = Object.keys(categories) as CategoryKey[];

export const ui = {
  en: {
    siteName: 'AI Agent Infrastructure Directory',
    tagline:
      'A selection guide for AI Agent infrastructure — not a tool dump.',
    intro:
      'A bilingual, fact-checked directory of AI Agent infrastructure. Every entry is grouped by category and carries a self-contained, citable judgment.',
    allCategories: 'Categories',
    tools: 'tools',
    viewAll: 'View category',
    keyFact: 'Citable judgment',
    facts: 'Key facts',
    name: 'Name',
    category: 'Category',
    license: 'License',
    language: 'Language',
    selfHosted: 'Self-hosted',
    yes: 'Yes',
    no: 'No',
    stars: 'GitHub stars',
    source: 'Repository',
    updated: 'Last verified',
    relatedTools: 'Tools in this category',
    comparisons: 'Comparisons',
    backHome: 'Home',
    markdownVersion: 'Markdown version (for LLMs)',
    home: 'Home',
    readIn: '中文',
    news: 'News',
    newsIntro:
      'Agent-related launches, funding, security incidents and framework changes — each with a date, a source link and an explicit verification status.',
    allTypes: 'All',
    whyItMatters: 'Why it matters',
    newsSource: 'Source',
    verification: 'Verification',
    lastUpdated: 'Last updated',
  },
  zh: {
    siteName: 'AI Agent 基础设施目录',
    tagline: '帮开发者做选型决策的参考源，而非工具大全。',
    intro:
      '一份中英双语、逐条核验过的 AI Agent 基础设施目录。每个条目按分类组织，并附上一句自包含、可被引用的判断句。',
    allCategories: '分类',
    tools: '个工具',
    viewAll: '查看分类',
    keyFact: '可引用判断句',
    facts: '关键事实',
    name: '名称',
    category: '分类',
    license: '许可证',
    language: '语言',
    selfHosted: '可自托管',
    yes: '是',
    no: '否',
    stars: 'GitHub 星标',
    source: '代码仓库',
    updated: '核验日期',
    relatedTools: '本分类下的工具',
    comparisons: '对比',
    backHome: '首页',
    markdownVersion: 'Markdown 版本（供 LLM 读取）',
    home: '首页',
    readIn: 'English',
    news: '动态',
    newsIntro:
      'Agent 相关的产品发布、融资、安全事件与框架变更——每条都带日期、来源链接和明确的核验状态。',
    allTypes: '全部',
    whyItMatters: '推荐理由',
    newsSource: '来源',
    verification: '核验状态',
    lastUpdated: '最近更新',
  },
} as const;

export function t(locale: Locale) {
  return ui[locale];
}

/** 生成分类页 URL */
export function categoryUrl(locale: Locale, key: CategoryKey) {
  return locale === 'en' ? `/categories/${key}/` : `/zh/categories/${key}/`;
}

/** 生成工具详情页 URL */
export function toolUrl(locale: Locale, slug: string) {
  return locale === 'en' ? `/tools/${slug}/` : `/zh/tools/${slug}/`;
}

/** 生成工具 Markdown 直出版本 URL */
export function toolMarkdownUrl(locale: Locale, slug: string) {
  return locale === 'en' ? `/tools/${slug}.md` : `/zh/tools/${slug}.md`;
}

/** 生成对比页 URL */
export function compareUrl(locale: Locale, slug: string) {
  return locale === 'en' ? `/compare/${slug}/` : `/zh/compare/${slug}/`;
}

export const SITE_URL = 'https://agent.c8.fit';

/** 首页 URL */
export function homeUrl(locale: Locale) {
  return locale === 'en' ? '/' : '/zh/';
}
