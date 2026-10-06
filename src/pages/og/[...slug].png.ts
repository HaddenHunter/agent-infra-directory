import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories, categoryKeys, locales, t, type Locale } from '../../i18n/ui';
import { benchmarkCategories } from '../../lib/benchmarks';
import { paperTiers } from '../../lib/papers';
import { verificationLabels, type Verification } from '../../lib/news';
import { collectMyths } from '../../lib/myths';
import { renderOgImage } from '../../lib/og';

interface OgEntry {
  slug: string;
  title: string;
  kicker: string;
}

/**
 * 每个会被分享的页面一张自己的 OG 图。
 *
 * 路径规则与 src/lib/og.ts 的 ogImageUrl() 一一对应：/og/<section>/<id>.png，
 * 语言前缀同样带在路径里（/og/zh/...）。认不出的路径落到 default。
 */
export async function getStaticPaths() {
  const [tools, comparisons, benchmarks, papers, events, useCases] = await Promise.all([
    getCollection('tools'),
    getCollection('comparisons'),
    getCollection('benchmarks'),
    getCollection('papers'),
    getCollection('events'),
    getCollection('useCases'),
  ]);

  const entries: OgEntry[] = [];

  for (const locale of locales) {
    const s = t(locale);
    const zh = locale === 'zh';
    const p = zh ? 'zh/' : '';

    entries.push(
      { slug: `${p}home`, title: s.siteName, kicker: s.tagline },
      {
        slug: `${p}tools`,
        title: zh ? '全部工具' : 'All tools',
        kicker: `${tools.length} tools · ${categoryKeys.length} categories`,
      },
      {
        slug: `${p}benchmarks`,
        title: s.benchmarks,
        kicker: `${benchmarks.length} benchmarks · ${zh ? '含可信度提示' : 'with credibility caveats'}`,
      },
      {
        slug: `${p}benchmarks/frontier`,
        title: zh ? '2026 基准前沿一览' : '2026 benchmark frontier',
        kicker: zh ? '前沿水平与人类基线' : 'Frontier level and human baseline',
      },
      {
        slug: `${p}papers`,
        title: s.papers,
        kicker: `${papers.length} ${zh ? '篇里程碑与前沿论文' : 'landmark and frontier papers'}`,
      },
      {
        slug: `${p}news`,
        title: s.news,
        kicker: `${events.length} ${zh ? '条动态 · 均带来源' : 'entries · each sourced'}`,
      },
      {
        slug: `${p}myths`,
        title: zh ? '误传核查' : 'Myth check',
        kicker: zh ? '经不起核对的常见说法' : "claims that don't survive checking",
      }
    );

    for (const k of categoryKeys) {
      const count = tools.filter((x) => x.data.category === k).length;
      entries.push({
        slug: `${p}categories/${k}`,
        title: categories[k][locale],
        kicker: `${count} ${zh ? '个工具' : 'tools'}`,
      });
    }

    for (const tool of tools) {
      entries.push({
        slug: `${p}tools/${tool.id}`,
        title: tool.data.name,
        kicker: `${categories[tool.data.category][locale]} · ${tool.data.license}`,
      });
    }

    for (const b of benchmarks) {
      entries.push({
        slug: `${p}benchmarks/${b.id}`,
        title: b.data.name,
        kicker: `${benchmarkCategories[b.data.category][locale]} · ${verificationLabels[b.data.verification as Verification][locale]}`,
      });
    }

    for (const paper of papers) {
      entries.push({
        slug: `${p}papers/${paper.id}`,
        title: paper.data.name,
        kicker: `${paperTiers[paper.data.tier][locale]} · ${paper.data.publishedDate}`,
      });
    }

    for (const c of comparisons) {
      entries.push({
        slug: `${p}compare/${c.id}`,
        title: zh ? c.data.titleZh : c.data.title,
        kicker: zh ? '工具对比' : 'Tool comparison',
      });
    }
  }

  entries.push({
    slug: 'default',
    title: 'AI Agent Infrastructure Directory',
    kicker: `fact-checked · ${collectMyths('en', { benchmarks, useCases, events }).claims.length} myths checked`,
  });

  // 同一 slug 出现两次会让 Astro 构建失败，先去重
  const seen = new Set<string>();
  const unique: OgEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    unique.push(entry);
  }

  return unique.map((entry) => ({
    params: { slug: entry.slug },
    props: { title: entry.title, kicker: entry.kicker },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, kicker } = props as { title: string; kicker: string };
  const png = await renderOgImage({ title, kicker });
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
