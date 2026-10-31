# 豆包工作研发小组 · 团队配置说明

本目录由四个来源 agent 包迁移、整合而成，运行在豆包本地工作环境（Windows / Node / Vue3·Fastify·Prisma）。
原始来源文件保持原样不删除，整合产物只落在本目录 `team/`。

## 1. 组织架构

```
主对话（研发小组长，统筹）
└─ team/members/
   ├─ m1-product      产品经理
   ├─ m2-architect   软件架构师
   ├─ m3-developer   研发工程师（前端/后端/原型与界面落地）
   └─ m4-quality     质量与安全官
team/skills/         去重后的共享技能实体（41 个唯一技能，一份多成员引用）
team/reviews/        各成员评估与评审产出（只读分析报告落盘处）
```

组长不单独建目录，统筹规则见仓库根目录 `AGENTS.md`。

## 2. 来源映射（迁移留痕）

| 现成员 | 主来源 | 并入素材 |
| --- | --- | --- |
| m1-product | `D:\软件研发小组\agents\a2` 产品经理 | `Downloads\产品经理搭档` 的决策门/数字口径门/指标门禁 |
| m2-architect | `D:\软件研发小组\agents\a3` 软件架构师 | 原包全部架构/数据/图示技能 |
| m3-developer | `D:\软件研发小组\agents\a4` 研发工程师 | `Downloads\UI 设计师` 的界面方法论与交付标准、`Downloads\产品原型设计师` 的原型方法与可运行边界声明 |
| m4-quality | `D:\软件研发小组\agents\a5` 全栈代码质检官 | 安全审查、依赖审计、单测、评审意见处理 |

> 用户口径为“四个专业子 agent”，因此 UI 设计师与产品原型设计师不单列，其能力并入 m3；产品经理搭档并入 m1。

## 3. 技能索引与启用状态

共享技能统一位于 `team/skills/<name>/SKILL.md`，成员 `skills.json` 只做引用与开关，不重复拷贝实体。

### m1-product
| 技能 | 状态 | 用途 |
| --- | --- | --- |
| doubao-product-manager | enabled | 需求治理、方案取舍、MVP、PRD、验收、Roadmap |
| doubao-product-analysis | enabled | 市场/竞品/定位证据型分析 |
| doubao-product-qa | enabled | 依据 PRD/页面/接口做 QA 用例与发布判断 |
| doubao-questionnaire-designer | enabled | 问卷/访谈提纲（本期少用，备查） |
| metrics-tracking | enabled | 指标口径与复盘 |

### m2-architect
| 技能 | 状态 | 用途 |
| --- | --- | --- |
| architecture-designer | enabled | 高层架构、ADR、取舍评估 |
| api-designer | enabled | REST 资源建模、错误码、分页与版本策略 |
| backend-patterns | enabled | Node/Fastify 后端模式与服务边界 |
| database-optimizer | enabled | PostgreSQL 索引、查询与慢 SQL 优化 |
| thinking-systems | enabled | 反馈回路与系统因果分析 |
| mermaid-tools | enabled | Markdown 内 mermaid 图（仅文档辅助） |
| excalidraw-diagram | enabled | 手写风格架构/流程示意（备查） |
| microservices-architect | disabled | 本期为单体应用，微服务拆分不启用，仅在未来拆分时参考 |

### m3-developer
| 技能 | 状态 | 用途 |
| --- | --- | --- |
| writing-plans | enabled | 实现前任务分解与路线 |
| software-architecture-design | enabled | 局部方案与约束分析（配合 m2） |
| doubao-coding-analyze-codebase | enabled | 只读追踪入口/调用链/数据流 |
| doubao-coding-develop-frontend-features | enabled | Vue3 前端页面/组件/交互落地 |
| doubao-coding-develop-backend-features | enabled | Fastify/Prisma 服务端行为落地 |
| diagnose | enabled | 故障与异常定位 |
| systematic-debugging | enabled | 复现→假设→验证闭环 |
| tdd / test-driven-development | enabled | 红绿重构与测试反模式防范 |
| verification-before-completion | enabled | 完成前真实运行证据 |
| review | enabled | 交付前规范与需求符合度自查 |
| prototype | enabled | 快速可运行原型/状态机验证 |
| doubao-ui-design | enabled | 界面设计方法论与 gold 参考（不跑其发布脚本） |
| ui-design-methodology | enabled | 设计系统/层次/色彩/栅格基线 |
| ui-delivery-standard | enabled | 界面交付质量门（自测清单思想） |
| chart-generator | enabled | 图表作为页面内联实现 |
| landing-page-generator | enabled | 营销/介绍页方法（本期少用，备查） |
| doubao-visual-creative | enabled | 视觉方向参考（不跑其 deck 脚本） |
| delivery-routing | enabled（适配后） | 产物形态判定逻辑，飞书分支已替换为本地分支 |
| doubao-coding-optimize-performance | enabled（与 m4 共享） | 有测量基线时才启用 |
| beautiful-feishu-whiteboard | disabled | 依赖飞书画板写入权限，本环境不可用，替代见第 4 节 |

### m4-quality
| 技能 | 状态 | 用途 |
| --- | --- | --- |
| doubao-coding-review-code | enabled | diff/变更范围代码审查 |
| doubao-coding-analyze-codebase | enabled | 影响面与调用链只读分析 |
| doubao-coding-develop-unit-tests | enabled | 单测设计与回归用例（TS 语言子集） |
| doubao-coding-optimize-performance | enabled | 性能问题先立测量合同 |
| ec-security-review | enabled | 鉴权/输入/密钥/敏感接口安全清单 |
| terminal-security-audit | enabled | 密钥泄露、配置与常见漏洞扫描思路 |
| depguard | enabled（思路层） | 依赖漏洞与许可证治理；无扫描结果时只列检查项 |
| receiving-code-review | enabled | 评审意见落地前的严谨甄别 |
| sqlx-code-review | disabled | 面向 Rust sqlx，本栈 TypeScript/Node 不适用 |

## 4. 原平台依赖与适配映射（迁移核心改造）

来源包为飞书妙搭（Aily/Miaoda）导出，`agent_type: AILY_PERSONAL`，并绑定飞书云文档/画板与平台私有工具。迁移到豆包本地环境后按下表适配；技能正文里的平台专属命令不直接执行，方法论与质量门禁继续生效。

| 原妙搭/飞书能力 | 来源依据 | 本环境适配方式 |
| --- | --- | --- |
| `lark-cli docs +create/+update/+fetch` | a2/a4/a5 交付段 | 结论落本地 Markdown（`docs/`、`team/reviews/`），用 present_files 交付；用户明确要在线文档时再走 lark-doc 技能 |
| `@larksuite/whiteboard-cli` 真画板 + mermaid 占位替换 | a4/a5、UI/原型交付链 | 不写入飞书画板；图示改用 `doubao-visualization` 产出本地 HTML/SVG，结论报告内引用 |
| `beautiful-feishu-whiteboard` 技能 | 三个下载包重复出现 | disabled；仅保留设计风格参考，不执行其 preflight/写入脚本 |
| `create_html` 强制报告网页 | delivery-routing / UI / 原型 persona | 报告型结论以 Markdown 为主；需要可视化时产出独立本地 HTML 或 renderer 图示 |
| `app_builder` + `arch_type=html/fullstack/jspage` | UI / 原型 persona | 对应 `app_builder_agent`；本项目正式源码不用它生成，仅在独立演示页可用 |
| `NotifyHuman` | a4/a5 | `present_files` 交付本地文件 |
| `aily-generate-image` | UI persona | `image_gen` / `image_edit` |
| `web-search` | UI persona | `general_search` + `web.fetch` |
| 飞书 bot `DM 通知管理员` 红线 | a3/a5 | 不发 DM；P0 安全/隐私问题在报告顶部显式列出并要求用户确认 |
| “云文档 + 真画板 + HTML 三件套”硬要求 | a4/a5/原型 persona | 本期统一为：评估报告 Markdown + 必要的本地 HTML/SVG 图示；未获用户明确要求不创建飞书云文档 |
| 平台 `skill_id`（如 skill_4mc…） | 各 skills.json | 运行时以目录名 + `SKILL.md` 为准；skill_id 仅作来源溯源，不参与路由 |

## 5. 配置格式约定

- 成员元数据：`members/<m>/agent.yml`，沿用原字段 `name / description / avatar`（avatar 为迁移时复制的头像 png）。
- 成员技能清单：`members/<m>/skills.json`，数组元素保留 `dir / name / label / type`，新增 `enabled` 与 `note`；`dir` 指向 `team/skills/<dir>`，相对仓库根解析。
- 成员工作规范：`members/<m>/AGENTS.md`，继承原人设的证据门禁、安全红线与交付边界，删除妙搭运行环境自述与飞书强制交付段。
- 技能实体：`team/skills/<dir>/SKILL.md` 为事实源；其 `scripts/` 中平台发布类脚本（deliver/publish/deck/whiteboard）只留档不执行，纯计算类脚本（优先级打分、实验口径）可按需运行。

## 6. 入库策略

`team/skills` 中纯二进制参考资产（gold 示例图片、画板样式图、tests 样例）体量大且非运行必需，由仓库根 `.gitignore` 排除，文本类方法论文档与模板入库；完整资产仍保留在本地磁盘，不随仓库分发。

## 7. 来源保留声明

四个原始目录（`D:\软件研发小组`、`Downloads\UI 设计师`、`Downloads\产品经理搭档`、`Downloads\产品原型设计师`）本任务只读复制、不修改、不删除；溯源信息以第 2、3 节映射为准。
