/**
 * 生态图谱的 WebGPU 渲染器。
 *
 * 单独成模块，由页面脚本在探测到 navigator.gpu 之后才动态 import：
 * 不支持 WebGPU 的浏览器连这段代码都不会下载，页面留在服务端渲染好的静态列表上。
 *
 * 布局在构建期就算好（节点坐标随数据内联），所以这里只有渲染、没有物理模拟：
 * 每帧 CPU 侧零计算，除了 89 个节点还能白送 6 万颗粒子。
 */

export interface EcosystemPayload {
  /** 每个节点 8 个数：x, y, radius, category, r, g, b, a */
  nodes: number[];
  /** 每条连线 4 个数：x1, y1, x2, y2 */
  links: number[];
  meta: { name: string; url: string; category: string; stars: number | null }[];
}

export interface EcosystemHandlers {
  onHover: (index: number | null) => void;
  onPick: (index: number) => void;
}

export interface EcosystemApi {
  setCategory: (category: number | null) => void;
  dispose: () => void;
}

const PARTICLE_COUNT = 60000;

const SHADER = /* wgsl */ `
struct U {
  viewport: vec2<f32>,
  time: f32,
  hover: f32,
  activeCat: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var<uniform> u: U;

// 每个节点 8 个 float：p = (x, y, radius, category)，c = (r, g, b, a)
struct Node {
  p: vec4<f32>,
  c: vec4<f32>,
};

@group(0) @binding(1) var<storage, read> nodes: array<Node>;
@group(0) @binding(2) var<storage, read> links: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> seeds: array<vec4<f32>>;

// 世界坐标 [-1,1] 映射到视口，短边贴边，保证圆不被拉成椭圆
fn fit(p: vec2<f32>, aspect: f32) -> vec2<f32> {
  if (aspect > 1.0) {
    return vec2<f32>(p.x / aspect, p.y);
  }
  return vec2<f32>(p.x, p.y * aspect);
}

fn quad(vi: u32) -> vec2<f32> {
  var corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vi];
}

// ---------- 粒子场 ----------

struct PV {
  @builtin(position) pos: vec4<f32>,
  @location(0) alpha: f32,
};

@vertex
fn vsParticle(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> PV {
  let sd = seeds[ii];
  // 直接在归一化屏幕空间里铺满整块画布：x、y 各自 -1..1，不跟节点共用 fit，
  // 否则宽画布左右两侧会空出两条黑边
  let base = vec2<f32>(sd.x * 2.0 - 1.0, sd.y * 2.0 - 1.0);
  let phase = 6.2831853 * sd.z;
  let drift = vec2<f32>(cos(u.time * 0.05 + phase), sin(u.time * 0.05 + phase)) * 0.03;
  let size = 0.0016 + 0.0026 * sd.w;

  var out: PV;
  out.pos = vec4<f32>(base + drift + quad(vi) * size, 0.0, 1.0);
  // 只做很轻的中心加权：四角仍保留约一半密度，避免出现可见的边界或暗角
  let falloff = 1.0 - 0.45 * smoothstep(0.0, 1.5, length(base));
  out.alpha = (0.05 + 0.20 * sd.w) * falloff;
  return out;
}

@fragment
fn fsParticle(in: PV) -> @location(0) vec4<f32> {
  return vec4<f32>(0.55, 0.58, 0.98, in.alpha);
}

// ---------- 连线 ----------

struct LV {
  @builtin(position) pos: vec4<f32>,
  @location(0) alpha: f32,
};

@vertex
fn vsLink(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> LV {
  let l = links[ii];
  let p = select(l.xy, l.zw, vi == 1u);

  var out: LV;
  out.pos = vec4<f32>(fit(p, u.viewport.x / max(u.viewport.y, 1.0)), 0.0, 0.9);
  out.alpha = 0.16;
  return out;
}

@fragment
fn fsLink(in: LV) -> @location(0) vec4<f32> {
  return vec4<f32>(0.55, 0.62, 0.95, in.alpha);
}

// ---------- 节点 ----------

struct NV {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
};

@vertex
fn vsNode(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> NV {
  let node = nodes[ii];
  let hovered = (u.hover >= 0.0) && (abs(u.hover - f32(ii)) < 0.5);
  let catOn = (u.activeCat < 0.0) || (abs(u.activeCat - node.p.w) < 0.5);

  var scale = 1.0;
  if (hovered) {
    scale = 1.5;
  }

  var alpha = 1.0;
  if (!catOn) {
    alpha = 0.16;
  }
  if (hovered) {
    alpha = 1.0;
  }

  let uv = quad(vi);
  let wp = node.p.xy + uv * node.p.z * scale;

  var out: NV;
  out.pos = vec4<f32>(fit(wp, u.viewport.x / max(u.viewport.y, 1.0)), 0.0, 1.0);
  out.color = vec4<f32>(node.c.rgb, node.c.a * alpha);
  out.uv = uv;
  return out;
}

@fragment
fn fsNode(in: NV) -> @location(0) vec4<f32> {
  let d = length(in.uv);
  let mask = 1.0 - smoothstep(0.72, 1.0, d);
  return vec4<f32>(in.color.rgb, in.color.a * mask);
}
`;

/** 确定性 xorshift32：同一份数据在任何机器上得到同一张图 */
function makeSeeds(count: number): Float32Array {
  const out = new Float32Array(count * 4);
  let s = 0x9e3779b9 | 0;
  const next = () => {
    s ^= s << 13;
    s |= 0;
    s ^= s >>> 17;
    s |= 0;
    s ^= s << 5;
    s |= 0;
    return (s >>> 0) / 4294967296;
  };
  for (let i = 0; i < count * 4; i++) out[i] = next();
  return out;
}

export async function mountEcosystemGraph(
  canvas: HTMLCanvasElement,
  payload: EcosystemPayload,
  handlers: EcosystemHandlers
): Promise<EcosystemApi> {
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
  if (!gpu) throw new Error('WebGPU unavailable');

  const adapter = await gpu.requestAdapter();
  if (!adapter) throw new Error('No WebGPU adapter');
  const device = await adapter.requestDevice();

  const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
  if (!context) throw new Error('No webgpu canvas context');
  const format = gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodeCount = payload.meta.length;

  // 每个节点 8 个 float 正好是两个 vec4：p = (x, y, r, category)，c = (r, g, b, a)
  const nodeData = new Float32Array(payload.nodes);
  const linkData = new Float32Array(payload.links);
  const seedData = makeSeeds(PARTICLE_COUNT);

  const storage = (data: Float32Array) => {
    const buffer = device.createBuffer({
      size: Math.max(data.byteLength, 16),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  };

  const nodeBuffer = storage(nodeData);
  const linkBuffer = storage(linkData);
  const seedBuffer = storage(seedData);

  const uniformBuffer = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 暗底上的加色混合，粒子与节点自然发光
  const blend: GPUBlendState = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
  };

  const module = device.createShaderModule({ code: SHADER });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [0, 1, 2, 3].map((binding) => ({
      binding,
      visibility: GPUShaderStage.VERTEX,
      buffer:
        binding === 0
          ? ({ type: 'uniform' } as const)
          : ({ type: 'read-only-storage' } as const),
    })),
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
  const target: GPUColorTargetState = { format, blend };

  const particlePipeline = device.createRenderPipeline({
    layout,
    vertex: { module, entryPoint: 'vsParticle' },
    fragment: { module, entryPoint: 'fsParticle', targets: [target] },
    primitive: { topology: 'triangle-list' },
  });

  const linkPipeline = device.createRenderPipeline({
    layout,
    vertex: { module, entryPoint: 'vsLink' },
    fragment: { module, entryPoint: 'fsLink', targets: [target] },
    primitive: { topology: 'line-list' },
  });

  const nodePipeline = device.createRenderPipeline({
    layout,
    vertex: { module, entryPoint: 'vsNode' },
    fragment: { module, entryPoint: 'fsNode', targets: [target] },
    primitive: { topology: 'triangle-list' },
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: nodeBuffer } },
      { binding: 2, resource: { buffer: linkBuffer } },
      { binding: 3, resource: { buffer: seedBuffer } },
    ],
  });

  const uniforms = new Float32Array(8);
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    uniforms[0] = w;
    uniforms[1] = h;
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let hover = -1;
  let activeCat = -1;
  let disposed = false;
  let raf = 0;
  const started = performance.now();

  /** 客户端坐标 → 世界坐标（fit 的逆变换） */
  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const cy = 1 - ((clientY - rect.top) / Math.max(rect.height, 1)) * 2;
    const a = canvas.width / Math.max(canvas.height, 1);
    return a > 1 ? { x: cx * a, y: cy } : { x: cx, y: cy / a };
  };

  const pick = (clientX: number, clientY: number) => {
    const { x, y } = toWorld(clientX, clientY);
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < nodeCount; i++) {
      const nx = nodeData[i * 8];
      const ny = nodeData[i * 8 + 1];
      const nr = nodeData[i * 8 + 2];
      const d = Math.hypot(nx - x, ny - y);
      // 命中半径取节点半径与一个最小可点面积中的较大者，避免小节点点不中
      if (d <= Math.max(nr * 1.6, 0.024) && d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };

  const onMove = (event: PointerEvent) => {
    const next = pick(event.clientX, event.clientY);
    if (next !== hover) {
      hover = next;
      handlers.onHover(next === -1 ? null : next);
    }
    canvas.style.cursor = next === -1 ? 'default' : 'pointer';
  };

  const onLeave = () => {
    if (hover !== -1) {
      hover = -1;
      handlers.onHover(null);
    }
  };

  const onDown = (event: PointerEvent) => {
    const hit = pick(event.clientX, event.clientY);
    if (hit !== -1) handlers.onPick(hit);
  };

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);

  const render = () => {
    if (disposed) return;

    uniforms[2] = reduced ? 0 : (performance.now() - started) / 1000;
    uniforms[3] = hover;
    uniforms[4] = activeCat;
    device.queue.writeBuffer(uniformBuffer, 0, uniforms);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.02, g: 0.03, b: 0.09, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    pass.setBindGroup(0, bindGroup);
    pass.setPipeline(particlePipeline);
    pass.draw(6, PARTICLE_COUNT);

    pass.setPipeline(linkPipeline);
    pass.draw(2, payload.links.length / 4);

    pass.setPipeline(nodePipeline);
    pass.draw(6, nodeCount);
    pass.end();

    device.queue.submit([encoder.finish()]);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);

  return {
    setCategory(category: number | null) {
      activeCat = category === null ? -1 : category;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      for (const buffer of [nodeBuffer, linkBuffer, seedBuffer, uniformBuffer]) {
        try {
          buffer.destroy();
        } catch {
          /* 设备已丢失时忽略 */
        }
      }
      try {
        device.destroy();
      } catch {
        /* 同上 */
      }
    },
  };
}
