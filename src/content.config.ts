import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * tools：每个工具一个 JSON 文件，中英字段同存于一个条目。
 * 这样做的好处是"内容一致性原则"由数据结构强制保证——
 * 英文结论与中文结论来自同一份事实源，不会因翻译产生偏差。
 */
const tools = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tools' }),
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'runtime',
      'sandbox',
      'observability',
      'identity',
      'payment',
      'mcp',
      'memory',
    ]),
    /** 英文一句话定位 */
    description: z.string(),
    /** 中文一句话定位 */
    descriptionZh: z.string(),
    license: z.string(),
    github: z.string().url().optional(),
    stars: z.number().optional(),
    /** 星标数据的统计时点，避免数字被误读为实时值 */
    starsAsOf: z.string().optional(),
    /** 主要实现语言；留空时由 scripts/fetch-github.mjs 从 GitHub 回填 */
    language: z.string().optional(),
    selfHosted: z.boolean(),
    /** 可引用的核心判断句（英文）：主张 + 数字 + 日期 + 实体 */
    keyFact: z.string(),
    keyFactZh: z.string(),
    addedDate: z.string(),
    /** 核验日期 */
    updatedDate: z.string(),
    /** 由 scripts/fetch-github.mjs 自动回填：仓库是否已归档 */
    archived: z.boolean().optional(),
    /** 由 scripts/fetch-github.mjs 自动回填：最近一次 push 日期 */
    lastPush: z.string().optional(),
    /** 若条目存在事实争议或成熟度存疑，在此标注 */
    caveat: z.string().optional(),
    caveatZh: z.string().optional(),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string(),
    /** 工具集合条目的 id（即文件名去掉扩展名） */
    toolA: z.string(),
    toolB: z.string(),
    summary: z.string(),
    summaryZh: z.string(),
    dimensions: z.array(
      z.object({
        label: z.string(),
        labelZh: z.string(),
        valueA: z.string(),
        valueB: z.string(),
      })
    ),
  }),
});

/**
 * benchmarks：评测与基准。
 * verification 字段是全站可信度的核心——它把"已核验/单一来源/无法证实/已被证伪"
 * 显式写进数据模型，而不是让读者去猜。
 */
const benchmarks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/benchmarks' }),
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'general',
      'coding',
      'web',
      'os',
      'safety',
      'mcp',
      'infra',
      'contested',
    ]),
    description: z.string(),
    descriptionZh: z.string(),
    /** 2026 年前沿水平（含时点说明） */
    frontier: z.string(),
    frontierZh: z.string(),
    humanBaseline: z.string().optional(),
    /** 可信度提示：污染、脚手架、口径差异等 */
    credibility: z.string(),
    credibilityZh: z.string(),
    verification: z.enum(['verified', 'single-source', 'unverified', 'disputed']),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    lastUpdated: z.string(),
    /** 可引用的核心判断句 */
    keyFact: z.string(),
    keyFactZh: z.string(),
    /** 归类到「常见错误说法」时，写明被纠正的原说法 */
    debunks: z.string().optional(),
    debunksZh: z.string().optional(),
  }),
});

/**
 * events：动态追踪。新闻类内容时效性强，因此必须带 eventDate 与来源，
 * 且同样标注 verification。
 */
const events = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string(),
    type: z.enum(['launch', 'funding', 'incident', 'framework', 'policy', 'research']),
    /** 事件发生日期，用于时效锚点 */
    eventDate: z.string(),
    summary: z.string(),
    summaryZh: z.string(),
    details: z
      .array(
        z.object({
          label: z.string(),
          labelZh: z.string(),
          value: z.string(),
        })
      )
      .default([]),
    verification: z.enum(['verified', 'single-source', 'unverified', 'disputed']),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    /** aihot 式「推荐理由」：这条对做选型的人意味着什么 */
    whyItMatters: z.string().optional(),
    whyItMattersZh: z.string().optional(),
    tags: z.array(z.string()).default([]),
    caveat: z.string().optional(),
    caveatZh: z.string().optional(),
    /** 首句必须含日期锚点，便于 AI 引用 */
    keyFact: z.string(),
    keyFactZh: z.string(),
  }),
});

/**
 * useCases：面向普通人的真实使用案例。用户故事类内容最易出现"张冠李戴"，
 * 因此每条必须带可追溯来源与 sourceDate；查无实据的一律进 disputed。
 */
const useCases = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/use-cases' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string(),
    scenario: z.enum([
      'medical',
      'travel',
      'bills',
      'family',
      'business',
      'content',
      'life-admin',
    ]),
    product: z.string(),
    summary: z.string(),
    summaryZh: z.string(),
    background: z.string(),
    backgroundZh: z.string(),
    actions: z
      .array(z.object({ label: z.string(), labelZh: z.string(), value: z.string() }))
      .default([]),
    outcome: z.string(),
    outcomeZh: z.string(),
    verification: z.enum(['verified', 'single-source', 'unverified', 'disputed']),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    sourceDate: z.string(),
    caveat: z.string().optional(),
    caveatZh: z.string().optional(),
    keyFact: z.string(),
    keyFactZh: z.string(),
    debunks: z.string().optional(),
    debunksZh: z.string().optional(),
  }),
});

export const collections = { tools, comparisons, benchmarks, events, useCases };
