import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { eventFeed } from '../../lib/feed';

export const GET: APIRoute = async () => {
  const events = await getCollection('events');
  return new Response(eventFeed('zh', events), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
