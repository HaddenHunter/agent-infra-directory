import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories, categoryKeys, locales, t, type Locale } from '../../i18n/ui';
import { benchmarkCategories } from '../../lib/benchmarks';
import { paperCategories, paperCategoryKeys, paperTiers } from '../../lib/papers';
import { glossaryTerms } from '../../lib/glossary';
import { verificationLabels, type Verification } from '../../lib/news';
import { useCaseScenarios } from '../../lib/use-cases';
import { labs } from '../../lib/lab';
import { collectMyths } from '../../lib/myths';
import { derivedView, editorialView, selectDerivedPairs } from '../../lib/comparisons';
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

  // 对比页有编辑型与数据型两条来源，OG 图要跟 /compare/[slug] 的 slug 完全对齐
  const editorial = comparisons.map((c) => editorialView(c));
  const taken = new Set(editorial.map((c) => c.slug));
  const compareViews = [...editorial, ...selectDerivedPairs(tools, taken).map(([a, b]) => derivedView(a, b))];

  for (const locale of locales) {
    const s = t(locale);
    const zh = locale === 'zh';
    const p = zh ? 'zh/' : '';

    entries.push(
      { slug: `${p}home`, title: s.siteName, kicker: s.tagline },
      {
        slug: `${p}about`,
        title: s.about,
        kicker: zh ? '这份目录是什么、写给谁' : 'what this directory is, and who it is for',
      },
      {
        slug: `${p}methodology`,
        title: s.methodology,
        kicker: zh ? '核验方式与自动化边界' : 'how entries are checked, and where automation stops',
      },
      {
        slug: `${p}glossary`,
        title: s.glossary,
        kicker: `${glossaryTerms.length} ${zh ? '个术语' : 'terms'}`,
      },
      {
        slug: `${p}card`,
        title: s.agentCard,
        kicker: zh ? '导出一张 1200×630 的名片' : 'export a 1200×630 card',
      },
      {
        slug: `${p}papers/topics`,
        title: s.topics,
        kicker: zh ? '按主题浏览论文' : 'papers grouped by topic',
      },
      {
        slug: `${p}compare`,
        title: s.compareTitle,
        kicker: `${compareViews.length} ${zh ? '组工具对比' : 'head-to-head pages'}`,
      },
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
      },
      {
        slug: `${p}use-cases`,
        title: zh ? '真实使用案例' : 'Real-world use cases',
        kicker: `${useCases.length} ${zh ? '条可追溯记录' : 'traced accounts'}`,
      },
      {
        slug: `${p}lab`,
        title: zh ? '实验区' : 'Lab',
        kicker: zh ? '基于本站数据集的交互实验' : 'interactive experiments on this dataset',
      }
    );

    for (const demo of labs) {
      entries.push({
        slug: `${p}lab/${demo.id}`,
        title: demo.title[locale],
        kicker: zh ? '交互实验' : 'Interactive demo',
      });
    }

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

    for (const key of paperCategoryKeys) {
      entries.push({
        slug: `${p}papers/topics/${key}`,
        title: paperCategories[key][locale],
        kicker: `${papers.filter((x) => x.data.category === key).length} ${zh ? '篇论文' : 'papers'}`,
      });
    }

    for (const term of glossaryTerms) {
      entries.push({
        slug: `${p}glossary/${term.slug}`,
        title: term.term[locale],
        kicker: zh ? '术语表' : 'Glossary',
      });
    }

    for (const e of events) {
      entries.push({
        slug: `${p}news/${e.id}`,
        title: zh ? e.data.titleZh : e.data.title,
        kicker: `${e.data.eventDate} · ${verificationLabels[e.data.verification as Verification][locale]}`,
      });
    }

    for (const c of compareViews) {
      entries.push({
        slug: `${p}compare/${c.slug}`,
        title: zh ? c.titleZh : c.title,
        kicker: c.editorial
          ? zh
            ? '编辑对比'
            : 'Editorial comparison'
          : zh
            ? '数据对比'
            : 'Data comparison',
      });
    }

    // 用例标题太长，卡片上放不住；改用产品名 + 场景，读起来更像一张名片
    for (const u of useCases) {
      entries.push({
        slug: `${p}use-cases/${u.id}`,
        title: u.data.product,
        kicker: `${useCaseScenarios[u.data.scenario][locale]} · ${verificationLabels[u.data.verification as Verification][locale]}`,
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
