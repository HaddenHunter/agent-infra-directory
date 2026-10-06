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

/** 主题页导语。写的是「这一类论文在解决什么」，不涉及具体结论，避免和条目抢口径。 */
export const paperCategoryBlurbs: Record<PaperCategory, { en: string; zh: string }> = {
  reasoning: {
    en: 'How a model plans and revises before it acts — chain-of-thought, search over intermediate thoughts, and self-critique after a failed attempt.',
    zh: '模型在动手之前如何规划与修正：思维链、对中间思路的搜索，以及失败之后的自我批判。',
  },
  'tool-use': {
    en: 'Getting a model to call external tools and APIs, and treating code editing itself as the action space.',
    zh: '让模型调用外部工具与 API，以及把「修改代码」本身当作动作空间。',
  },
  'multi-agent': {
    en: 'Several agents with distinct roles or contexts working one task, and what the extra hops between them cost.',
    zh: '多个持有不同角色或上下文的 Agent 完成同一任务，以及它们之间多出来的传递代价。',
  },
  environment: {
    en: 'The world an agent acts in — browsers, desktops, and game-like sandboxes that stand in for production.',
    zh: 'Agent 所处的世界：浏览器、桌面，以及用来替代真实环境的类游戏沙箱。',
  },
  evaluation: {
    en: 'Benchmarks and task suites that score agents, together with the reporting caveats that decide whether a score means anything.',
    zh: '给 Agent 打分的基准与任务集，以及决定这些分数是否有意义的口径问题。',
  },
  safety: {
    en: 'Failure modes specific to agents that act: injected instructions, unsafe tool use, and the harness wrapped around the model.',
    zh: '「会动手」的 Agent 特有的失败模式：被注入的指令、不安全的工具使用，以及包住模型的框架本身。',
  },
};

export const papersIndexUrl = (locale: 'en' | 'zh') =>
  locale === 'en' ? '/papers/' : '/zh/papers/';

export const paperTopicsIndexUrl = (locale: 'en' | 'zh') =>
  locale === 'en' ? '/papers/topics/' : '/zh/papers/topics/';

export const paperTopicUrl = (locale: 'en' | 'zh', key: PaperCategory) =>
  locale === 'en' ? `/papers/topics/${key}/` : `/zh/papers/topics/${key}/`;

export const paperUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/papers/${slug}/` : `/zh/papers/${slug}/`;

export const paperMarkdownUrl = (locale: 'en' | 'zh', slug: string) =>
  locale === 'en' ? `/papers/${slug}.md` : `/zh/papers/${slug}.md`;

/** arXiv 摘要页。论文的唯一权威入口，站内不做 PDF 镜像。 */
export const arxivUrl = (arxivId: string) => `https://arxiv.org/abs/${arxivId}`;
