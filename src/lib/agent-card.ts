import { categories, type CategoryKey, type Locale } from '../i18n/ui';

/**
 * Agent 名片的客户端渲染器。
 *
 * 整条链路都在本地：表单 → canvas → PNG。没有服务端、没有上传，
 * 头像文件用 FileReader 读成 data URL 直接画进 canvas，不经过任何网络请求。
 *
 * 这个模块由 /card/ 页面在挂载时动态 import，因此只在这一页产生下载量。
 */

export const CARD_W = 1200;
export const CARD_H = 630;
/** 技术栈上限：再多就变成一堵墙，名片失去可读性 */
export const MAX_STACK = 5;

/** 分类配色。与站点的分类语义一致，但比页面上的徽标更饱和，名片上要看得出颜色。 */
export const categoryAccent: Record<CategoryKey, string> = {
  'personal-agent': '#8b5cf6',
  runtime: '#6366f1',
  sandbox: '#f43f5e',
  observability: '#06b6d4',
  identity: '#f59e0b',
  payment: '#10b981',
  mcp: '#ec4899',
  memory: '#3b82f6',
};

export type CardTheme = 'dark' | 'light';

export interface CardConfig {
  name: string;
  tagline: string;
  category: CategoryKey;
  /** 显示在名片上，同时作为二维码内容。留空时二维码指向本站 */
  link: string;
  theme: CardTheme;
  qr: boolean;
  /** 目录里的工具 id，最多 MAX_STACK 个 */
  stack: string[];
}

export interface CardTool {
  id: string;
  name: string;
  category: CategoryKey;
}

export const FALLBACK_LINK = 'https://agent.c8.fit/card/';

export const defaultConfig: CardConfig = {
  name: 'My Agent',
  tagline: 'What it does, in one line.',
  category: 'runtime',
  link: '',
  theme: 'dark',
  qr: true,
  stack: [],
};

// ---------------------------------------------------------------- hash 编解码

/**
 * 配置编码进 URL 的 hash（而不是查询串）：hash 不会发给服务器，
 * 因此不会为每张名片生成一个可被抓取的页面——这类用户自造内容一旦被索引，
 * 就是成批的薄页。分享链接照样能还原名片。
 */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const isCategoryKey = (v: unknown): v is CategoryKey =>
  typeof v === 'string' && v in categoryAccent;

export function encodeConfig(config: CardConfig): string {
  return toBase64Url(JSON.stringify(config));
}

/** 从 hash 还原配置。字段一律重新校验——hash 是用户可随意编辑的输入。 */
export function decodeConfig(hash: string): CardConfig | null {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  const value = raw.startsWith('c=') ? raw.slice(2) : raw;
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as Partial<CardConfig>;
    return {
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 28) : defaultConfig.name,
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline.slice(0, 90) : '',
      category: isCategoryKey(parsed.category) ? parsed.category : defaultConfig.category,
      link: typeof parsed.link === 'string' ? parsed.link.slice(0, 120) : '',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      qr: parsed.qr !== false,
      stack: Array.isArray(parsed.stack)
        ? parsed.stack.filter((x): x is string => typeof x === 'string').slice(0, MAX_STACK)
        : [],
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ 文本排版

const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

const isWideChar = (ch: string) =>
  /[\u1100-\u115f\u2e80-\u303e\u3041-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua000-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(
    ch
  );

/** 按「西文单词 / 单个全角字符 / 空格」切词，中日韩文字没有空格也能正确换行 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  for (const ch of text) {
    if (isWideChar(ch) || ch === ' ') {
      if (buf) {
        tokens.push(buf);
        buf = '';
      }
      tokens.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number) {
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const token of tokenize(text)) {
    const candidate = line + token;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = token === ' ' ? '' : token;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  const joined = lines.join('');
  if (joined.length < text.length && lines.length) {
    // 被截断了：在末行补省略号
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = last + '…';
  }
  return lines;
}

/** 单行文本裁到给定宽度，超出部分用省略号 */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1);
  return out + '…';
}

/** 没有头像时用首字母/首字当字母组合 */
function monogram(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'A';
  if (isWideChar(cleaned[0])) return cleaned.slice(0, 1);
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// -------------------------------------------------------------------- 二维码

export interface QrMatrix {
  count: number;
  isDark: (row: number, col: number) => boolean;
}

/**
 * 生成二维码矩阵。二维码库单独分包，只有开启二维码时才下载。
 *
 * 只编码 ASCII：库默认按 Latin-1 逐字节取码，非 ASCII 会编出扫不出来的图案。
 * 所以这里宁可返回 null（调用方不画二维码），也不画一个假的。
 */
export async function buildQr(text: string): Promise<QrMatrix | null> {
  if (!/^[\x20-\x7e]+$/.test(text)) return null;
  try {
    const mod = await import('qrcode-generator');
    const qrcode = mod.default;
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return { count: qr.getModuleCount(), isDark: (row, col) => qr.isDark(row, col) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- 绘制

export interface DrawInput {
  config: CardConfig;
  toolById: Map<string, CardTool>;
  avatar: HTMLImageElement | null;
  qr: QrMatrix | null;
  locale: Locale;
  labels: { stack: string; site: string };
}

const PALETTE = {
  dark: {
    from: '#0b1220',
    to: '#152238',
    text: '#f8fafc',
    muted: '#94a3b8',
    chipBg: 'rgba(255,255,255,0.08)',
    chipText: '#e2e8f0',
    avatarBg: 'rgba(255,255,255,0.08)',
  },
  light: {
    from: '#ffffff',
    to: '#eef2f7',
    text: '#0f172a',
    muted: '#64748b',
    chipBg: 'rgba(15,23,42,0.06)',
    chipText: '#334155',
    avatarBg: 'rgba(15,23,42,0.06)',
  },
} as const;

const PAD = 64;
const AVATAR = 140;
const STRIP = 8;

export function drawCard(ctx: CanvasRenderingContext2D, input: DrawInput) {
  const { config, toolById, avatar, qr, labels } = input;
  const p = PALETTE[config.theme];
  const accent = categoryAccent[config.category] ?? categoryAccent.runtime;

  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // 背景
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, p.from);
  bg.addColorStop(1, p.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 右上角一圈分类色光晕，让名片有颜色记忆点
  const glow = ctx.createRadialGradient(CARD_W - 120, 60, 0, CARD_W - 120, 60, 620);
  glow.addColorStop(0, accent + '2e');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 顶部色条
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CARD_W, STRIP);

  // 头像 / 字母组合
  const avatarTop = 96;
  const cx = PAD + AVATAR / 2;
  const cy = avatarTop + AVATAR / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, AVATAR / 2, 0, Math.PI * 2);
  ctx.closePath();
  if (avatar) {
    ctx.clip();
    // 居中裁切，避免非方形图片被拉伸
    const scale = Math.max(AVATAR / avatar.width, AVATAR / avatar.height);
    const w = avatar.width * scale;
    const h = avatar.height * scale;
    ctx.drawImage(avatar, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = p.avatarBg;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, AVATAR / 2 - 3, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    setFont(ctx, 700, 52);
    ctx.fillText(monogram(config.name), cx, cy + 4);
    ctx.restore();
  }

  // 右侧文字栏
  const textX = PAD + AVATAR + 30;
  const qrOn = config.qr;
  const qrBox = 160;
  const contentRight = qrOn ? CARD_W - PAD - qrBox - 40 : CARD_W - PAD;
  const textMax = contentRight - textX;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = p.text;
  setFont(ctx, 700, 54);
  ctx.fillText(fitText(ctx, config.name || defaultConfig.name, textMax), textX, avatarTop + 58);

  ctx.fillStyle = p.muted;
  setFont(ctx, 400, 26);
  const taglineLines = wrapText(ctx, config.tagline, textMax, 2);
  taglineLines.forEach((line, i) => {
    ctx.fillText(line, textX, avatarTop + 104 + i * 36);
  });

  // 分类徽标
  ctx.textBaseline = 'middle';
  setFont(ctx, 600, 22);
  const categoryLabel = categories[config.category][input.locale];
  const chipW = ctx.measureText(categoryLabel).width + 40;
  const chipY = avatarTop + 158;
  ctx.fillStyle = accent + '26';
  roundRectPath(ctx, textX, chipY, chipW, 44, 22);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillText(categoryLabel, textX + 20, chipY + 23);
  ctx.textBaseline = 'alphabetic';

  // 技术栈
  const chips = config.stack
    .map((id) => toolById.get(id))
    .filter((t): t is CardTool => Boolean(t));

  let rowY = avatarTop + 244;
  if (chips.length) {
    ctx.fillStyle = p.muted;
    setFont(ctx, 600, 18);
    ctx.fillText(labels.stack, textX, rowY);

    let x = textX;
    rowY += 22;
    const chipH = 46;
    setFont(ctx, 500, 21);
    for (const tool of chips) {
      const label = tool.name;
      const w = ctx.measureText(label).width + 46;
      if (x + w > contentRight && x > textX) {
        x = textX;
        rowY += chipH + 10;
      }
      ctx.fillStyle = p.chipBg;
      roundRectPath(ctx, x, rowY, w, chipH, 23);
      ctx.fill();
      // 分类色小圆点，和目录里的分类配色对应
      ctx.fillStyle = categoryAccent[tool.category] ?? accent;
      ctx.beginPath();
      ctx.arc(x + 20, rowY + chipH / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.chipText;
      ctx.fillText(label, x + 34, rowY + chipH / 2 + 8);
      x += w + 10;
    }
  }

  // 页脚链接（没有就退回站点域名，保证名片上总有一个可追溯的入口）
  const footer = config.link.trim() || labels.site;
  ctx.fillStyle = p.muted;
  setFont(ctx, 500, 22);
  ctx.fillText(fitText(ctx, footer, contentRight - PAD), PAD, CARD_H - PAD + 2);

  // 二维码：深色底上必须垫白底，否则扫码器读不出来
  if (qr) {
    const size = Math.floor((qrBox - 16) / qr.count) * qr.count;
    const boxX = CARD_W - PAD - qrBox;
    const boxY = CARD_H - PAD - qrBox;
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, boxX, boxY, qrBox, qrBox, 16);
    ctx.fill();

    const cell = size / qr.count;
    const offset = (qrBox - size) / 2;
    ctx.fillStyle = '#000000';
    for (let r = 0; r < qr.count; r++) {
      for (let c = 0; c < qr.count; c++) {
        if (!qr.isDark(r, c)) continue;
        // 多画 0.5px，避免取整后模块之间出现缝隙
        ctx.fillRect(
          boxX + offset + c * cell,
          boxY + offset + r * cell,
          cell + 0.5,
          cell + 0.5
        );
      }
    }
  }

  ctx.textAlign = 'start';
}

/** 文件名用的 slug：非字母数字一律折叠成连字符 */
export function cardFileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `agent-card-${slug || 'untitled'}.png`;
}
