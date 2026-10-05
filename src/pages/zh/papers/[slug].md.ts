import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { paperMarkdown } from '../../../lib/paper-markdown';

export async function getStaticPaths() {
  const papers = await getCollection('papers');
  return papers.map((p) => ({ params: { slug: p.id }, props: { paper: p } }));
}

export const GET: APIRoute = ({ props }) => {
  const { paper } = props as { paper: CollectionEntry<'papers'> };
  return new Response(paperMarkdown('zh', paper), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
