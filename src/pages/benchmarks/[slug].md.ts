import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { benchmarkMarkdown } from '../../lib/benchmark-markdown';

export async function getStaticPaths() {
  const benchmarks = await getCollection('benchmarks');
  return benchmarks.map((b) => ({ params: { slug: b.id }, props: { benchmark: b } }));
}

export const GET: APIRoute = ({ props }) => {
  const { benchmark } = props as { benchmark: CollectionEntry<'benchmarks'> };
  return new Response(benchmarkMarkdown('en', benchmark), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
