export type LicenseKind = 'open' | 'source-available' | 'proprietary' | 'standard' | 'unknown';

/**
 * 把自由文本的 license 字段归一为可比较的分类。
 * 顺序很重要：先判 unknown，再判 standard，再判 proprietary，
 * 最后才是 source-available —— 因为 "Proprietary (platform); SDK is Apache-2.0"
 * 这类混合描述应归为专有，而 "Elastic License 2.0" 属于 source-available。
 */
export function licenseKind(license: string): LicenseKind {
  const l = license.toLowerCase();
  if (l.includes('noassertion')) return 'unknown';
  if (/open standard|internet-draft|specification/.test(l)) return 'standard';
  if (l.includes('proprietary')) return 'proprietary';
  if (/sustainable|elastic license|elv2|dify open source|fair-code|source-available/.test(l)) {
    return 'source-available';
  }
  return 'open';
}

export const licenseLabels: Record<LicenseKind, { en: string; zh: string }> = {
  open: { en: 'Open source', zh: '开源' },
  'source-available': { en: 'Source-available', zh: '源码可见' },
  proprietary: { en: 'Proprietary', zh: '专有' },
  standard: { en: 'Standard / spec', zh: '标准/规范' },
  unknown: { en: 'License unclear', zh: '许可不明' },
};

export const licenseBadgeClass: Record<LicenseKind, string> = {
  open: 'badge-open',
  'source-available': 'badge-closed',
  proprietary: 'badge-closed',
  standard: 'badge-neutral',
  unknown: 'badge-neutral',
};
