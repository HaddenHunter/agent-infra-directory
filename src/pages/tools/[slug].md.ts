import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { toolMarkdown } from '../../lib/markdown';

export async function getStaticPaths() {
  const tools = await getCollection('tools');
  return tools.map((tool) => ({ params: { slug: tool.id }, props: { tool } }));
}

export const GET: APIRoute = ({ props }) => {
  const { tool } = props as { tool: CollectionEntry<'tools'> };
  return new Response(toolMarkdown('en', tool), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
