import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { newsDigestMarkdown } from '../../lib/news-markdown';

export const GET: APIRoute = async () => {
  const events = await getCollection('events');
  return new Response(newsDigestMarkdown('zh', events), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
