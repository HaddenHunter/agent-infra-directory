# AI Agent Infrastructure Directory

A bilingual (English / 中文) directory of AI Agent infrastructure, built to be **cited** — by people and by AI.

**→ <https://agent.c8.fit/>**

## What's inside

| Section | Entries | What it covers |
| --- | --- | --- |
| [Tools](https://agent.c8.fit/tools/) | 80 | Agent runtimes, execution sandboxes, observability, identity & permission, payments, MCP tooling, memory, personal agents |
| [Benchmarks](https://agent.c8.fit/benchmarks/) | 23 | What each agent benchmark actually measures, its 2026 frontier, human baseline and credibility caveats |
| [Papers](https://agent.c8.fit/papers/) | 22 | 16 landmark + 6 frontier papers on LLM agents |
| [News](https://agent.c8.fit/news/) | 18 | Launches, funding, security incidents and framework changes |

58 of the 80 tools are open or source-available. 51 entries carry an explicit caveat where something could not be verified.

## What makes it different

Every entry leads with a self-contained, citable sentence — claim + number + date + entity — that stands on its own without surrounding context. Two rules follow from that:

- **Numbers are machine-checked, not typed.** Star counts, archive status and last-push dates are backfilled from the GitHub API by [`scripts/fetch-github.mjs`](scripts/fetch-github.mjs) and always carry an as-of date. The same applies to papers: titles, author lists and dates come from the arXiv API via [`scripts/fetch-papers.mjs`](scripts/fetch-papers.mjs). Scripts only ever write the machine-verifiable fields; the judgement stays human-written, and a disagreement is reported rather than silently overwritten.
- **Disputed claims are flagged, not repeated.** Where a widely circulated statistic has no traceable source, it is written up as an explicit correction rather than passed along. Those entries are collected on the [benchmarks page](https://agent.c8.fit/benchmarks/).

## For AI agents

- [`/llms.txt`](https://agent.c8.fit/llms.txt) — a map of the site
- Markdown renditions of every content page: `/tools/{slug}.md`, `/benchmarks/{slug}.md`, `/papers/{slug}.md`
- [`/sitemap-index.xml`](https://agent.c8.fit/sitemap-index.xml)
- JSON-LD on every page (`SoftwareApplication`, `ItemList`, `ScholarlyArticle`, `FAQPage`, `CollectionPage`)
- `hreflang` pairs between `/` and `/zh/`

## Running it locally

Requires Node ≥ 22.12.

```bash
npm install
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run build` | Static build into `dist/` |
| `npm run fetch:github` | Refresh tool metadata from the GitHub API (set `GITHUB_TOKEN` to lift the 60/hr unauthenticated limit) |
| `npm run fetch:papers` | Verify and backfill paper metadata from the arXiv API |
| `npm run fetch:news` | Collect news **candidates** into `content-inbox/` — never published automatically |
| `npm run ping:indexnow` | Push the built URL list to IndexNow (Bing / Yandex) |

## How content stays current

[`.github/workflows/refresh-data.yml`](.github/workflows/refresh-data.yml) runs daily. It refreshes tool and paper metadata, collects news candidates, **verifies the site still builds**, then commits the result straight to `main`, where the deploy workflow picks it up. Only machine-verifiable fields move this way — GitHub API numbers (`stars` / `archived` / `lastPush`) and arXiv metadata (title, authors, dates).

Nothing editorial publishes itself. News candidates land in `content-inbox/`, which sits outside `src/content/` and is therefore never rendered — promoting one means writing its `keyFact` and `whyItMatters` and setting an explicit `verification` field.
