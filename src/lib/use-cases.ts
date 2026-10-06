import type { Locale } from '../i18n/ui';

export const useCaseScenarios = {
  medical: { en: 'Medical admin', zh: '医疗事务' },
  travel: { en: 'Travel', zh: '出行' },
  bills: { en: 'Bills & subscriptions', zh: '账单与订阅' },
  family: { en: 'Family', zh: '家庭' },
  business: { en: 'Business', zh: '商业' },
  content: { en: 'Content', zh: '内容创作' },
  'life-admin': { en: 'Life admin', zh: '生活事务' },
} as const;

export type UseCaseScenario = keyof typeof useCaseScenarios;
export const useCaseScenarioKeys = Object.keys(useCaseScenarios) as UseCaseScenario[];

export const useCaseIndexUrl = (locale: Locale) =>
  locale === 'zh' ? '/zh/use-cases/' : '/use-cases/';

export const useCaseUrl = (locale: Locale, slug: string) =>
  locale === 'zh' ? `/zh/use-cases/${slug}/` : `/use-cases/${slug}/`;
