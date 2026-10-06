import type { Locale } from '../i18n/ui';

export interface LabEntry {
  id: string;
  title: Record<Locale, string>;
  blurb: Record<Locale, string>;
  /** 运行依赖，用来在页面上如实标注 */
  needs: Record<Locale, string>;
}

/**
 * 交互实验区。每个 demo 只在自己的页面上加载自己的脚本，
 * 内容页一行 JS 都不会因此变多。
 */
export const labs: LabEntry[] = [
  {
    id: 'ecosystem',
    title: { en: 'Ecosystem graph', zh: '生态图谱' },
    blurb: {
      en: 'Every tool and category in the directory as one GPU-rendered scene: nodes sized by GitHub stars, coloured by category, with a live particle field. Hover to inspect, click to open an entry.',
      zh: '把全站工具与分类渲染成一张 GPU 场景：节点大小按 GitHub 星标、颜色按分类，配一片实时粒子场。悬浮查看详情，点击进入条目。',
    },
    needs: { en: 'WebGPU (falls back to a static list)', zh: '需要 WebGPU（不支持时退回静态列表）' },
  },
  {
    id: 'search',
    title: { en: 'Search by meaning, offline', zh: '离线语义搜索' },
    blurb: {
      en: 'A sentence-transformer runs inside your browser and ranks the directory by meaning. No server, no API key — the model is fetched once and cached.',
      zh: '在浏览器里跑一个句向量模型，按语义对全目录排序。无服务端、无 API key，模型只下载一次并缓存。',
    },
    needs: {
      en: 'WebGPU or WASM, ~23MB model download (English)',
      zh: '需要 WebGPU 或 WASM，模型约 23MB（英文）',
    },
  },
  {
    id: 'react-loop',
    title: { en: 'The ReAct loop', zh: 'ReAct 循环' },
    blurb: {
      en: 'Step through the reason–act–observe cycle that most agent frameworks still implement. A diagram, not a live run.',
      zh: '逐步走一遍「推理—行动—观察」循环——绝大多数 Agent 框架至今仍在实现的形态。是示意图，不是真实运行记录。',
    },
    needs: { en: 'No GPU needed', zh: '不需要 GPU' },
  },
];

export const labIndexUrl = (locale: Locale) => (locale === 'zh' ? '/zh/lab/' : '/lab/');

export const labUrl = (locale: Locale, id: string) =>
  locale === 'zh' ? `/zh/lab/${id}/` : `/lab/${id}/`;
