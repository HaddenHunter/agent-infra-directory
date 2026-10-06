import type { CollectionEntry } from 'astro:content';
import { categories, type CategoryKey, type Locale } from '../i18n/ui';
import { licenseKind, licenseLabels } from './license';

export interface ComparisonDimension {
  label: string;
  labelZh: string;
  valueA: string;
  valueB: string;
}

/**
 * 对比页的统一视图模型。
 *
 * 全站有两种对比：
 *  - 编辑型（src/content/comparisons/*.json）：人写 summary 与 dimensions，
 *    判断部分由人负责。
 *  - 数据型（本文件派生）：表格每一行都直接取自两个工具条目自己的已发布字段，
 *    不引入任何新主张。所以它们敢批量生成——内容再薄也是可核对的，
 *    而不是把猜测写成对比。
 *
 * dimensions 只有编辑型才带。数据型的维度值是随语言变的（「未提供 / Not stated」），
 * 必须在页面里按 locale 现算，不能在这里烤死。
 */
export interface ComparisonView {
  slug: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  toolA: string;
  toolB: string;
  editorial: boolean;
  dimensions?: ComparisonDimension[];
}

type Tool = CollectionEntry<'tools'>;

/** 每个分类最多出几对，避免高星分类把长尾分类挤没 */
const PER_CATEGORY = 8;
/** 总量上限：一次性放太多新页会让整批都卡在「已抓取未编入索引」 */
const TOTAL_LIMIT = 40;

const slugOf = (a: Tool, b: Tool) => `${a.id}-vs-${b.id}`;

/** 星标只在两边都有时才能比；缺星标的条目留在工具页，不进对比页 */
function hasStars(t: Tool): boolean {
  return typeof t.data.stars === 'number';
}

/** 排序键：取两边星标的较小值，避免「巨无霸 + 小工具」这类对比价值低的组合排前面 */
function pairWeight(a: Tool, b: Tool): number {
  const sa = a.data.stars ?? 0;
  const sb = b.data.stars ?? 0;
  return Math.min(sa, sb) * 1e6 + (sa + sb);
}

/**
 * 挑出要生成的数据型对比。
 *
 * 规则：同分类、双方都有星标 → 每分类取前 PER_CATEGORY 对 → 各分类轮转交错
 * → 取前 TOTAL_LIMIT 对。全程确定性排序，不依赖文件系统返回顺序。
 */
export function selectDerivedPairs(tools: Tool[], taken: Set<string>): [Tool, Tool][] {
  const byCategory = new Map<CategoryKey, [Tool, Tool][]>();
  for (const key of Object.keys(categories) as CategoryKey[]) {
    const inCategory = tools.filter((t) => t.data.category === key && hasStars(t));
    const pairs: [Tool, Tool][] = [];
    for (let i = 0; i < inCategory.length; i++) {
      for (let j = i + 1; j < inCategory.length; j++) {
        // 星标多的一方放 A，slug 读起来是「主流 vs 挑战者」
        const [a, b] =
          (inCategory[i].data.stars ?? 0) >= (inCategory[j].data.stars ?? 0)
            ? [inCategory[i], inCategory[j]]
            : [inCategory[j], inCategory[i]];
        if (taken.has(slugOf(a, b))) continue;
        pairs.push([a, b]);
      }
    }
    pairs.sort(
      (p, q) => pairWeight(q[0], q[1]) - pairWeight(p[0], p[1]) || slugOf(...p).localeCompare(slugOf(...q))
    );
    byCategory.set(key, pairs.slice(0, PER_CATEGORY));
  }

  const rounds = Math.max(0, ...Array.from(byCategory.values(), (p) => p.length));
  const picked: [Tool, Tool][] = [];
  for (let round = 0; round < rounds && picked.length < TOTAL_LIMIT; round++) {
    for (const pairs of byCategory.values()) {
      if (picked.length >= TOTAL_LIMIT) break;
      const pair = pairs[round];
      if (pair) picked.push(pair);
    }
  }
  return picked;
}

const notStated = (locale: Locale) => (locale === 'zh' ? '未提供' : 'Not stated');

export function licenseText(tool: Tool, locale: Locale) {
  const d = tool.data;
  return `${licenseLabels[licenseKind(d.license)][locale]} · ${d.license}`;
}

export function starsText(tool: Tool, locale: Locale) {
  const d = tool.data;
  if (typeof d.stars !== 'number') return notStated(locale);
  const n = d.stars.toLocaleString('en-US');
  return d.starsAsOf ? `${n} (${d.starsAsOf})` : n;
}

export function languageText(tool: Tool, locale: Locale) {
  return tool.data.language || notStated(locale);
}

export function hostingText(tool: Tool, locale: Locale) {
  const zh = locale === 'zh';
  return tool.data.selfHosted ? (zh ? '可自托管' : 'Self-hostable') : zh ? '仅托管' : 'Managed only';
}

export function maintenanceText(tool: Tool, locale: Locale) {
  const d = tool.data;
  const zh = locale === 'zh';
  if (d.archived) return zh ? '仓库已归档' : 'Repository archived';
  if (d.lastPush) return zh ? `最近提交 ${d.lastPush}` : `Last push ${d.lastPush}`;
  return notStated(locale);
}

/**
 * 表格行：全部来自两个工具各自的已发布字段，没有一行是推断出来的。
 * 分类行不重复出现——两个条目同属一个分类是这个页面的前提，已写在摘要里。
 */
export function derivedDimensions(a: Tool, b: Tool, locale: Locale): ComparisonDimension[] {
  return [
    {
      label: 'License',
      labelZh: '许可证',
      valueA: licenseText(a, locale),
      valueB: licenseText(b, locale),
    },
    {
      label: 'Hosting model',
      labelZh: '部署形态',
      valueA: hostingText(a, locale),
      valueB: hostingText(b, locale),
    },
    {
      label: 'Primary language',
      labelZh: '主要语言',
      valueA: languageText(a, locale),
      valueB: languageText(b, locale),
    },
    {
      label: 'GitHub stars (point-in-time)',
      labelZh: 'GitHub 星标（时点数据）',
      valueA: starsText(a, locale),
      valueB: starsText(b, locale),
    },
    {
      label: 'Maintenance signal',
      labelZh: '维护信号',
      valueA: maintenanceText(a, locale),
      valueB: maintenanceText(b, locale),
    },
    {
      label: 'Last verified in this directory',
      labelZh: '本站核验日期',
      valueA: a.data.updatedDate,
      valueB: b.data.updatedDate,
    },
  ];
}

/** 逐字段比对，得出两个条目在哪些维度上确实不同——用于写派生摘要 */
function differingFields(a: Tool, b: Tool, locale: Locale): string[] {
  const zh = locale === 'zh';
  const out: string[] = [];
  if (licenseKind(a.data.license) !== licenseKind(b.data.license)) {
    out.push(zh ? '许可证类型' : 'license type');
  }
  if (a.data.selfHosted !== b.data.selfHosted) {
    out.push(zh ? '部署形态' : 'hosting model');
  }
  if ((a.data.language ?? '') !== (b.data.language ?? '')) {
    out.push(zh ? '主要语言' : 'primary language');
  }
  if (Boolean(a.data.archived) !== Boolean(b.data.archived)) {
    out.push(zh ? '维护状态' : 'maintenance status');
  }
  return out;
}

export function derivedSummary(a: Tool, b: Tool, locale: Locale): string {
  const zh = locale === 'zh';
  const category = categories[a.data.category][locale];
  const diffs = differingFields(a, b, locale);
  const names = `${a.data.name} / ${b.data.name}`;
  if (diffs.length === 0) {
    return zh
      ? `${names} 同属「${category}」，且在许可证类型、部署形态、主要语言与维护状态上一致。下表每一行都取自这两个条目各自的已发布字段，未作任何推断；两者的区别在于各自的定位，见下方各自的判断句。`
      : `${names} sit in the same category (${category}) and agree on license type, hosting model, primary language and maintenance status. Every row below is taken from the two entries' own published fields — nothing here is inferred. What separates them is what each one is for; see their own judgments below.`;
  }
  const list = diffs.join(zh ? '、' : ', ');
  return zh
    ? `${names} 同属「${category}」，在${list}上不同。下表每一行都取自这两个条目各自的已发布字段，未作任何推断。`
    : `${names} sit in the same category (${category}) and differ on ${list}. Every row below is taken from the two entries' own published fields — nothing here is inferred.`;
}

/**
 * 数据型对比页的 FAQ。只问答案完全来自已发布字段的问题：
 * 许可证类别、可否自托管、以及（两边都有星标时）星标对比。
 */
export function derivedFaq(a: Tool, b: Tool, locale: Locale): { q: string; a: string }[] {
  const zh = locale === 'zh';
  const kindA = licenseLabels[licenseKind(a.data.license)][locale];
  const kindB = licenseLabels[licenseKind(b.data.license)][locale];
  const qas = [
    {
      q: zh ? '两者最核心的差别是什么？' : 'What is the main difference between the two?',
      a: derivedSummary(a, b, locale),
    },
    {
      q: zh ? `${a.data.name} 是什么许可？` : `What license does ${a.data.name} use?`,
      a: zh ? `${a.data.license}（${kindA}）` : `${a.data.license} (${kindA})`,
    },
    {
      q: zh ? `${b.data.name} 是什么许可？` : `What license does ${b.data.name} use?`,
      a: zh ? `${b.data.license}（${kindB}）` : `${b.data.license} (${kindB})`,
    },
    {
      q: zh ? '两者可以自托管吗？' : 'Can the two be self-hosted?',
      a:
        zh
          ? `${a.data.name}：${hostingText(a, locale)}；${b.data.name}：${hostingText(b, locale)}`
          : `${a.data.name}: ${hostingText(a, locale)}. ${b.data.name}: ${hostingText(b, locale)}.`,
    },
  ];
  const sa = a.data.stars;
  const sb = b.data.stars;
  if (typeof sa === 'number' && typeof sb === 'number') {
    const more = sa >= sb ? a : b;
    qas.push({
      q: zh ? '哪个仓库的星标更多？' : 'Which repository has more GitHub stars?',
      a: zh
        ? `${more.data.name} 为 ${more.data.stars?.toLocaleString('en-US')} 星（统计时点 ${more.data.starsAsOf ?? '未记录'}）；${a.data.name} ${sa.toLocaleString('en-US')}，${b.data.name} ${sb.toLocaleString('en-US')}。星标是时点数据，不能当作当前热度。`
        : `${more.data.name} at ${more.data.stars?.toLocaleString('en-US')} stars (as of ${more.data.starsAsOf ?? 'an unrecorded date'}); ${a.data.name} ${sa.toLocaleString('en-US')}, ${b.data.name} ${sb.toLocaleString('en-US')}. Star counts are point-in-time snapshots, not current popularity.`,
    });
  }
  return qas;
}

/** 把编辑型对比条目归一成同一视图模型 */
export function editorialView(entry: CollectionEntry<'comparisons'>): ComparisonView {
  const d = entry.data;
  return {
    slug: entry.id,
    title: d.title,
    titleZh: d.titleZh,
    summary: d.summary,
    summaryZh: d.summaryZh,
    toolA: d.toolA,
    toolB: d.toolB,
    editorial: true,
    dimensions: d.dimensions,
  };
}

/** 把一对工具归一成数据型对比视图 */
export function derivedView(a: Tool, b: Tool): ComparisonView {
  return {
    slug: slugOf(a, b),
    title: `${a.data.name} vs ${b.data.name}`,
    titleZh: `${a.data.name} 对比 ${b.data.name}`,
    summary: derivedSummary(a, b, 'en'),
    summaryZh: derivedSummary(a, b, 'zh'),
    toolA: a.id,
    toolB: b.id,
    editorial: false,
  };
}

export const compareIndexUrl = (locale: Locale) =>
  locale === 'zh' ? '/zh/compare/' : '/compare/';
