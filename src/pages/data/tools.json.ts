import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  SITE_URL,
  categories,
  categoryKeys,
  toolMarkdownUrl,
  toolUrl,
} from '../../i18n/ui';

/**
 * 公开发布的数据集端点：给开发者一条直接读取全量条目的路径，无需解析 HTML。
 *
 * 字段语义与页面完全一致：keyFact 是可引用的自包含判断句，stars 是时点快照
 * （配对 starsAsOf），stars / archived / lastPush 由 scripts/fetch-github.mjs
 * 回填而非手写。lastVerified 取所有条目里最新的核验日期，而不是构建时间——
 * 构建时间每次都变，等于没有信息量。
 */
export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');

  const items = tools
    .map((t) => {
      const d = t.data;
      return {
        id: t.id,
        name: d.name,
        category: d.category,
        description: d.description,
        descriptionZh: d.descriptionZh,
        license: d.license,
        language: d.language ?? null,
        selfHosted: d.selfHosted,
        repository: d.github ?? null,
        stars: d.stars ?? null,
        starsAsOf: d.starsAsOf ?? null,
        archived: d.archived ?? null,
        lastPush: d.lastPush ?? null,
        keyFact: d.keyFact,
        keyFactZh: d.keyFactZh,
        caveat: d.caveat ?? null,
        caveatZh: d.caveatZh ?? null,
        verifiedOn: d.updatedDate,
        url: `${SITE_URL}${toolUrl('en', t.id)}`,
        markdownUrl: `${SITE_URL}${toolMarkdownUrl('en', t.id)}`,
      };
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    );

  const lastVerified = tools.reduce(
    (latest, t) => (t.data.updatedDate > latest ? t.data.updatedDate : latest),
    ''
  );

  const body = {
    name: 'AI Agent Infrastructure Directory — tools dataset',
    homepage: SITE_URL,
    lastVerified,
    count: items.length,
    categories: Object.fromEntries(categoryKeys.map((k) => [k, categories[k].en])),
    tools: items,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
