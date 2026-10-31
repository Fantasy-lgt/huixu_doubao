# 02 · 技术架构评估报告（m2 软件架构师）

- 负责人：m2-architect ｜ 依据技能：architecture-designer、api-designer、backend-patterns、database-optimizer、software-architecture-design
- 评估日期：2026-10-31 ｜ 只读评估，不改源码
- 输入：`server/`、`web/`、`server/prisma/schema.prisma`、`docs/AI汇报助手-产品方案与架构设计-v1.md` §6、`docs/MVP排期与任务拆解-8周.md` §2/§4/§5、`docs/技术Spike方案与脚本模板.md`、`server/.env.example`、`server/tsconfig.json`
- 输出位置：`team/reviews/02-architecture-assessment.md`

---

## 一、结论先行（架构视角）

**总体判断：技术选型与团队真实能力匹配、单体边界合理、数据模型主体对齐需求；现有架构骨架可保留并继续填充，建议「保留选型与 schema 主体 + 补齐分层/会话表/校验层/测试基座」，不需要推倒重来。**

- 选型（Vue3+TS+Vite / Fastify+TS+Prisma+PostgreSQL / pptxgenjs / SSE 预留 / Docker Compose）方向正确，与方案 §6.2 的理由一致，无简历外技术（未背 RAG/Agent/微调/多模型编排）。
- `schema.prisma` 七张主表与排期 §4、PRD-01/02 基本对齐，行级 `userId` 隔离思路、级联策略、内置模板可空归属都已在模型层表达。
- 当前架构"未成型"是因为实现尚处 W1 脚手架阶段（无 services 层、无迁移、无部署编排、无测试基座），而不是架构设计错误；推翻重写只会丢弃正确的起点。

## 二、选型评估（对照方案 §6.2 与实际依赖）

| 层 | 方案选型 | 实际落地 | 匹配度 | 评估意见 |
| --- | --- | --- | --- | --- |
| 前端框架 | Vue3 + TS + Vite | `web/package.json`：vue ^3.4.38、vite ^5.4.2、typescript ^5.5.4 | 高 | 与简历栈一致，合理 |
| 前端路由 | Vue Router 4 | vue-router ^4.4.3，`router/index.ts` 7 条路由 | 高 | 路由表对齐 IA 对照表 |
| 前端组件库 | Element Plus（README 定；排期给二选一） | **未安装**，`main.ts` 仅 TODO 注释 | 待落地 | W1 必须定案并安装；悬置状态见第四节 R-1 |
| 状态管理 | 排期 §2 提 Pinia | **无依赖、无 stores 目录** | 待决 | 见 ADR-006 建议 |
| 后端运行时 | Node22 + TS | `type: module`、tsx watch、typescript ^5.5.4、strict 开启 | 高 | `tsconfig` strict=true，质量基线好 |
| 后端框架 | Fastify | fastify ^4.28.1，已注册 cors/cookie/prisma/auth 插件 | 高 | 插件化结构清晰，适合中小型单体 |
| ORM | Prisma | @prisma/client ^5.19 + prisma ^5.19，schema 已写、`plugins/prisma.ts` 单例 | 高 | schema 即事实源，方向正确；但未生成迁移 |
| 数据库 | PostgreSQL 15+ | datasource 声明 postgresql；本机未起库、无 DATABASE_URL | 设计到位/运行未验证 | 迁移未跑，见 R-2 |
| 导出 | pptxgenjs@4.0.1 | 依赖已装；`spikes/s2-pptx-gen.cjs` 验证过单页生成 | 中高 | 版本与初代对齐利于移植；完整分页折行逻辑尚未移植 |
| 模型层 | DeepSeek 兼容协议预留，非流式先通 | 仅 `.env.example` 三个空变量 + health 布尔探测；无适配层代码 | 未开始 | 符合"W4 任务"定位，边界清晰不冒进 |
| 实时 | SSE（预留） | 无实现 | 未开始 | W5 任务，当前不预置过度抽象 |
| 部署 | Docker Compose（W8） | **无 `deploy/`、无 compose 文件** | 未开始 | 后置任务，当前不阻塞开发 |

**选型总体评价**：没有出现金锤子（为用而用的重框架），没有引入与经验不符的新语言；技术栈学习曲线可控，符合"作品集讲得清取舍"的约束。

## 三、分层架构评估

### 3.1 现状（实读 `server/src` 8 个文件）

```
server/src/
├─ index.ts            进程入口（dotenv、listen 0.0.0.0:3001）
├─ app.ts              组装插件与路由、统一错误兜底
├─ plugins/            prisma.ts（客户端单例）、auth.ts（requireAuth 占位）
├─ routes/             health.ts（完整）、auth.ts（501）、materials.ts（501）
└─ lib/                result.ts（错误码、ok/fail、assertOwner）
```

### 3.2 与方案/排期目标分层的差距

排期 §2 建议 `modules/ 业务模块`、`core/`、`adapters/llm/`、`common/`；方案 §6.1 提出"认证中间件 / 业务服务 / 模型适配层 / PPT 渲染服务"四块。现状差距：

| 目标层 | 现状 | 评估 |
| --- | --- | --- |
| 路由层 routes | 已有 3 文件，占位契约清楚 | 合理，保留；501 占位与 PRD 接口一一对应，便于 W2 填实 |
| 业务服务层 services（整理规则/模板打分/错误分类/导出） | **不存在**；初代 `domain.cjs/ai.cjs/pptx.cjs` 业务内核尚未移植到本仓库 | **首要补建项**。建议新增 `server/src/modules/<domain>/` 或 `services/`，把初代纯函数迁入并加 userId 上下文，避免路由直接写业务逻辑 |
| 模型适配层 adapters/llm | 不存在 | W4 再建，当前只在 `lib/result.ts` 预留了 AUTH_FAIL/RATE_LIMIT/TIMEOUT/BAD_JSON 错误码，衔接良好 |
| 导出服务 ppt | 仅 spike 脚本，无服务端路由 | W3 随闭环补 `exports` 路由 + 渲染服务 |
| 校验层（入参 schema 校验） | 不存在；Fastify 未注册 schema/类型校验插件（如 typebox/ajv） | W2 落地写接口时必须补，否则 PRD-02 §6 校验规则无执行位置 |
| 会话/session 存储 | auth 插件仅占位；**无 sessions 表** | 见 ADR-003 与 R-3 |

**架构判断**：当前缺失的是"分层填充"而非"错误分层"。现有 routes/plugins/lib 三分法方向正确，补 services 与校验层即可收敛，不需要重新划分目录骨架。

### 3.3 前后端边界

- 后端 REST 草案（排期 §5）覆盖认证/材料/草稿/模板/助手/实体/Key/备份；前端 `api/http.ts` 提供统一 fetch 封装（credentials:include、统一解包、401 抛错）。
- 边界清晰：前端不持有数据范围决定权，符合"服务端为权威"原则。`http.ts` 尚未按模块拆分 api 方法（无 auth.ts/materials.ts 等 api 模块），属 W2 增量工作。

## 四、关键架构问题与风险分级

### P1（影响地基，W2 前解决）

- **R-1 组件库悬置**：README 定 Element Plus 但未安装；排期又留 Naive UI 备选。长期不定会影响 W2 表单/表格开发节奏。建议按 README 落 Element Plus，并用紫 token 覆盖主题（与 `tokens.css` 衔接）。
- **R-2 数据库迁移未建立**：`schema.prisma` 已定义，但 `prisma/migrations/` 为空、无 `DATABASE_URL`、未跑 `migrate dev`。schema 变更目前没有版本化历史，多人/重放部署时无法复现。W1 内应起本地 PG 并生成首个迁移。
- **R-3 会话方案缺表**：PRD-01 §4.3 选"PG Session（方案甲）"，但 schema 无 `Session` 模型；`plugins/auth.ts` 未读取会话。需补 sessions 表（sid/userId/expiresAt/createdAt）并落地 Cookie 校验，否则登录闭环无法成立。
- **R-4 业务规则内核未移植**：方案 §6.6 列了初代 domain/ai/pptx/store 五类可复用资产，当前新仓库仅有 spike 脚本，未迁入任何纯函数。W3 本地整理闭环高度依赖这些函数，应在 W1–W2 先抽离为无状态纯函数并配单测（排期 W1 后端任务已写此条，需跟踪落实）。
- **R-5 输入校验缺失**：PRD-02 §6 规定标题长度、类型枚举、正文 ≤20000 字、月份合法区间、去重指纹等规则；当前无校验执行点。需在服务端统一校验层（Fastify schema 或 zod 均可，择一不混用）。

### P2（质量与可维护性，随功能迭代补）

- **R-6 错误兜底偏粗**：`app.ts` 全局 errorHandler 统一返回 `SERVER_ERR`，会掩盖校验/业务错误；应让路由层先用 `lib/result.fail` 返回细分码，兜底只兜未预期异常。
- **R-7 `assertOwner` 已写未接线**：`lib/result.ts` 提供归属判断函数，但当前无任何路由调用；W2 每个写/查 `:id` 接口必须实际调用并对不归属返回 404。
- **R-8 无测试基座**：无 vitest/node:test 配置、无 supertest；PRD-01 §7、PRD-02 §7 的隔离与越权用例无处运行。W2 前需选定测试运行器（建议 node:test 或 vitest 其一）并为鉴权/隔离先建冒烟测试。
- **R-9 导出与存储边界未定**：文件存储方案（本地卷 `users/{userId}/` vs 对象存储）方案 §5.6 提了方向但无落地结构；MVP 单机可先本地卷，目录约定应在 W3 前确定并加忽略规则。
- **R-10 配置项命名**：health 用 `MODEL_KEY`，`.env.example` 同；与 `model_keys` 表（用户级）概念并存（见 m1 报告 P1-6），架构上应区分"服务调试全局 Key"与"用户加密 Key"两套来源。

### P0（现存阻断性架构缺陷）

**当前无 P0 架构缺陷**：原因是业务接口尚未实现，攻击面与运行时风险尚未产生；上述 P1 项若不在 W2 补齐，会在实现阶段升级为 P0 风险（尤其是 R-3 会话、R-5 校验、R-7 归属校验直接关系数据隔离验收 A-F5/M-F5）。

## 五、数据模型评估（schema.prisma 七模型）

### 5.1 合理之处（保留）

- 业务表统一 `userId` 非空 + 外键 `onDelete: Cascade`，配合 `assertOwner` 可实现行级隔离；`Material/Draft/Entity/ModelKey/ExportRecord` 均有 `@@index([userId, ...])`，覆盖常用查询前缀。
- `TemplateCard.userId` 可空 + `builtIn` 布尔，正确表达"系统内置只读共享 / 个人私有"两类卡。
- `Draft.generationMode`（local/ai）、`confirmedVersion`、`version` 版本链，对应"人工修改后失效待重核、失败不覆盖原稿"设计。
- `Entity.confirmed` 区分 AI 候选与确认入库，`sourceMaterialIds` 强制挂来源，防止 AI 编造实体，符合方案 §5.5 原则。
- `ModelKey.encryptedKey`、`ExportRecord.hasWatermark` 预留位符合 P2 商业化不阻塞主线口径。

### 5.2 建议调整（不推翻模型，仅增删补）

| 建议 | 说明 | 优先级 |
| --- | --- | --- |
| 新增 `Session` 模型 | sid、userId、expiresAt、createdAt；对应 ADR-003 | P1 |
| User 增 `lastLoginAt DateTime?` | PRD-01 §4.1 提及，登录成功更新 | P2 |
| Material 增 `isSample Boolean @default(false)` 或明确删除该需求 | 与 PRD-02 §2.0 对齐 | P2 |
| 补 `materials` 去重指纹字段（可选） | PRD-02 §2.3 要求 period + 正文指纹去重；可运行时算哈希，也可落列，二选一在 W2 定 | P1 决策 |
| `Draft.sections/sourceRefs` 用 Json | 结构灵活但缺数据库约束；建议在服务层用 Zod/类型定义固化结构（章节/条目/sourceIds/evidence），不靠数据库强校验 | P2 |
| 迁移历史补建 | 首个迁移随本地 PG 一起落地，纳入版本管理 | P1 |

### 5.3 索引与查询

现有索引与 IA 数据归属矩阵基本匹配；后续 `GET /materials?type&tag&period&keyword` 的关键词模糊检索，数据量小时用 ILIKE 可接受（PRD-02 §3 FR-M06 已明确不引外部检索引擎），无需提前上全文索引/pgvector，避免过度设计。

## 六、关键架构决策记录（ADR 建议）

> 格式遵循 m2 AGENTS.md；状态 Proposed 表示待组长与产品在 W1 评审确认。

### ADR-001 技术栈定型：Vue3/TS + Fastify/TS + Prisma/PostgreSQL
- 状态：Accepted
- 背景：单人 8 周作品，需与真实简历栈衔接、控制学习成本。
- 决策：前端 Vue3+TS+Vite+VueRouter；后端 Fastify+TS；ORM Prisma；库 PostgreSQL 15+；导出 pptxgenjs。
- 备选：Express（资料多但约定弱，已选 Fastify）、TypeORM（与 Prisma 二选一，已选 Prisma schema 即源）、Java 重写（叙事断裂、工期长，否决）。
- 后果：收益是同语言、类型友好、复用初代 JS 业务逻辑；代价是 PG 与 Docker 需本地环境，部署运维需自理。

### ADR-002 单体架构，不做微服务/消息队列
- 状态：Accepted
- 背景：个人作品、单机部署、早期数据量小。
- 决策：单一 Node 应用内分层（routes/services/plugins/lib/adapters），DB 单实例；不拆服务、不引入 MQ。
- 备选：微服务拆分（`microservices-architect` 技能已在团队中禁用）、K8s（否决，运维成本远超收益）。
- 后果：模块边界靠目录与代码约定维护；后期若私有化或扩容再按边界拆分，当前不过度抽象。

### ADR-003 会话方案：PG Session 表 + HttpOnly Cookie（方案甲）
- 状态：Proposed（需补 Session 模型与落地实现）
- 背景：PRD-01 §4.3 二选一；要求可服务端主动失效、便于审计。
- 决策：`sessions` 表存 sid/userId/expiresAt；Cookie 存 sid，HttpOnly + SameSite=Lax，生产 Secure；不采用纯 JWT 无状态方案。
- 后果：需补表与清理过期会话任务；登录态失效管理比 JWT 强。

### ADR-004 模板库 A 层卡片先行，B 层母版填充后置验证
- 状态：Accepted（呼应方案 §5.3）
- 决策：本期只做模板元数据卡 + 规则打分匹配；真实母版占位符填充仅 Spike-S3 评估，不承诺无损套版。
- 后果：规避 OOXML 高风险；导出先以 pptxgenjs 卡片版式实现。

### ADR-005 模型适配层：OpenAI 兼容协议统一封装 + 错误分类 + 本地兜底
- 状态：Proposed（W4 落地）
- 决策：统一请求结构 → Provider 适配 → 结果结构校验（sourceIds/evidence 逐字引用）→ 错误分类（AUTH_FAIL/RATE_LIMIT/TIMEOUT/BAD_JSON/CONTENT_INVALID/SERVER_ERR）；收费语义错误不自动重试；失败回退本地规则稿。
- 后果：不做多模型编排、不做 Function Calling/RAG；适配层保持薄。

### ADR-006 前端状态管理：暂不引入 Pinia，按需再评估
- 状态：Proposed（建议）
- 背景：排期 §2 提 Pinia，但当前视图无跨页共享复杂状态；编辑器草稿状态可先用组件内 + 路由参数。
- 决策：W2 不装 Pinia；当出现多视图共享（如当前草稿、材料筛选态、Key 状态）且 props 传递明显复杂化时再引入。
- 备选：直接上 Pinia（当前会增加模板代码与心智负担）。
- 后果：需在 README 选型表同步说明，消除"排期写 Pinia、实际不引"的悬置。

## 七、可行性与"是否推倒重来"的技术判断

**可行性结论：方案技术可行，但外部依赖与工程量需现实评估。**

1. 已验证可行的部分：前端可编译构建（vue-tsc 通过、vite build 产出）；后端 `/health` 可独立启动；pptxgenjs 单页生成脚本跑通过（S2 历史提交记录）；选型无未经验证的重型依赖。
2. 未验证但风险可控：PG 迁移、Session 鉴权、模型兼容协议、SSE——均为成熟通用能力，有明确降级预案，不属于高不确定性技术。
3. 真正技术风险最高项是 B 层母版填充，已被正确排除在本期外；主线 A 层卡片 + 规则匹配风险低。

**技术上不推倒重来**：
- 现有可复用资产：七表 schema、统一错误码与归属辅助、插件装配结构、路由契约占位、前端路由与主壳布局、紫 token、Spike 脚本模板。
- 应废弃/重写部分：无。现有占位代码是有意的"契约骨架"，不是错误实现；501 占位本身就是待填接口的清晰位置。
- 重写成本对比：推倒重写将丢失已对齐的 schema 与接口契约，重新决策选型，估计增加 1–2 周且无架构收益；保留并按 W2–W6 填充是成本最低路径。

## 八、建议的下一步技术顺序（供组长排期采纳）

1. W1：本地 PG 容器 + 首个 `prisma migrate dev`；补 Session 模型；落地组件库选型（ADR-001/R-1）；抽离初代规则纯函数并配单测。
2. W2：鉴权闭环（ADR-003）+ 材料库接口 + 统一校验层（R-5）+ `assertOwner` 全接线（R-7）+ 隔离冒烟测试（R-8）。
3. W3：services 层整理规则移植 + 草稿版本链 + 导出服务（pptxgenjs 多页）。
4. W4–W5：模型适配层（ADR-005）+ 助手抽屉 + SSE。
5. W6：模板卡匹配服务 + 三栏编辑器前端成型。
6. W7–W8：实体聚合、备份、部署编排（补 `deploy/` 与 compose）。

## 九、已验证 / 未验证 / 阻塞

- 已验证：tsconfig strict 开启；依赖清单与选型表差异已盘清；schema 七模型字段与 PRD/排期对照完成；路由占位与接口草案对应关系成立。
- 未验证：PG 实际连通与迁移（无 DATABASE_URL）；密码哈希库选型与性能（未装 bcrypt/argon2）；模型连通（无 Key）；导出多页与实机打开效果。
- 阻塞：服务器信息（部署编排无法落地）；模型 Key（适配层无法真跑）；脱敏 pptx（B 层无法探针，已后置不阻塞主线）。
