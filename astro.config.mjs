import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
