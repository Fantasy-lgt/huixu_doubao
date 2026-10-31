# MVP 排期与任务拆解（8 周 / 2 个月）

配套：《AI汇报助手-产品方案与架构设计-v1.md》。
已决策：云端账号版 MVP ｜ 模板卡片先行 ｜ 复用已有服务器 ｜ P0 全量 + 部分 P1。
原则：每周有可运行检查点；做不完的任务直接降级到 P2，不拖垮主线。

---

## 1. 排期总览

| 周次 | 阶段 | 周目标（周末应能演示什么） | 主要交付 |
| --- | --- | --- | --- |
| W1 前半 | A 开工准备 | 仓库跑起来、数据表定稿、服务器环境摸清 | 目录结构、ER 图、环境清单、最小技术验证记录 |
| W1 后半–W3 | B 云端地基 + 核心闭环 | 注册登录后能完成：入库材料 → 本地整理初稿 → 核对 → 导出 pptx；两账号隔离 | 账号体系、材料库、本地整理、导出、隔离测试 |
| W4–W5 | C AI 受控生成 + 对话助手 | 填一个可用 Key 后 AI 可生成；说一句话能触发整理，缺信息给选项 | 模型适配层、对话抽屉、SSE 进度、失败保护 |
| W6 | D 模板卡片 + 编辑器 | 大纲自动匹配模板卡 Top3；三栏编辑器顺畅编辑并导出带版式 pptx | 模板卡体系、匹配规则、编辑器、预览 |
| W7 | E 年度实体表 + 体验收尾 | 人员/客户/合同三类实体可确认入库并导出清单；窄屏与备份可用 | 实体表、年度视图、备份脚本、响应式打磨 |
| W8 | F 作品集包装发布 | 服务器可访问、闭环走通、文档与演示视频齐备 | 部署演练、README、演示脚本、面试问答 |

每周结束做一次 15 分钟自检：本周功能能否独立演示、有没有遗留阻断项、是否需要把某任务移到 P2。

---

## 2. 技术栈与仓库结构（约定，避免边做边换）

- 前端：Vue 3 + TypeScript + Vite + Vue Router + Pinia；组件库选 Element Plus 或 Naive UI（成熟、后台表单表格够用，先定一个不换来换去）。
- 后端：Node.js + TypeScript；框架用 Fastify（轻、快、类型友好）或 Express（资料多）；ORM 用 Prisma 或 TypeORM（二选一，团队熟哪个用哪个）。
- 数据库：PostgreSQL 15+；本地开发可用 Docker 起容器，不依赖本机安装。
- PPT 导出：保留 pptxgenjs（Node 侧），模板卡片对应其不同 layout 配置。
- 实时：SSE（已具备经验）用于生成进度与流式文本。
- 部署：docker-compose.yml（web 前端静态 + api + postgres + nginx），数据卷持久化。

建议仓库结构（单体仓库，个人项目不必拆多仓）：

```
project/
  web/                 # Vue3 前端
    src/
      views/  components/  stores/  api/  types/
  server/              # Node 后端
    src/
      modules/ auth materials drafts templates entities assistant export/
      core/ db prisma/（或orm） adapters/ llm/ ppt/ common/
    tests/
  deploy/
    docker-compose.yml  nginx.conf  .env.example
  docs/                # PRD/ADR/部署记录，沿用初代文档风格
```

---

## 3. 逐周任务拆解

### W1（阶段 A）：开工准备

**后端**
- [ ] 初始化 TypeScript 工程、lint、测试骨架（node:test 或 Vitest）。
- [ ] 定稿数据表（见第 4 节），本地 Docker 起 PostgreSQL，跑通首次迁移。
- [ ] 抽出初代 domain.cjs 的纯函数（期间计算、三章节本地整理规则、引用校验、长度限制），改造成不依赖 state.json 的模块，配单测。

**前端**
- [ ] Vite + Vue3 初始化，路由骨架：登录/工作台/材料库/年度回顾/模板库/设置。
- [ ] 全局布局：左侧导航 + 右侧主区（飞书式骨架先搭出来）。

**技术 Spike（先跑通最小验证，不做完整功能）**
- [ ] pptxgenjs 在服务端按配置生成 1 页带配色 pptx 并能下载（复用初代已验证结论，确认云端环境依赖可装）。
- [ ] 用一个免费/低价测试 Key 调通 DeepSeek（或选定模型）一次非流式请求，确认网络可达与返回结构。
- [ ] 服务器环境摸底并记录（对应 12.2-A 清单）。

**周末检查点**：本地 `docker compose up` 能起空壳前后端；初代整理规则函数有测试覆盖。

---

### W2–W3（阶段 B）：账号隔离 + 核心闭环

**W2 账号与材料库**
- [ ] 用户注册/登录（邮箱+密码，密码哈希；HttpOnly Cookie Session）；退出登录；登录态校验中间件。
- [ ] 隔离中间件：所有业务查询强制带 `userId`；写操作校验归属；补「A 账号访问 B 资源返回 403」测试用例。
- [ ] 材料模型落地：标题、类型枚举、标签、期间、场合（替代原部门字段）、正文、来源名、版本、时间戳。
- [ ] 材料库页面：列表卡片、类型筛选条、标签筛选、月份筛选、关键词搜索、新建材料（粘贴 + TXT/MD 上传解析）、查看原文、删除（带影响提示）。
- [ ] 重复导入校验沿用初代思路（期间+正文指纹去重）。

**W3 整理闭环与导出**
- [ ] 选范围（月度/年度、月份、类型组合）→ 本地规则生成三章节初稿；草稿版本与确认状态（移植初代 confirmedVersion 逻辑到数据库版本号）。
- [ ] 编辑器基础：章节/条目增删改、上下移、来源跳转、人工补充标记、保存草稿、确认流程。
- [ ] 导出 pptx：移植 pptx.cjs 分页折行与基础版式；确认后才可导出；失败不丢稿。
- [ ] 年度视图基础版：覆盖月份格、缺月提示（沿用初代逻辑）。
- [ ] 备份：个人 JSON 导出/导入基础版。

**周末检查点**：两个测试账号各自入库、整理、导出互不串号；无 Key 时全链路可用。

---

### W4–W5（阶段 C）：AI 生成 + 对话助手

**W4 模型适配层**
- [ ] 统一内部请求结构；Provider 适配器（首期 1 家，DeepSeek 兼容协议）；错误分类（鉴权 401/403、限流 429、超时、坏 JSON、越界引用）。
- [ ] Key 管理：加密存储、前端只显配置状态、不进备份/日志；外发确认弹窗（材料份数与范围明示）。
- [ ] 复用初代 AI 输出契约：固定章节结构 + sourceIds + evidence 逐字引用校验；不合格整份拒绝、保留原稿；不自动重试收费调用。
- [ ] SSE 生成进度推送；失败可一键切回本地整理。

**W5 对话助手简化版**
- [ ] 助手抽屉：输入框 + 建议指令 chips（月度汇报、年度汇总、查材料、找模板）。
- [ ] 意图识别（规则兜底 + LLM 输出 JSON 槽位）；必填槽位缺失时一次问清，每题给 ≥3 个可点选项。
- [ ] 槽位齐全后触发既有整理工作流，展示「已选 N 份材料 / 待补项 / 使用模板」。
- [ ] 异常分支：无适配模板 → 给近似卡片；材料不足 → 列出缺口；动作仅白名单（只读查询 + 生成草稿），不直接删除/外发导出。

**周末检查点**：一句话「整理 10 月管理会材料」可进入大纲；模型报错时原稿不丢、可退回本地模式。

---

### W6（阶段 D）：模板卡片库 + 编辑器增强

- [ ] 模板卡数据结构与内置卡片库（封面、三要点页、多要点页、两栏对比、数据占位页、时间轴、结尾页；每张带页型/要点数/场景标签/主色）。
- [ ] 大纲页结构化描述（页目标/内容类型/要点数/数据类型/标签）与匹配打分，返回 Top3 供选择，可手动替换。
- [ ] 三栏编辑器成型：左材料依据、中条目编辑、右大纲与属性；步骤条（准备→大纲→核对→模板→导出）；编辑后确认状态失效逻辑。
- [ ] 逐页 HTML 近似预览；导出按选中卡片套用配色与版式。
- [ ] 新建模板卡（元数据级：名称/场景/要点数/基础版式/主色）；无适配卡片时提示「保存为新模板卡」。
- [ ] 导出水印开关位（默认试用版浅色水印，会员字段预留，不接支付）。

**周末检查点**：生成大纲后每页给出推荐卡片，切换卡片可见预览，导出 pptx 跟随版式。

---

### W7（阶段 E）：年度实体表 + 收尾

- [ ] 三类实体表（人员/客户/合同）：列表、新增编辑、关联来源材料；AI 建议候选条目、人工确认后入库（不直接采信 AI 实体）。
- [ ] 年度视图增强：按实体类型出清单（退休/在职人员、客户阶段、合同状态），确定性查询 + 来源回溯；材料维度统计（按类型/月份计数，简单图表）。
- [ ] 备份脚本（数据库每日导出 + 保留多份）；恢复走查一次。
- [ ] 窄屏响应式打磨；空状态、错误提示、加载态统一；全局操作反馈。

**周末检查点**：从全年材料生成确认过的实体清单；备份可恢复。

---

### W8（阶段 F）：作品集包装与部署发布

- [ ] 部署演练：compose 上服务器，Nginx + HTTPS、环境变量、数据卷、备份脚本；记录完整部署步骤到 docs。
- [ ] README（项目简介、技术栈、本地启动、部署、演示路径）；架构图更新到最新；测试运行说明。
- [ ] 2 分钟演示脚本（登录→入库→一句话生成→核对→换模板→导出；再演示年度汇总与实体清单；再演示一次失败保护）。
- [ ] 面试问答整理：为什么不做通用 AI PPT、为什么用 PG 而不是纯文件、模板匹配规则怎么设计、为什么暂缓画布/会员/小程序、失败场景怎么处理。
- [ ] 录屏演示视频；清理虚构示例与测试数据；交付源码与文档。

**交付标准**：线上地址可访问、注册走通闭环、代码可复现启动、文档能让他人按步骤部署。

---

## 4. 数据表初稿（W1 定稿依据，字段可随开发微调）

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| users | id, email, password_hash, plan, created_at, status | plan 默认 free；不存明文密码 |
| materials | id, user_id, title, material_type, tags(jsonb), period, occasion, body, source_name, file_ref, version, created_at, updated_at | body 原文只读；occasion 替代原部门字段 |
| drafts | id, user_id, kind, range_filter(jsonb), title, sections(jsonb), source_refs(jsonb), generation_mode, confirmed_version, version, created_at, updated_at | sections 结构沿用初代：章节/条目/sourceIds/evidence/origin |
| template_cards | id, user_id(null=内置), name, scene, page_type, item_count, data_kind, palette(jsonb), layout_ref, built_in, created_at | 内置卡全员只读共享；个人卡私有 |
| entities | id, user_id, kind(person/customer/contract), name, attributes(jsonb), period, source_material_ids(jsonb), confirmed, created_at | confirmed=false 为 AI 候选草稿 |
| model_keys | id, user_id, provider, encrypted_key, label, enabled_at | 密钥加密；不明文返回前端 |
| export_records | id, user_id, draft_id, file_ref, has_watermark, created_at | 导出留痕，会员字段预留 |

通用约束：所有业务表 `user_id` 非空并建索引；`created_at/updated_at` 统一；软删除或硬删除规则在 W2 定（建议材料硬删除 + 导出物独立，沿用初代思路）。

---

## 5. 后端接口草案（REST，W2 起逐个实现）

- 认证：`POST /auth/register`、`POST /auth/login`、`POST /auth/logout`、`GET /me`
- 材料：`GET /materials`（筛选：类型/标签/月份/关键词）、`POST /materials`、`GET /materials/:id`、`PUT /materials/:id`、`DELETE /materials/:id`
- 草稿：`POST /drafts/generate`（含 mode/local|ai、allowExternal）、`GET /drafts`、`GET /drafts/:id`、`PUT /drafts/:id`、`POST /drafts/:id/confirm`、`POST /drafts/:id/export`
- 模板：`GET /template-cards`、`POST /template-cards`、`PUT /template-cards/:id`、`POST /drafts/:id/match-templates`
- 助手：`POST /assistant/parse-intent`、`POST /assistant/generate`（SSE）
- 实体：`GET /entities?kind=`、`POST /entities`、`PUT /entities/:id`、`POST /entities/:id/confirm`
- 模型 Key：`GET /model-keys`、`POST /model-keys`、`DELETE /model-keys/:id`
- 备份：`GET /backup/export`、`POST /backup/import`

所有写接口校验归属与版本冲突；错误统一 `{error:{code,message}}`，不回显密钥与堆栈。

---

## 6. 风险与降级预案（排期内真实发生时按此处理，不硬扛）

| 情况 | 降级动作 |
| --- | --- |
| 某周任务超期 | 先砍本周内 P1 子集（如实体表简化为仅人员类），保核心闭环；被砍项登记 P2 |
| 模型联调受阻 | 本地规则模式完整可用先交付；AI 功能标「已预留接口、待 Key 联调」，不伪装成功 |
| pptx 版式问题 | 先保证文本可编辑与配色正确，复杂图表版式移 P2，不阻塞导出链路 |
| 服务器资源不足 | 先本地演示交付，服务器部署任务顺延，不在低配置上强行堆组件 |
| 前端组件耗时超预期 | 表单/列表先用基础组件保证功能，视觉美化放 W7 统一处理 |

---

## 7. 下一步（按顺序推进）

1. **开发文档已就绪**：《PRD-01-账号与数据隔离》《PRD-02-材料库》两份开发级文档已产出，W1–W2 开发直接对照执行。
2. **技术选型拍板（开工前 10 分钟可定）**：后端框架 Fastify（推荐）/Express；ORM Prisma（推荐）/TypeORM；前端组件库 Element Plus（推荐）；模型首选 DeepSeek。无特殊偏好就按推荐默认值走，不再反复比较。
3. **服务器采购**：按主文档 7.1.1 规格下单全新云主机；域名与备案尽早提交（备案周期不等人）；W8 部署前就绪即可，不阻塞前期本地开发。
4. **准备样本**：1–2 份脱敏材料样例（没有不阻塞 W1–W2，先用虚构数据）。
5. **进入 W1 开发**：按第 3 节 W1 任务初始化仓库、定稿数据表、跑通两个 Spike。
