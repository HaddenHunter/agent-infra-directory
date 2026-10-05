# 反链材料（Backlink kit）

目标站点：<https://agent.c8.fit/>　仓库：<https://github.com/HaddenHunter/agent-infra-directory>

---

## 先读这段：现实预期

1. **awesome 列表大多是人工审核，并且明确反感自我推广。** 作为「目录站」去投稿，被拒是常态，不是失败。下面每一条都标了适配判断，别抱错期望。
2. **真正加快收录的不是 awesome 列表**，而是有真实流量的地方提到你（HN、Reddit 相关讨论、别人的博客/Newsletter）。新域名 + 零外链时，Google 甚至不会主动发现你。
3. **不要群发同一段文案。** 列表维护者能识别模板化投稿，一旦被判定为 spam，账号在多个列表会被连带拉黑。
4. 投稿前**务必读一遍目标列表的 CONTRIBUTING 或投稿说明**——本文件里的判断是我读它们的 README 结构得出的，不等于它们的现行规则。

---

## 候选列表（已逐个核验，2026-10-06）

| 仓库 | Star | 最近更新 | 可放位置 | 适配判断 |
| --- | --- | --- | --- | --- |
| [kyrolabs/awesome-langchain](https://github.com/kyrolabs/awesome-langchain) | 9.6k | 2026-10-02 | `Complement to this list` | ✅ **最合适**。该节就是放相关资源列表的 |
| [ikaijua/Awesome-AITools](https://github.com/ikaijua/Awesome-AITools) | 6.2k | 2026-10-05 | `AI News & Information` / `AI Agent` | ✅ 该列表确实收站点而非只收工具 |
| [Jenqyang/Awesome-AI-Agents](https://github.com/Jenqyang/Awesome-AI-Agents) | 1.3k | 2026-10-02 | `Related` | ⚠️ 可以试，该节较杂 |
| [steven2358/awesome-generative-ai](https://github.com/steven2358/awesome-generative-ai) | 12.7k | 2026-10-03 | 未在标题里看到目录类专区 | ⚠️ 需先读投稿规则 |
| [e2b-dev/awesome-ai-agents](https://github.com/e2b-dev/awesome-ai-agents) | 30.3k | 2026-08-21 | 无资源专区，条目全是具体 agent 项目 | ❌ 我们是目录不是 agent |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 95.8k | 2026-09-27 | 只有 MCP Server 分类 + Aggregators | ❌ 本站不是 MCP server |
| [Hannibal046/Awesome-LLM](https://github.com/Hannibal046/Awesome-LLM) | 27.4k | 2025-07-31 | — | ❌ 已停更约 14 个月 |
| [mahseema/awesome-ai-tools](https://github.com/mahseema/awesome-ai-tools) | 6.3k | 2025-12-31 | — | ❌ 已停更 |
| ~~zebbern/awesome-artificial-intelligence~~ | — | — | — | ❌ **仓库不存在（404）** |

> 说明：Star 与更新日期取自 GitHub API，不是估计值。`Hannibal046/Awesome-LLM` 和 `mahseema/awesome-ai-tools` 停更超过半年，投了也没流量，不建议花时间。

---

## 通用条目文本（一行式）

```
- [AI Agent Infrastructure Directory](https://agent.c8.fit/) — Bilingual (EN/中文), fact-checked directory of 80 agent-infrastructure tools, 23 agent benchmarks and 22 papers. Every entry leads with a self-contained citable judgment; star counts come from the GitHub API and paper metadata from the arXiv API, never typed by hand.
```

中文版（如目标列表以中文为主）：

```
- [AI Agent 基础设施目录](https://agent.c8.fit/zh/) — 中英双语、逐条核验的目录：80 个 Agent 基础设施工具、23 个评测基准、22 篇论文。每条都带一句可独立引用的判断句；星标取自 GitHub API、论文元数据取自 arXiv API，绝不手写。
```

---

## PR 描述模板

> 标题：`Add AI Agent Infrastructure Directory to Complement to this list`

```markdown
Adds a fact-checked directory of AI agent infrastructure.

Why it may be worth listing: the entries are not link dumps. Each one leads with a
self-contained sentence (claim + number + date + entity) that can be quoted without
context, and the machine-verifiable fields are populated from APIs rather than typed:
GitHub star counts, archive status and last-push dates come from the GitHub API, and
paper titles, author lists and dates come from the arXiv API.

It also documents claims that did not survive checking as explicit corrections rather
than repeating them — for example, a widely circulated "LangGraph + CrewAI reaches 96%"
statistic that has no traceable source.

- Site: https://agent.c8.fit/
- Source: https://github.com/HaddenHunter/agent-infra-directory
- For AI agents: https://agent.c8.fit/llms.txt
```

---

## Hacker News 草稿

**发在 `Show HN`。** HN 对「目录站」本身兴趣有限，但对**「我核对了那些被反复引用的数字，发现对不上」**兴趣很大——那才是这条的钩子。所以正文要把重点放在核验上，而不是罗列功能。

标题（三选一）：

```
Show HN: A fact-checked directory of AI agent infrastructure
Show HN: I tried to verify the numbers behind popular AI agent claims
Show HN: Agent infrastructure directory where the numbers are machine-checked
```

正文：

```
I kept running into the same problem while choosing agent infrastructure: the
widely-quoted numbers did not hold up.

So I built a directory where that is the point. Every entry leads with a single
citable sentence, and the fields that can be checked by machine are populated from
APIs rather than typed by hand — star counts and archive status from the GitHub API,
paper titles and author lists from the arXiv API.

A few things did not survive checking, and are written up as corrections instead of
being repeated:
- A framework comparison statistic that circulates widely with no traceable source
- A benchmark that turned out not to exist under the name it is cited by
- A "12 MCP servers" reliability table whose figures have no origin

It covers 80 tools across 8 categories, 23 benchmarks and 22 papers (16 landmark,
6 frontier), in English and Chinese. Every content page also has a Markdown rendition
and there is an llms.txt, since a fair number of visitors are now agents.

https://agent.c8.fit/

Happy to hear what I got wrong — corrections are the point.
```

> 发帖注意：
> - **周二到周四、美东上午**发帖回复率最高；发完至少守着评论区两小时。
> - 正文里**不要**出现「这是我做的项目，请支持」这类话，HN 反感。
> - 结尾那句「corrections are the point」要留着——它把评论区从质疑变成贡献。

---

## Reddit 草稿

**目标：r/LocalLLaMA、r/AI_Agents、r/LLMDevs。** 每个 subreddit 规则不同，发之前先看置顶帖；很多要求账号有 karma 且有历史发言，新号会被自动过滤。

标题：

```
I checked the numbers behind the most-repeated AI agent claims. Several don't hold up.
```

正文：

```
Spent the last while putting together a reference for agent infrastructure and
decided to verify the claims I kept seeing repeated. Some results:

- A "framework X + Y reaches 96%" statistic that gets cited constantly — no
  traceable source.
- A named benchmark that does not exist under the name people cite it by.
- A table of MCP server reliability figures with no origin.

Rather than repeat them, I wrote them up as corrections so the next person
searching for them finds the problem instead of the number.

The rest is a directory: 80 tools across 8 categories, 23 benchmarks, 22 papers
(16 landmark, 6 frontier). Machine-checkable fields come from APIs — star counts
from GitHub, paper metadata from arXiv — so dates and authors aren't typed by hand.

English: https://agent.c8.fit/
中文: https://agent.c8.fit/zh/

Corrections welcome, that's the whole idea.
```

> 注意：r/LocalLLaMA 对自我推广较严，若被删就换个角度发——比如只讲「核对数字」这件事，把链接放评论区。

---

## 其他值得做的（比 awesome 列表更有用）

| 渠道 | 说明 |
| --- | --- |
| 仓库 README | 已建：[README.md](../README.md)。GitHub 仓库页本身就会链到站点，这是零成本的一个反链入口 |
| 工具仓库互相引用 | 站内 61 个工具条目带 GitHub 仓库。**不要**去人家仓库开 issue 求互链，那会被当 spam。正确做法是：若某工具文档写错了，提一个有实质内容的 PR 顺手说明来源 |
| 你的其它项目 | 若有别的仓库/博客/个人主页，加一个链接。**同一主体控制的站点互链权重很低**，但聊胜于无 |
| 中文渠道 | 掘金、V2EX、少数派。中文 AI Agent 基础设施的整理内容很少，竞争小 |
| 被引用比主动投稿有用 | 真正有效的是别人写文章时引用你。前提高质量内容 + 时间，没有捷径 |

## 不要做的

- ❌ 买外链、交换链接、用 PBN —— 会被 Google 判为垃圾外链，可能连累站点
- ❌ 在无关帖子下刷链接
- ❌ 同一文案群发到所有渠道
- ❌ 用多个账号给同一个站造链
