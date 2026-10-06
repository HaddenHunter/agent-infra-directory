import type { CategoryKey, Locale } from '../i18n/ui';

/**
 * 术语表。
 *
 * 每条术语只做两件事：给出一个足够窄、能用来做判断的定义，并指向本目录里
 * 这个术语真正现身的条目。定义部分刻意不写创始时间、不写作者、不写版本号——
 * 那些是记忆最容易出错的地方，而这一页没有核验状态可以挂。
 *
 * tools / papers 里的 id 必须真实存在：页面渲染前会跟集合比对，
 * 对不上的直接不渲染，避免点进去是 404。
 */
export interface GlossaryTerm {
  slug: string;
  term: { en: string; zh: string };
  /** 常见别名或缩写 */
  aka?: { en: string; zh: string };
  definition: { en: string; zh: string };
  tools?: string[];
  papers?: string[];
  categories?: CategoryKey[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'react-loop',
    term: { en: 'ReAct loop', zh: 'ReAct 循环' },
    aka: { en: 'reason–act loop', zh: '推理-行动循环' },
    definition: {
      en: 'The pattern of alternating a reasoning step with a tool action, so the model can revise its plan after seeing what the action returned. Most production agent runtimes are variations on this loop rather than implementations of the original paper.',
      zh: '把「推理一步」与「执行一个动作」交替进行的模式，模型因此能根据动作的返回结果修正下一步计划。今天大多数生产级 Agent 运行时都是这个循环的变体，而不是原论文的实现。',
    },
    tools: ['langgraph', 'crewai', 'microsoft-agent-framework'],
    papers: ['react'],
    categories: ['runtime'],
  },
  {
    slug: 'tool-calling',
    term: { en: 'Tool calling', zh: '工具调用' },
    aka: { en: 'function calling', zh: '函数调用' },
    definition: {
      en: 'A model emitting a structured request — name plus arguments — that the surrounding program executes, with the result fed back as context. The model never runs the code itself; the harness does, which is why the harness is where the security decisions live.',
      zh: '模型输出一个结构化请求（函数名加参数），由外层程序去执行，再把结果作为上下文回填。代码始终不是模型自己跑的，而是外层框架跑的——所以安全决策实际发生在框架这一层。',
    },
    papers: ['toolformer', 'codeact'],
    categories: ['mcp'],
  },
  {
    slug: 'model-context-protocol',
    term: { en: 'Model Context Protocol (MCP)', zh: '模型上下文协议（MCP）' },
    definition: {
      en: 'An open client–server protocol for exposing tools, resources and prompts to a model, so one integration works across different hosts and models instead of being rewritten per vendor. What a given server actually does — and what it is allowed to reach — is up to its implementation, not the protocol.',
      zh: '一个开放的客户端-服务端协议，用于把工具、资源与提示词暴露给模型，使同一份集成能跨不同宿主与模型复用，而不必按厂商各写一遍。协议本身不保证某个服务端具体做什么、能触达什么——那取决于它的实现。',
    },
    tools: [
      'mcp',
      'fastmcp',
      'mcp-registry',
      'mcp-reference-servers',
      'mcp-use',
      'smithery',
      'glama',
    ],
    categories: ['mcp'],
  },
  {
    slug: 'multi-agent',
    term: { en: 'Multi-agent system', zh: '多智能体系统' },
    definition: {
      en: 'Several model-driven agents with separate roles or contexts, coordinating through messages, shared state or a hand-off. It is an architectural choice with a cost: every extra hop adds a place for context to be lost and for failures to compound.',
      zh: '多个模型驱动的 Agent 各自持有独立角色或上下文，通过消息、共享状态或交接来协作。这是一种有代价的架构选择：每多一次传递，就多一处上下文丢失与错误累积的可能。',
    },
    tools: ['autogen', 'crewai', 'microsoft-agent-framework', 'agno'],
    papers: ['autogen', 'generative-agents'],
    categories: ['runtime'],
  },
  {
    slug: 'execution-sandbox',
    term: { en: 'Execution sandbox', zh: '执行沙箱' },
    definition: {
      en: 'The boundary a tool call executes inside: a container, microVM, kernel-level isolation layer or a managed runtime. Its job is to bound what generated code can reach once it runs, since the prompt-level defences upstream are advisory rather than enforcing.',
      zh: '工具调用实际执行时所在的边界：容器、microVM、内核级隔离层或托管运行时。它的职责是限制生成出来的代码一旦运行能触达什么——因为上游那些提示词层面的防护是劝告性的，不是强制的。',
    },
    tools: [
      'e2b',
      'daytona',
      'firecracker',
      'gvisor',
      'kata-containers',
      'microsandbox',
      'vercel-sandbox',
      'cloud-hypervisor',
    ],
    categories: ['sandbox'],
  },
  {
    slug: 'agent-memory',
    term: { en: 'Agent memory', zh: 'Agent 记忆' },
    definition: {
      en: 'Storage that persists beyond a single context window — conversation history, extracted facts, or an index retrieved by similarity — so an agent can act on something it was told earlier. The hard part is not writing to it but deciding what to retrieve and when to discard it.',
      zh: '跨越单个上下文窗口而持续存在的存储：对话历史、抽取出的事实，或按相似度检索的索引，使 Agent 能用上更早被告知的信息。难的不是写进去，而是决定该取回什么、以及什么时候该丢掉。',
    },
    tools: ['mem0', 'letta', 'zep', 'cognee', 'chroma', 'qdrant', 'weaviate'],
    papers: ['generative-agents'],
    categories: ['memory'],
  },
  {
    slug: 'agent-observability',
    term: { en: 'Agent observability', zh: 'Agent 可观测性' },
    definition: {
      en: 'Recording a run as structured traces and spans — each model call, tool call, token count, cost and error — so a failure can be attributed to a step rather than to "the agent". Without it, a bad outcome is indistinguishable from bad luck.',
      zh: '把一次运行记录成结构化的 trace 与 span：每一次模型调用、工具调用、token 数、成本与报错，使失败能归因到具体某一步，而不是笼统地说「Agent 不行」。没有它，坏结果和运气差是分不出来的。',
    },
    tools: [
      'langfuse',
      'langsmith',
      'arize-phoenix',
      'braintrust',
      'opik',
      'helicone',
      'wandb-weave',
      'clawmetry',
    ],
    categories: ['observability'],
  },
  {
    slug: 'human-in-the-loop',
    term: { en: 'Human in the loop', zh: '人在回路' },
    definition: {
      en: 'A checkpoint where a run pauses for approval before an irreversible action — a payment, a send, a deletion. Its value depends on the approval being specific: "allow this exact call" is a control, "are you sure?" is a formality.',
      zh: '在不可逆动作（付款、发送、删除）之前让运行暂停、等人批准的一个检查点。它的价值取决于批准有多具体：「允许这一次调用」是控制，而「你确定吗」只是形式。',
    },
    tools: ['langgraph', 'crewai', 'microsoft-agent-framework'],
    categories: ['runtime'],
  },
  {
    slug: 'agent-identity',
    term: { en: 'Agent identity', zh: 'Agent 身份' },
    definition: {
      en: 'Giving an agent its own verifiable identity and scoped credentials, instead of letting it inherit a human user\u2019s full permissions. The point is attribution and blast radius: you can revoke one agent, and you can tell which one acted.',
      zh: '让 Agent 拥有可验证的自身身份与受限凭证，而不是直接继承人类用户的全部权限。要解决的是归因与影响范围：你能单独吊销某一个 Agent，也能查清是哪一个动的手。',
    },
    tools: [
      'spiffe-spire',
      'microsoft-entra-agent-id',
      'okta-for-ai-agents',
      'oauth21-mcp-authorization',
      'auth0-for-ai-agents',
      'agntcy-agent-identity',
    ],
    categories: ['identity'],
  },
  {
    slug: 'agent-payments',
    term: { en: 'Agent payments', zh: 'Agent 支付' },
    definition: {
      en: 'Infrastructure that lets an agent move money or buy a resource on someone\u2019s behalf, usually by pairing a scoped credential with a per-transaction limit. It is the category where a human-in-the-loop checkpoint stops being optional.',
      zh: '让 Agent 能代理用户转移资金或购买资源的基础设施，通常做法是把受限凭证与单笔限额配在一起。在这个类目里，人在回路的检查点不再是可选项。',
    },
    tools: ['x402', 'coinbase-agentkit', 'stripe-agent-toolkit', 'tempo', 'circle-agent-stack'],
    categories: ['payment'],
  },
  {
    slug: 'prompt-injection',
    term: { en: 'Prompt injection', zh: '提示词注入' },
    definition: {
      en: 'Instructions hidden in content an agent reads — a web page, an email, a tool result — that the model then treats as if the operator had issued them. Filtering catches the obvious payloads; bounding what the agent can reach once it is fooled is what limits the damage.',
      zh: '藏在 Agent 会读取的内容里（网页、邮件、工具返回结果）的指令，模型会把它当成是操作者下的命令来执行。过滤能挡住明显的载荷；真正限制损失的是：一旦被骗到，Agent 能触达的范围有多大。',
    },
    papers: ['securewebarena', 'harnessrisk'],
    categories: ['sandbox'],
  },
  {
    slug: 'computer-use',
    term: { en: 'Computer use', zh: '计算机操作（Computer use）' },
    definition: {
      en: 'An agent driving a real interface — a browser, a desktop, OS-level apps — by looking at screenshots and emitting clicks and keystrokes, rather than calling an API. It buys coverage where no API exists and pays for it in brittleness and evaluation difficulty.',
      zh: 'Agent 通过看图、发点击与按键来操作真实界面（浏览器、桌面、系统级应用），而不是调用 API。它换来的是「没有 API 的系统也能用」，代价是脆弱性和评测难度。',
    },
    papers: ['osworld', 'webarena', 'voyager'],
    categories: ['sandbox'],
  },
  {
    slug: 'agent-benchmark',
    term: { en: 'Agent benchmark', zh: 'Agent 基准' },
    definition: {
      en: 'A scored task environment used to compare agents — a fixed task set, a harness that runs them and a scoring rule. The score is only comparable to runs on the same harness, which is why a number quoted without its scaffold and version is close to meaningless.',
      zh: '用来比较 Agent 的打分任务环境：固定任务集、负责执行的 harness，以及评分规则。分数只有在同一套 harness 上才可比——所以一个不带脚手架与版本信息的数字，基本没有意义。',
    },
    papers: ['gaia', 'swe-bench', 'tau-bench', 'agentbench'],
  },
];

export type GlossaryKey = string;

export const glossaryIndexUrl = (locale: Locale) =>
  locale === 'zh' ? '/zh/glossary/' : '/glossary/';

export const glossaryUrl = (locale: Locale, slug: string) =>
  locale === 'zh' ? `/zh/glossary/${slug}/` : `/glossary/${slug}/`;
