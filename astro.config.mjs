import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * 收集「页面路径 → 该页内容最后一次更新的日期」，交给 sitemap 当 lastmod。
 *
 * Google 只在 lastmod「稳定且可验证」时才拿它安排重抓。所以这里用的是内容自己的
 * 日期（updatedDate / lastUpdated / eventDate），而不是构建时间——构建时间每天
 * 都在变，等于没写，Google 会直接忽略。
 */
function collectLastmod() {
  const dates = new Map();
  const bump = (urlPath, date) => {
    if (!date) return;
    const prev = dates.get(urlPath);
    if (!prev || date > prev) dates.set(urlPath, date);
  };
  const entries = (dir) => {
    try {
      return readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({
          slug: f.slice(0, -'.json'.length),
          data: JSON.parse(readFileSync(path.join(dir, f), 'utf8')),
        }));
    } catch {
      // 集合目录缺失（例如刚 clone）时不该让构建挂掉
      return [];
    }
  };

  for (const { slug, data } of entries('src/content/tools')) {
    const d = data.updatedDate;
    bump(`/tools/${slug}/`, d);
    bump(`/zh/tools/${slug}/`, d);
    bump('/tools/', d);
    bump('/zh/tools/', d);
    bump(`/categories/${data.category}/`, d);
    bump(`/zh/categories/${data.category}/`, d);
    // 首页的计数与生态分布图都随工具集变化，所以也跟着更新
    bump('/', d);
    bump('/zh/', d);
  }
  for (const { slug, data } of entries('src/content/benchmarks')) {
    const d = data.lastUpdated;
    bump(`/benchmarks/${slug}/`, d);
    bump(`/zh/benchmarks/${slug}/`, d);
    bump('/benchmarks/', d);
    bump('/zh/benchmarks/', d);
  }
  for (const { data } of entries('src/content/events')) {
    bump('/news/', data.eventDate);
    bump('/zh/news/', data.eventDate);
  }
  for (const { slug, data } of entries('src/content/papers')) {
    const d = data.updatedDate || data.publishedDate;
    bump(`/papers/${slug}/`, d);
    bump(`/zh/papers/${slug}/`, d);
    bump('/papers/', d);
    bump('/zh/papers/', d);
  }
  return dates;
}

const lastmod = collectLastmod();

// NOTE: @rafters/astro-meta 只声明支持 astro ^6.0.0（peerDependencies 实测），
// 因此本站的 GEO 产物（robots.txt / llms.txt / JSON-LD / hreflang）为手写实现，
// 不使用该包。详见 README 或核验报告。
export default defineConfig({
  site: 'https://agent.c8.fit',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', zh: 'zh-CN' },
      },
      serialize(item) {
        const d = lastmod.get(new URL(item.url).pathname);
        if (d) item.lastmod = new Date(d);
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
