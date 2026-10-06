import type { CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
import { benchmarkUrl } from './benchmarks';
import { eventTypes, newsIndexUrl, type Verification } from './news';

export interface MythEntry {
  id: string;
  title: string;
  kindLabel: string;
  /** 被广泛重复的那句话 */
  claim: string;
  /** 核对之后的结论 */
  correction: string;
  /** 可独立引用的判断句 */
  keyFact: string;
  verification: Verification;
  sourceName: string;
  sourceUrl: string;
  date: string;
  /** 站内详情页；use-cases 目前没有详情路由，故为 null */
  href: string | null;
}

export interface Myths {
  /** 被明确标注为「误传」的说法 */
  claims: MythEntry[];
  /** 条目主体成立、但某个常被转述的细节不成立 */
  flags: MythEntry[];
}

/**
 * 汇总全站「经不起核对的常见说法」。
 *
 * 两条来源分工不同：
 *   - `debunks` 是条目本身要纠正的说法（多来自 contested 基准与 myth-* 用例）；
 *   - `caveat` 是条目主体成立、但某个细节常被说错的情况（多来自动态）。
 * 因此分成 claims / flags 两组展示，不混在一起。
 */
export function collectMyths(
  locale: Locale,
  input: {
    benchmarks: CollectionEntry<'benchmarks'>[];
    useCases: CollectionEntry<'useCases'>[];
    events: CollectionEntry<'events'>[];
  }
): Myths {
  const zh = locale === 'zh';
  const claims: MythEntry[] = [];
  const flags: MythEntry[] = [];

  for (const b of input.benchmarks) {
    const d = b.data;
    const base = {
      id: b.id,
      title: d.name,
      kindLabel: zh ? '基准' : 'Benchmark',
      verification: d.verification,
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl,
      date: d.lastUpdated,
      href: benchmarkUrl(locale, b.id),
    };
    if (d.debunks) {
      claims.push({
        ...base,
        claim: zh ? d.debunksZh ?? d.debunks : d.debunks,
        correction: zh ? d.credibilityZh : d.credibility,
        keyFact: zh ? d.keyFactZh : d.keyFact,
      });
    } else if (d.caveat) {
      flags.push({
        ...base,
        claim: zh ? d.caveatZh ?? d.caveat : d.caveat,
        correction: zh ? d.keyFactZh : d.keyFact,
        keyFact: zh ? d.keyFactZh : d.keyFact,
      });
    }
  }

  for (const u of input.useCases) {
    const d = u.data;
    const base = {
      id: u.id,
      title: zh ? d.titleZh : d.title,
      kindLabel: zh ? '真实用例' : 'Use case',
      verification: d.verification,
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl,
      date: d.sourceDate,
      href: null,
    };
    if (d.debunks) {
      claims.push({
        ...base,
        claim: zh ? d.debunksZh ?? d.debunks : d.debunks,
        correction: zh ? d.outcomeZh : d.outcome,
        keyFact: zh ? d.keyFactZh : d.keyFact,
      });
    } else if (d.caveat) {
      flags.push({
        ...base,
        claim: zh ? d.caveatZh ?? d.caveat : d.caveat,
        correction: zh ? d.keyFactZh : d.keyFact,
        keyFact: zh ? d.keyFactZh : d.keyFact,
      });
    }
  }

  for (const e of input.events) {
    const d = e.data;
    if (!d.caveat) continue;
    flags.push({
      id: e.id,
      title: zh ? d.titleZh : d.title,
      kindLabel: eventTypes[d.type][locale],
      verification: d.verification,
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl,
      date: d.eventDate,
      href: `${newsIndexUrl(locale)}#${e.id}`,
      claim: zh ? d.caveatZh : d.caveat,
      correction: zh ? d.keyFactZh : d.keyFact,
      keyFact: zh ? d.keyFactZh : d.keyFact,
    });
  }

  const byDateDesc = (a: MythEntry, b: MythEntry) => b.date.localeCompare(a.date);
  return { claims: claims.sort(byDateDesc), flags: flags.sort(byDateDesc) };
}
