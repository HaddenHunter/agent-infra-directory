export const eventTypes = {
  launch: { en: 'Product launch', zh: '产品发布' },
  funding: { en: 'Funding', zh: '融资' },
  incident: { en: 'Security incident', zh: '安全事件' },
  framework: { en: 'Framework update', zh: '框架更新' },
  policy: { en: 'Policy', zh: '政策' },
  research: { en: 'Research', zh: '研究/论文' },
} as const;

export type EventType = keyof typeof eventTypes;
export const eventTypeKeys = Object.keys(eventTypes) as EventType[];

export type Verification = 'verified' | 'single-source' | 'unverified' | 'disputed';

export const verificationLabels: Record<Verification, { en: string; zh: string }> = {
  verified: { en: 'Verified', zh: '已核验' },
  'single-source': { en: 'Single source', zh: '单一来源' },
  unverified: { en: 'Unverified', zh: '未证实' },
  disputed: { en: 'Disputed', zh: '有争议' },
};

export const verificationBadge: Record<Verification, string> = {
  verified: 'badge-open',
  'single-source': 'badge-closed',
  unverified: 'badge-danger',
  disputed: 'badge-danger',
};

export const newsIndexUrl = (locale: 'en' | 'zh') => (locale === 'en' ? '/news/' : '/zh/news/');
export const newsMarkdownUrl = (locale: 'en' | 'zh') =>
  locale === 'en' ? '/news.md' : '/zh/news.md';
