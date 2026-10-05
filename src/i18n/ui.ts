export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** 八个一级分类。key 同时是路由 slug。 */
export const categories = {
  'personal-agent': { en: 'Personal Agents', zh: '个人智能体' },
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
    benchmarks: 'Benchmarks',
    benchmarksIntro:
      'What each agent benchmark actually measures, how credible it is, and which widely repeated numbers do not survive checking. Every entry states its frontier level and its caveats.',
    frontier: '2026 frontier',
    humanBaseline: 'Human baseline',
    credibility: 'Credibility',
    contested: 'Contested claim',
    ecoTitle: 'Ecosystem distribution',
    ecoIntro:
      'How the entries in this directory break down by category, license and hosting model. Every figure is computed from the published dataset.',
    ecoLicense: 'License openness',
    ecoHosting: 'Hosting model',
    ecoOpen: 'Open / source-available',
    ecoProprietary: 'Proprietary / no assertion',
    ecoManaged: 'Managed / SaaS',
    ecoNote:
      'Counts come from the published dataset. GitHub star counts are left out of these charts because they only exist for a subset of entries, which would make any total misleading.',
    papers: 'Papers',
    papersIntro:
      'Landmark and frontier papers on LLM agents — the ones that introduced a loop, a benchmark or a failure mode the field now takes for granted. Titles, authors and dates are pulled from the arXiv API, never typed by hand; the judgement is written by a person.',
    authors: 'Authors',
    firstPosted: 'First posted',
    latestRevision: 'Latest revision',
    arxiv: 'arXiv',
    readOnArxiv: 'Read on arXiv',
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
    benchmarks: '评测与基准',
    benchmarksIntro:
      '每个 Agent 基准究竟在测什么、可信度如何，以及哪些广为流传的数字经不起核对。每个条目都写明前沿水平与可信度提示。',
    frontier: '2026 前沿',
    humanBaseline: '人类基线',
    credibility: '可信度',
    contested: '常见的错误说法',
    ecoTitle: '生态分布',
    ecoIntro:
      '本目录收录条目在分类、许可证与部署形态上的分布。所有数字均由已发布数据集计算得出。',
    ecoLicense: '许可证开放度',
    ecoHosting: '部署形态',
    ecoOpen: '开源 / 源码可见',
    ecoProprietary: '专有 / 未声明',
    ecoManaged: '托管 / SaaS',
    ecoNote:
      '数字来自已发布数据集。GitHub 星标未纳入图表，因为它只覆盖部分条目，求总和会得出误导性的结论。',
    papers: '前沿论文',
    papersIntro:
      '关于 LLM 智能体的里程碑与前沿论文——那些提出了某种循环、某个基准或某种失败模式的文章。标题、作者与日期全部取自 arXiv API，绝不手写；判断部分由人写。',
    authors: '作者',
    firstPosted: '首次提交',
    latestRevision: '最新修订',
    arxiv: 'arXiv',
    readOnArxiv: '在 arXiv 阅读',
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
