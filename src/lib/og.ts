import sharp from 'sharp';

/**
 * 构建期生成社交分享图（OG image）。
 *
 * 用 sharp 把一张 SVG 模板栅格化成 PNG：社交平台不认 SVG，而站内所有页面
 * 都值得有一张带自己标题的卡片——千篇一律的默认图在信息流里等于没有。
 *
 * 文字只用拉丁字形族，字号按文本宽度自动收缩，避免中英混排时溢出画面。
 */

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TEXT_WIDTH = 1040;
const FONT = "'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif";

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** 粗略字宽：CJK 与全角符号按 1em，其余按 0.55em */
const charWidth = (ch: string) => (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.55);

const textWidth = (text: string, size: number) =>
  [...text].reduce((w, ch) => w + charWidth(ch), 0) * size;

interface Fitted {
  lines: string[];
  size: number;
}

/**
 * 把标题排进最多 maxLines 行：先按空白切词，纯 CJK（没有空白）时按字符切。
 * 若在最宽档仍放不下，就逐档缩小字号；缩到底再放不下才截断加省略号。
 */
function fit(text: string, sizes: number[], maxLines: number): Fitted {
  const byWord = /\s/.test(text);
  const tokens = byWord ? text.split(/\s+/).filter(Boolean) : [...text];
  const sep = byWord ? ' ' : '';

  let last: Fitted = { lines: [text], size: sizes[sizes.length - 1] };

  for (const size of sizes) {
    const lines: string[] = [];
    let line = '';
    let overflowed = false;

    for (const token of tokens) {
      const candidate = line ? line + sep + token : token;
      if (line && textWidth(candidate, size) > MAX_TEXT_WIDTH) {
        lines.push(line);
        if (lines.length === maxLines) {
          overflowed = true;
          break;
        }
        line = token;
      } else {
        line = candidate;
      }
    }
    if (!overflowed && line) lines.push(line);

    last = { lines, size };
    if (!overflowed) return last;
  }

  // 最小档仍放不下：末行截断标记省略
  const tail = last.lines[last.lines.length - 1];
  last.lines[last.lines.length - 1] = tail.slice(0, -1).trimEnd() + '…';
  return last;
}

const layout = (text: string) => fit(text, [74, 64, 56, 48, 42], 2);

export async function renderOgImage({
  title,
  kicker,
}: {
  title: string;
  kicker?: string;
}): Promise<Buffer> {
  const { lines, size } = layout(title);
  const lineHeight = Math.round(size * 1.18);
  const blockTop = 236;
  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="72" y="${blockTop + size + i * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#ffffff">${esc(line)}</text>`
    )
    .join('');

  const kickerY = blockTop + lines.length * lineHeight + 34;
  const kickerSvg = kicker
    ? `<text x="74" y="${kickerY}" font-family="${FONT}" font-size="30" fill="#a5b4fc">${esc(kicker)}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#312e81"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="72" y="150" width="64" height="6" rx="3" fill="#6366f1"/>
  <text x="72" y="112" font-family="${FONT}" font-size="26" font-weight="600" letter-spacing="2" fill="#a5b4fc">agent.c8.fit</text>
  ${titleSvg}
  ${kickerSvg}
  <text x="72" y="${HEIGHT - 60}" font-family="${FONT}" font-size="26" fill="#94a3b8">AI Agent Infrastructure Directory</text>
  <text x="${WIDTH - 72}" y="${HEIGHT - 60}" text-anchor="end" font-family="${FONT}" font-size="24" fill="#64748b">fact-checked · bilingual</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

const KNOWN_SECTIONS = new Set([
  'tools',
  'categories',
  'compare',
  'news',
  'benchmarks',
  'papers',
  'myths',
]);

/**
 * 站点路径 → OG 图的 URL。与 src/pages/og/[...slug].png.ts 里枚举的路径一一对应；
 * 认不出的路径一律落到 /og/default.png，避免出现 404 的分享图。
 */
export function ogImageUrl(path: string): string {
  const raw = path.replace(/^\/+|\/+$/g, '');
  const parts = raw ? raw.split('/') : [];
  const zh = parts[0] === 'zh';
  const rest = zh ? parts.slice(1) : parts;

  if (rest.length === 0) return zh ? '/og/zh/home.png' : '/og/home.png';
  if (!KNOWN_SECTIONS.has(rest[0])) return '/og/default.png';
  return `/og/${[...(zh ? ['zh'] : []), ...rest].join('/')}.png`;
}
