export const paperTiers = {
  landmark: { en: 'Landmark', zh: '里程碑' },
  frontier: { en: 'Frontier', zh: '前沿' },
} as const;

export type PaperTier = keyof typeof paperTiers;
export const paperTierKeys = Object.keys(paperTiers) as PaperTier[];

export const paperCategories = {
  reasoning: { en: 'Reasoning', zh: '推理' },
  'tool-use': { en: 'Tool use', zh: '工具使用' },
  'multi-agent': { en: 'Multi-agent', zh: '多智能体' },
  environment: { en: 'Environments', zh: '交互环境' },
  evaluation: { en: 'Evaluation', zh: '评测' },
  safety: { en: 'Safety', zh: '安全' },
} as const;

export type PaperCategory = keyof typeof paperCategories;
export const paperCategoryKeys = Object.keys(paperCategories) as PaperCategory[];

export const papersIndexUrl = (locale: 'en' | 'zh') =>
  locale === 'en' ? '/papers/' : '/zh/papers/';

export const paperUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/papers/${slug}/` : `/zh/papers/${slug}/`;

export const paperMarkdownUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/papers/${slug}.md` : `/zh/papers/${slug}.md`;

/** arXiv 摘要页。论文的唯一权威入口，站内不做 PDF 镜像。 */
export const arxivUrl = (arxivId: string) => `https://arxiv.org/abs/${arxivId}`;
