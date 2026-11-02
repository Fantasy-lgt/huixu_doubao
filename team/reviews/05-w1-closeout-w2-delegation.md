# 05 · W1 收尾委派单 + W2 执行计划（组长登记）

> 登记人：研发小组长 ｜ 日期：2026-11-02
> 阶段：先闭环 W1 地基周（P0），再按序推进 W2 账号与材料库（P1）。
> 协作原则：m3 主编码串行落 `server`，避免多人并行写同一工作区；m1/m2/m4 产出独立文档并行，组长回读核验后独立 commit、推送。

## 一、当前已确认事实（执行起点，勿重复探查）

- 仓库根：`D:\学习ai应用开发\huixu`；远程 `https://github.com/Fantasy-lgt/huixu_doubao.git`；当前 `main`，推送凭据（GCM，Fantasy-lgt PAT）已保存可用。
- PG 16.4 免安装：`D:\pgsql\bin`，数据目录 `D:\pgsql\data`，库 `huixu`，端口 5432，服务应保持运行；连接串在 `server/.env`（**gitignore 排除，禁止入库、禁止在提交信息与日志中回显密钥**）。
- `server/.env` 已含：`DATABASE_URL`、`PORT=3001`、`MODEL_BASE_URL=https://api.deepseek.com`、`MODEL_NAME=deepseek-chat`、`MODEL_KEY`（真实值）、`SESSION_SECRET`（随机生成）、`CORS_ORIGIN=http://127.0.0.1:5173`。
- Prisma 已落地 8 模型：User / Session / Material / Draft / TemplateCard / Entity / ModelKey / ExportRecord；首个迁移 `20261031163639_init` 已应用。
- 后端测试基座：`npm test`（`tsx --test test/*.test.ts`，node:test）；`test/result.test.ts` 3 例通过；类型检查 `npm run build`（`tsc -p tsconfig.json`）。
- 后端依赖：fastify@4、@fastify/cors、@fastify/cookie、dotenv、@prisma/client@5、pptxgenjs；**未装** argon2（W2 优先 argon2id，bcrypt 兜底）。
- 现状占位：`routes/auth.ts`、`routes/materials.ts` 全为 501；`plugins/auth.ts` 的 `requireAuth` 为占位，`currentUserId` 恒 null、未读 Cookie；无 services/validators 层。
- 初代只读参考（**只参考不改动**）：`D:\学习\制造业管理会汇报助手\app\lib\{domain,store,ai,pptx}.cjs`。
- 前端：TDesign 紫主题 + Pinia 五 store（auth/materials/draft/template/settings）骨架已注册，action 为占位；`vite build` 通过。

### 已锁定决策（不可擅自更换）

- 组件库 TDesign Next Vue；状态管理 Pinia 且按业务拆多 store；密码哈希 argon2id 优先。
- 本地规则整理优先；AI 失败（鉴权/限流/超时/坏 JSON）回退本地规则稿，不自动重试收费调用。
- 降级顺序：备份、年度实体全三类、助手完整版后移；保 W3 本地闭环与 W6 编辑器主路径。
- 不做项见根 `AGENTS.md` 第四节（无损母版套版、自由画布、协作、支付、第三方登录、RAG/Agent/微调/多模型、小程序、Office 原文件解析、演讲稿）。

## 二、委派单

### 任务 A（P0 · m3 研发）：初代 domain 纯函数迁移为 TS ESM 并配单测

- 输入：初代 `lib/domain.cjs`；初代 `lib/pptx.cjs` 的纯折行 `wrap`；现有 `server/src/domain/{errors.ts,validation.ts}`；`server/test/` 基座；`docs/PRD-02-材料库.md`。
- 输出位置：
  - `server/src/domain/`：`errors.ts`、`validation.ts`、`materials.ts`（选材/覆盖/本地章节）、`draft.ts`（章节校验/草稿要素）、`index.ts`（barrel 导出）；`wrap` 归入 `server/src/domain/text.ts`。
  - `server/test/domain.test.ts`：覆盖 period 校验、selectMaterials、coverage 缺月、localSections 三章节、validateSections 来源约束、wrap 折行。
- 编辑范围：仅 `server/src/domain/**`、`server/test/**`、`server/package.json`（仅必要依赖）；**不改 `routes/**`、不改 `plugins/**`、不改 `web/**`**。
- 关键要求：
  - domain 层**不得 import Prisma / 数据库 / 文件系统写**，保持纯函数可单测；`store.cjs` 的文件持久化不迁（由 W2+ Prisma 承担）。
  - 初代 `department` 与新模型 `occasion` 的差异，在 domain 内部用当前输入结构，`index.ts` 顶部注释标注「W3 由 mapper 映射到 Prisma 字段」，不在本任务绑定 ORM。
  - 逻辑与初代等价：三章节固定标题 `重点进展/问题风险/下期计划`；条目来源必须来自所选材料；控制字符校验；容量上限常量保留。
- 验收：`npm test` 全绿；`npm run build`（tsc）退出 0；纯函数无 IO 副作用；独立 commit（`refactor(server): 迁移初代 domain 纯函数为 TS 模块并补单测` 一类信息）。

### 任务 B（P0 · m2 架构师，紧随 A，文档独立）：domain ↔ Prisma 映射与 W2 分层建议

- 输入：`server/prisma/schema.prisma`、任务 A 产出的 `server/src/domain/**`、`docs/PRD-01/PRD-02`、`docs/MVP排期与任务拆解-8周.md`。
- 输出：本文件下方「附录 A」由 m2 补充；不写代码。
- 编辑范围：仅 `team/reviews/05-*.md`（本文档附录）。
- 验收：每个 domain 类型字段 ↔ Prisma 模型字段一一对应；明确 `services/`、`validators/`、`plugins/` 落点；给出 Session 服务（读 `sessions` 表、过期清理、Cookie 读写）设计要点；标注待定项。

### 任务 C（P0 · m4 质量安全官，可与 A 并行起草，A 完成后复审）：W2 测试与安全清单

- 输入：`docs/PRD-01` 第 7、8 节、`docs/PRD-02` 第 6、7 节、`server/src/lib/result.ts`、任务 A 产出。
- 输出：本文件「附录 B」；必要时可直接补 `server/test/**` 用例（不改业务实现）。
- 验收：测试用例可回溯到 PRD 验收编号（A-OK/F、M-OK/F）；安全清单覆盖：密码仅哈希不落明文、Cookie `HttpOnly`+`SameSite=Lax`（生产 `Secure`）、越权统一 404 不暴露存在性、错误码（EMAIL_TAKEN/INVALID_CREDENTIALS/ACCOUNT_DISABLED/MATERIAL_DUPLICATE）、依赖风险 P0/P1/P2 分级。

### 任务 D（P0 · m1 产品经理）：W1 收尾验收对照与 W2 边界确认

- 输入：`docs/MVP排期与任务拆解-8周.md` W1/W2 节、两份 PRD、任务 A 产出。
- 输出：本文件「附录 C」；仅文档。
- 验收：逐条核对 W1 任务完成/遗留；明确 W2 做（注册登录、隔离、材料 CRUD+校验+去重）与不做（找回密码、第三方登录、文件解析、版本对比、分页美化）边界，防止把 W4 AI / W6 模板匹配提前。

### 任务 E（P1 · m3 研发，须在 A–D 验证通过后启动，属下一轮主线）：W2 账号与材料库后端主干

- 依赖：任务 A 的 domain 可用；任务 B 映射结论；任务 C 测试清单。
- 范围（P1）：argon2id 哈希；Session 读写；`/api/auth/{register,login,logout,me}`；`requireAuth` 接真 Session；`/api/materials` CRUD + 服务端校验 + period+正文指纹去重 + 强制 `userId` 作用域 + 越权 404；配套隔离与错误码测试。
- 范围外（本轮不做）：前端完整 UI 美化、W3 草稿闭环、W4 Key 加密存储与 AI 调用、W6 模板匹配。

## 三、统一验证与提交规范（全员遵守）

1. 每个独立意图一个 commit，约定式前缀（`feat/fix/refactor/test/chore/docs`），中文简述 + 验证结论。
2. 提交前最小验证：后端 `npm test` 与 `npm run build` 必须通过；禁止提交 `node_modules/`、`.env`、`dist/`、`*.tsbuildinfo`。
3. 提交后 `git push origin main`；不 `--force`、不 `reset --hard`；`server-prod` 为 subtree 部署分支，主线验证通过后由组长决定是否重新 split 同步。
4. 服务端口：后端 3001、前端 5173、PG 5432；复用已在运行的 PG，不得重复起多实例占用端口。
5. 事实分层：已验证 / 未验证 / 阻塞 / 待确认分开标注；未跑测试不写「通过」。

## 附录 A（m2 架构 · domain↔Prisma 映射与 W2 分层落点）

> 作者：m2 架构师 ｜ 性质：纯文档碎片，供组长合并进 `05-w1-closeout-w2-delegation.md` 附录 A；本文件不改任何源码 / schema / routes / plugins。
> 事实分层图例：**【已确认】**＝有 `schema.prisma` / PRD 明文依据；**【建议】**＝待任务 E（m3）落地时采纳的工程倾向；**【待定】**＝开工评审需拍板，见 A.4。
> 总原则：纯 `domain/` 层**不 import Prisma、不碰数据库 / Cookie / 文件写**；对象形状在 domain 内自洽，所有「领域字段 ↔ 表字段」的翻译与 IO 都发生在 W2 的 `validators/` + `services/` + 薄 `routes/`。

---

### A.1 字段映射表（领域 / 初代侧 → Prisma 模型.字段）

权威依据：`server/prisma/schema.prisma`（实际字段名为准）；`docs/PRD-01` §4、`docs/PRD-02` §2；初代只读参考 `D:\学习\制造业管理会汇报助手\app\lib\domain.cjs`。

#### A.1.1 User（`model User`，schema L14–30）

| 领域 / 初代侧字段（来源） | Prisma 模型.字段 | 类型 / 约束（schema 实际） | 说明与转换规则 | 状态 |
| --- | --- | --- | --- | --- |
| 注册入参 `email` | `User.email` | `String @unique` | 入库前 `trim().toLowerCase()` 统一小写再查重 / 落库；唯一索引；大小写归一避免重复注册账号（PRD-01 §4.1、FR-A01） | 【已确认】 |
| 注册入参 `password`（明文，**不入库**） | `User.passwordHash` | `String`（非空，无默认） | 明文只在请求内存中参与比对，落库必须是哈希；`GET /me` 等任何响应都不得回显；算法见 A.4-3 | 字段【已确认】；算法【建议】 |
| （无前端入参，服务端填） | `User.plan` | `String @default("free")` | 不接收前端 plan；DB 默认 `free`；会员 / 付费本期不写其他值（PRD-01 §1.3、§4.1） | 【已确认】 |
| （无前端入参，服务端填） | `User.status` | `String @default("active")` | 默认 `active`；登录时非 `active` 抛 `ACCOUNT_DISABLED`；本期无停用入口 | 【已确认】 |
| 注册时间 `createdAt` | `User.createdAt` | `DateTime @default(now())` | 由 DB 生成，domain / service 不显式赋值 | 【已确认】 |
| （schema 自动维护） | `User.updatedAt` | `DateTime @updatedAt` | Prisma 每次写自动更新，业务层不手填 | 【已确认】 |
| （服务端生成主键） | `User.id` | `String @id @default(cuid())` | 服务端生成；仅用于归属关联，前端不据此做业务判断（PRD-01 §4.1） | 【已确认】 |
| 展示用「邮箱前缀」（PRD-01 §4.1 `email_prefix`） | —（schema **无**该列） | — | 不落库；`GET /me` 返回时由 `email` 本地派生前缀即可 | 【已确认差异】 |
| 最近登录时间（PRD-01 §4.1 `last_login_at`） | —（schema **无**该列） | — | 本期不记录 / 不更新；若后续需要再走迁移加列，见 A.4-7 | 【待定】 |

#### A.1.2 Material（`model Material`，schema L32–50）

| 领域 / 初代侧字段（来源） | Prisma 模型.字段 | 类型 / 约束（schema 实际） | 说明与转换规则 | 状态 |
| --- | --- | --- | --- | --- |
| `title`（初代 `material()`，`str≤100` 后 `.trim()`） | `Material.title` | `String`（非空） | 去首尾空格、非空、≤100 字（PRD-02 §6） | 【已确认】 |
| （初代无，新增）材料类型 code | `Material.materialType` | `String`（非空） | 必须命中 §2.1 八枚举；**建议存英文 code，展示层映射中文**（schema 注释写的是中文展示名，勿直接存中文，见 A.4-6）。八值：`work_report` / `project_progress` / `meeting_minutes` / `hr_admin` / `customer_business` / `contract_deal` / `regulation` / `other`；新建默认 `work_report` | 字段【已确认】；存码口径【建议】 |
| （初代无，新增） | `Material.tags` | `String[] @default([])` | 服务端规范化：逐个 `trim`、去空标签、去重；总数 ≤8、单个 ≤12 字（PRD-02 §2 / §6）；空数组落默认 `[]` | 【已确认】 |
| `period`（初代 `period()` 校验函数） | `Material.period` | `String?` | 可空；合法值 `YYYY-MM`，年份 2000–2100；空＝「未标记期间」，不等于某月（PRD-02 §2）；非法月份服务端 400 | 【已确认】 |
| **`department`（初代 `material()` 必填 `str≤40`；`selection()` 亦用）** | **`Material.occasion`** | `String?`（可空） | **核心改名映射**：初代「部门」语义在云端改为「汇报场合」。domain 内部纯函数暂保留 `department` 原名（任务 A 要求 `index.ts` 顶部注释标注），由 service/mapper 统一转成 `occasion` 入库；取值 §2.2 场合枚举（可空，可不选）：月度管理会 / 部门例会 / 项目复盘 / 年度总结 / 述职竞聘 / 专项汇报 / 其他。初代「全部部门」筛选语义 → 云端「不选场合＝不限」 | 【已确认差异】；映射位置【建议】 |
| `body`（初代 `str`，上限 `LIMITS.body=20000`） | `Material.body` | `String`（非空） | 非空、≤20000 字；保留换行 / 制表，剔除其他控制字符（PRD-02 §6）；原文只读、系统不改写措辞 | 【已确认】 |
| `sourceName`（初代默认 `'手工录入'`，`str≤180` `.trim()`） | `Material.sourceName` | `String?` | 空值落默认「手工录入」；≤180 字；上传 md/txt 时可取文件名 | 【已确认】 |
| （初代无落库）文件引用 | `Material.fileRef` | `String?` | **本期留空**；txt/md 内容读取后直接入 `body`，不做对象存储（PRD-02 §2 / §1.3） | 【已确认】 |
| `version`（初代整数版本，编辑递增） | `Material.version` | `Int @default(1)` | 默认 1；每次 `PUT` 正文或元信息编辑成功 +1；供草稿引用版本校验 | 【已确认】 |
| （归属，初代 state 内隐式） | `Material.userId` | `String`（非空 FK，`onDelete: Cascade`） | 由 `requireAuth` 上下文注入，**禁止前端传 userId**；所有查询强制 `where userId = currentUserId`（PRD-01 §4.2） | 【已确认】 |
| `createdAt` / `updatedAt` | `Material.createdAt` / `Material.updatedAt` | `DateTime @default(now())` / `DateTime @updatedAt` | DB 生成与自动维护；列表默认按 `updatedAt` 倒序（PRD-02 FR-M01） | 【已确认】 |
| 主键 | `Material.id` | `String @id @default(cuid())` | 服务端生成；越权按此 id 查归属，不符统一 404 | 【已确认】 |
| 示例标记（PRD-02 §2 `is_sample`） | —（schema **无**该列） | — | 本期不提供示例加载 / 不内置示例，故不落列；如需虚构种子再议，见 A.4-7 | 【待定】 |

#### A.1.3 Draft（`model Draft`，schema L52–72）

| 领域 / 初代侧字段（来源） | Prisma 模型.字段 | 类型 / 约束（schema 实际） | 说明与转换规则 | 状态 |
| --- | --- | --- | --- | --- |
| `kind`（初代 `selection()`，仅 `monthly`/`annual`） | `Draft.kind` | `String` | 本期只产出 `monthly` / `annual`；schema 注释里的 `free` 为后续自由草稿预留，本期不写 | 【已确认】 |
| `selection`（初代 `{department, year, month, throughMonth}`） | `Draft.rangeFilter` | `Json?` | 把筛选条件序列化为 JSON：`year`、`month`（月度）、`throughMonth`（年度）、`occasion`、`materialType` 等；初代 `department` 条件在此映射为 `occasion` 条件，不再单列部门字段 | 【建议映射】 |
| `title`（初代 `createDraft()` 按模板生成，`str≤100`） | `Draft.title` | `String`（非空） | 生成标题落库；前端可编辑，校验 ≤100 | 【已确认】 |
| `sections`（初代 `validateSections()` 产物） | `Draft.sections` | `Json`（非空） | 结构沿用初代：章节 `{id, title, items:[{id, text, sourceIds[], origin, evidence:[{sourceId, quote}]}]}`；`validateSections` 为 domain 纯校验，service 通过后原样整包落 Json，不改内部形状 | 【已确认】 |
| **`sourceVersions: [{id, version}]`（初代 `createDraft()`）** | **`Draft.sourceRefs`** | `Json`（`String[]` 材料 id） | **结构收敛**：只存材料 id 数组，不冗余存每份材料版本；引用是否仍有效由 service 层用 `sourceRefs` 集合 join `Material.version` 运行时比对（替代初代 `validSources()` 对内存 state 的判断）。版本快照语义并入 `confirmedVersion` 与材料版本联动失效 | 【建议映射】；细节见 A.4-8 |
| `generationMode`（初代 `mode`，`local`/`ai`） | `Draft.generationMode` | `String @default("local")` | 取值 `local` / `ai`；本地规则稿恒为 `local`；无 Key / AI 失败回退 `local`，不自动重试收费调用 | 【已确认】 |
| `confirmedVersion`（初代 `null` 或等于草稿 `version`） | `Draft.confirmedVersion` | `Int?` | 人工确认时写当前草稿版本；被引用材料 `version` 变化（编辑 / 删除）即清空，标记「待重新核对」（PRD-02 FR-M04/M05） | 【已确认】 |
| `version`（初代草稿版本） | `Draft.version` | `Int @default(1)` | 草稿每次保存自增；与 `confirmedVersion` 配合判断是否待重核 | 【已确认】 |
| （归属） | `Draft.userId` | `String`（非空 FK，`Cascade`） | 上下文注入，强制作用域 | 【已确认】 |
| （W6 模板关联，本期留空） | `Draft.templateCardId` / `templateCard` | `String?` / 可选关联 | 本期不写该外键；W6 模板匹配再填充 | 【已确认（本期不用）】 |
| `createdAt` / `updatedAt` | `Draft.createdAt` / `Draft.updatedAt` | `DateTime @default(now())` / `@updatedAt` | DB 维护 | 【已确认】 |
| 主键 | `Draft.id` | `String @id @default(cuid())` | 服务端生成 | 【已确认】 |

#### A.1.4 Session（`model Session`，schema L134–143；PRD-01 §4.3 方案甲已锁定）

| 领域 / 会话概念字段 | Prisma 模型.字段 | 类型 / 约束（schema 实际） | 说明与转换规则 | 状态 |
| --- | --- | --- | --- | --- |
| 会话标识 `sid`（服务端生成，写入 Cookie） | `Session.sid` | `String @id @default(cuid())` | 高熵随机串；只存于 HttpOnly Cookie，不携带用户信息；前端 JS 不可读 | 【已确认】 |
| 归属用户 | `Session.userId` | `String`（非空 FK，`Cascade`） | 登录成功后绑定；`requireAuth` 凭 sid 查出 userId 再挂请求上下文 | 【已确认】 |
| 过期时刻 | `Session.expiresAt` | `DateTime`（非空；`@@index([expiresAt])`） | 登录时 = 现在 + 有效期（建议 7 天）；`getSession` 发现过期即删并判无效 | 【已确认】；有效期取值【建议】 |
| 签发时间 | `Session.createdAt` | `DateTime @default(now())` | DB 生成；供审计 / 清理参考 | 【已确认】 |

> 映射纪律（落地红线）：
> 1. `domain/` 内只出现初代 / 领域形状（含暂留的 `department`、`sourceVersions` 思路），**不出现 `userId` 透传以外的 Prisma 类型，不 import `@prisma/client`**。
> 2. 「初代 `department` → `occasion`」「`sourceVersions` → `sourceRefs`」「筛选对象 → `rangeFilter`」三处翻译统一收敛在 `services/`（必要时加薄 mapper），不分散到 routes。
> 3. 时间戳、自增 `version`、默认值（`plan=free`、`status=active`、`tags=[]`、`generationMode=local`）优先交给 Prisma 默认值，service 不重复硬造。

---

### A.2 W2 分层落点建议（任务 E 后端主干）

现状：`server/src/` 仅有 `domain/{errors,validation}.ts`、`lib/result.ts`、`plugins/{prisma,auth}.ts`、`routes/{auth,materials,health}.ts`、`app.ts`；**尚无 `services/`、`validators/` 目录**；`routes/auth.ts`、`routes/materials.ts` 全为 501 占位。

| 层 / 目录（建议位置） | 职责边界 | 承载任务 E 的接口 / 逻辑 | 复用现状 | 状态 |
| --- | --- | --- | --- | --- |
| `server/src/domain/`（任务 A 产出，**禁止 IO**） | 纯函数：`period` 校验、`str/integer`、选材筛选 `selectMaterials`、`coverage` 缺月、`localSections`、`validateSections`；材料正文规范化（纯字符串处理，无哈希计算） | 不直接挂 HTTP；被 validators / services 调用 | 复用 `domain/validation.ts` 的 `period/str/integer/dateParts`、`LIMITS`；`errors.ts` 的 `AppError/fail` | 【已确认结构】 |
| `server/src/validators/`（**新建**） | 入参 schema 校验与归一：账号注册 / 登录入参、材料六字段规则、枚举命中、标签清洗；只做「校验 + 返回干净 DTO」，不查库、不抛业务态错误码 | 为 `POST /api/auth/register`、`/login`、`POST/PUT /api/materials` 提供入参校验 | 复用 `domain/validation.ts` 的 `period/str/integer`；规则对齐 PRD-02 §6（标题≤100、标签≤8×≤12、正文≤20000、来源名≤180、枚举命中） | 【建议】（目录新建） |
| `server/src/services/auth.service.ts`（**新建**，`server/src/services/`） | 密码哈希 / 校验、按归一化邮箱查用户、注册事务（建 User + 建 Session + 种 Cookie 编排）、登录判定、`GET /me` 装配（剔除敏感字段） | `POST /api/auth/register`、`POST /api/auth/login`、`GET /api/auth/me` 的业务逻辑 | 复用 `lib/result.ts` 错误码（`EMAIL_TAKEN`/`INVALID_CREDENTIALS`/`ACCOUNT_DISABLED`）；不直接操作 Cookie 细节 | 【建议】 |
| `server/src/services/session.service.ts`（**新建**） | Session 表读写、过期判定与删除、过期批量清理；Cookie 名 / 属性封装 | 被 `requireAuth` 调用；支撑 `login/logout/me` | 复用 `plugins/prisma.ts` 的单例 `prisma`；方法清单见 A.3 | 【建议】 |
| `server/src/services/material.service.ts`（**新建**） | 强制 `userId` 作用域查询、指纹去重判重、版本自增、编辑 / 删除时联动清空相关草稿 `confirmedVersion`、归属判定 | `GET/POST/PUT/DELETE /api/materials`、`GET /api/materials/tags`（可选） | 复用 `lib/result.ts` 的 `assertOwner`、错误码 `MATERIAL_DUPLICATE`、`NOT_FOUND`；去重指纹见下方细则 | 【建议】 |
| `server/src/plugins/`（已有，局部改造） | `prisma.ts`：单例 client + 关闭钩子（已就绪）；`auth.ts` 的 `requireAuth` 由占位改为「读 Cookie sid → `session.service.getSession` → 挂 `request.currentUserId`」；`app.ts` 统一错误处理把 `AppError` 映射为 `{error:{code,message}}` | 全局鉴权守卫、错误兜底 | `prisma.ts` 直接复用；`auth.ts` 保留 `decorateRequest('currentUserId')` 与 `requireAuth` 签名，仅换实现；`@fastify/cookie` 已在 `app.ts` 注册 | 【建议改造】（不改契约） |
| `server/src/routes/`（已有 501 占位，任务 E 实现） | 薄层：取参 → 调 validators → 调 service → 用 `ok/fail` 组织响应；不写业务规则、不直接调 `prisma` | 保持前缀 `/api/auth`（register/login/logout/me）、`/api/materials`（列表/详情/新建/更新/删除） | `app.ts` 注册前缀已就位（L22–23）；路由文件结构不动，仅替换 501 体 | 【已确认前缀】；实现【建议】 |
| `server/src/lib/`（已有） | 统一响应 `ok/fail`、`ErrorCode` 枚举、`assertOwner` 归属判定 | 全路由 / service 通用 | `result.ts` 直接复用；`assertOwner(row, userId)` 用于资源不存在 / 不归属统一 404 | 【已确认】 |

**指纹去重实现建议（`material.service.ts`，对齐 PRD-02 §2.3 / §6）【建议】：**

1. 规范化（纯函数可放 `domain/`，确保可单测）：① 统一换行 `\r\n`/`\r` → `\n`；② 逐行 `trim()` 并丢弃空行；③ 删除控制字符（保留换行 / 制表，符合 PRD-02 §6）；④ 空白归一（口径待定，见 A.4-4：建议「删除全部空白字符」后再哈希，使多空格 / 换行差异不影响判重）。
2. 哈希：Node 内置 `node:crypto` `sha256`，对 UTF-8 规范化正文求 hex 摘要（不引外部哈希库）。
3. 判重键：同一 `userId` 下，`period + fingerprint` 命中已有记录 → 抛 409 `MATERIAL_DUPLICATE`；**标题不同不判重**（PRD-02 §2.3 明确）。
4. 落库方式两案（见 A.4-4）：推荐后续迁移为 `Material` 增 `fingerprint` 列并对 `(userId, period, fingerprint)` 加唯一索引做硬兜底；本期若不动 schema，则按 `userId + period` 取出候选后逐条重算指纹比对（单人材料量小可行，但无并发唯一约束，需在事务内查重）。
5. 编辑（`PUT`）同样重新走指纹与长度校验；仅元信息改动、正文未变时按业务决定是否参与判重（建议正文变化才重判，避免把自身旧版本误判重复）。

---

### A.3 Session 服务设计要点（方案甲：PG `sessions` 表 + Cookie 存 sid，已锁定，不选 JWT）

**服务方法建议（`session.service.ts`）【建议】：**

| 方法 | 行为 | 错误 / 边界 |
| --- | --- | --- |
| `createSession(userId): Promise<sid>` | 生成 `sid`（cuid / 随机串），写一行 `{userId, expiresAt = now + 有效期}`，返回 sid | 写库失败按 500 处理，不种半截 Cookie |
| `getSession(sid): Promise<sessionUser \| null>` | 按 sid 查 `Session`；**若 `expiresAt < now()` 立即删除该行并返回 null**（过期即视为无效）；命中则带出 `{userId}` | 不返回密码哈希等敏感字段；sid 缺失 / 篡改一律 null |
| `destroySession(sid)` | 删除当前 sid 对应行；登出调用 | 行不存在也按成功幂等处理 |
| `destroyUserSessions(userId)`（可选） | 按 `userId` 批量删会话；供「账号停用强制下线」预留，本期可只留方法不挂入口 | PRD-01 §4.3 要求服务端可主动失效 |
| `purgeExpired()` | `prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })` | **不引定时任务框架**：① 惰性——`getSession` 命中过期即删、登出顺带清理；② 应用 `onReady` 启动时跑一次；二者足够 MVP |

**Cookie 属性（`login` 种下 / `logout` 清除）【建议，对齐 PRD-01 FR-A02 / §8.3】：**

- `HttpOnly = true`：前端 JS 不可读，防 XSS 窃取。
- `SameSite = Lax`：默认跨站不随带，兼顾本站导航。
- `path = '/'`；`httpOnly` 域随站点根路径。
- `Secure`：**生产环境（HTTPS 且 `CORS_ORIGIN` 非 localhost/127.0.0.1）置 `true`**；本地 HTTP 开发关闭，避免种不上。
- `maxAge`：建议 7 天（与 `expiresAt` 对齐）；是否滑动续期见 A.4-1，本期倾向固定过期。
- **Cookie 内只存 `sid`，不写 email / plan / 用户对象等任何业务信息**；用户信息一律服务端查库获得。
- 清除时 `logout` 既要 `destroySession(sid)` 删库行，也要 `reply.clearCookie(同名)`，二者缺一不可。

**错误码口径（统一，避免前后端对不上）【已确认需求 / 命名待统一见 A.4-5】：**

| 场景 | HTTP | 错误码 | 备注 |
| --- | --- | --- | --- |
| 登录：用户不存在或密码错（两者不区分） | 401 | `INVALID_CREDENTIALS` | 防账号枚举；统一文案「邮箱或密码不正确」（PRD-01 FR-A02、A-F3） |
| 登录：`status` 非 active | 403 | `ACCOUNT_DISABLED` | 文案「账号不可用，请联系支持」 |
| 注册：邮箱已占用 | 409 | `EMAIL_TAKEN` | 不泄露其他用户信息 |
| `requireAuth` 未登录 / 会话过期 / sid 失效 | 401 | 鉴权失败码（现状 `result.ts` 为 `UNAUTHENTICATED`，PRD-01 §5 写作 `UNAUTHORIZED`，待统一） | 业务查询不下发任何数据（A-F4/A-F7） |
| 业务资源不存在或不属于当前用户 | 404 | `NOT_FOUND` | 统一 404 而非 403，避免暴露资源存在性（PRD-01 §4.2、A-F5）；用 `assertOwner` 判定 |
| 入参校验失败 | 400（超长可 413/422） | `VALIDATION_FAILED` / `INVALID_INPUT` | 表单内容前端保留 |

---

### A.4 待定项与风险登记（开工评审 / 任务 E 启动前确认）

| # | 待定问题 | 建议倾向 | 影响周次 / 风险等级 |
| --- | --- | --- | --- |
| 1 | 会话是否「滑动续期」（每次有效访问刷新 `expiresAt`） | 本期固定 7 天过期，不滑动，逻辑简单、便于审计；后期确有「长期保持登录」需求再加滑动 | W2 ｜ P2 |
| 2 | 过期 Session 清理触发时机 | 惰性删除（校验 / 登出时顺带）+ 启动 `onReady` 一次 `deleteMany`；**不引入 node-cron 等定时框架**，保持依赖精简 | W2 ｜ P2 |
| 3 | 密码哈希库选型：argon2id 优先 vs bcrypt 兜底 | 05 已锁定倾向 argon2id；风险在于 argon2 含原生绑定，Windows / 部署镜像可能需预编译或构建工具；若安装受阻退 bcrypt（cost≥10，PRD-01 §8.2），最后才考虑纯 JS `bcryptjs`（算法强度与性能偏弱）。落地前在目标环境实装一次并记录登录耗时 | W2 ｜ **P1** |
| 4 | 指纹去重口径：①「去空白」究竟是删除全部空白还是折叠为单空格；换行 / 全角空格是否参与；② schema 当前**无 `fingerprint` 列**，查重靠实时重算还是加列 + 唯一索引 | 规范化建议「去控制字符 → 统一换行 → 行 trim → 删全部空白 → sha256」；推荐后续迁移加 `fingerprint` 列 + `(userId, period, fingerprint)` 唯一索引兜底并发，本期不动 schema 则事务内查重。口径需 m1/m3/m4 评审确认后写进 validators 单测 | W2 ｜ **P1** |
| 5 | 401 错误码命名不一致：`lib/result.ts` 现状 `UNAUTHENTICATED`，PRD-01 §5 与接口口径写 `UNAUTHORIZED` | 二选一统一（建议对齐 PRD 用 `UNAUTHORIZED`，或反向修订 PRD），前后端错误码常量同步改齐，禁止两套并存 | W2 ｜ P1 |
| 6 | `materialType` 存储值：schema L37 注释为中文展示名，PRD-02 §2.1 为英文 code | 建议库存英文 code、前端展示层映射中文标签，避免展示文案调整污染数据；需在 validators 枚举表中固化 8 个 code | W2 ｜ P1 |
| 7 | schema 与 PRD 的字段落差：`is_sample`（PRD-02 §2）、`email_prefix` / `last_login_at`（PRD-01 §4.1）均未进 schema | 本期确认不实现（不存示例标记、不存前缀冗余列、不记最近登录时间）；如后续需要再单独走迁移，不在 W2 夹带加列 | W2 ｜ P2 |
| 8 | 草稿引用版本语义：初代 `sourceVersions[{id,version}]` 收敛为 `sourceRefs[String id]` 后，并发编辑 / 版本冲突如何判定（乐观锁 `version` 校验） | service 层保存草稿前比对 `sourceRefs` 对应材料当前版本；材料编辑即清空相关草稿 `confirmedVersion`；乐观锁策略留到 W3 草稿闭环细化，W2 先保证「材料改版 → 草稿待重核」主规则 | W3 ｜ P2 |
| 9 | `@fastify/cookie` 注册当前未传 `secret`；sid Cookie 是否需要签名 | sid 为高熵随机且服务端校验，裸 Cookie 可接受；若要求防篡改可注入 `SESSION_SECRET`（`.env` 已存在）启用签名 Cookie，二选一不影响主链路 | W2 ｜ P2 |
| 10 | `domain/validation.ts` 中控制字符正则现状被简化（`/[--]/u`），与初代 `/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u` 不一致 | 任务 E / 任务 A 收尾时按 PRD-02 §6「保留换行 / 制表、剔其他控制字符」恢复原正则并补单测，避免非法字符入库 | W2 ｜ P1 |

---

### A.5 依据文件清单（供组长回读核对）

- `server/prisma/schema.prisma`：User / Material / Draft / Session 实际字段与默认值、索引（A.1 全部字段名来源）。
- `docs/PRD-01-账号与数据隔离.md`：§4 数据模型、§4.3 方案甲、§5 接口与错误码、§8 技术要点。
- `docs/PRD-02-材料库.md`：§2 表字段、§2.1 八类型枚举、§2.2 场合枚举、§2.3 去重、§6 校验规则。
- `docs/MVP排期与任务拆解-8周.md`：§4 数据表初稿、§5 接口草案、W2 任务范围。
- 初代只读参考：`D:\学习\制造业管理会汇报助手\app\lib\domain.cjs`（`material()`、`selection()`、`createDraft()`、`validateSections()` 字段源头）。
- 现状代码只读参照：`server/src/domain/{errors.ts,validation.ts}`、`server/src/lib/result.ts`、`server/src/plugins/{prisma.ts,auth.ts}`、`server/src/routes/{auth.ts,materials.ts}`、`server/src/app.ts`。
- 锁定口径：根 `AGENTS.md` 第四节（技术栈、产品边界、不做项）。

---

## 附录 B（m4 质量安全 · W2 测试清单与安全清单）

> 作者：m4 质量与安全官 ｜ 日期：2026-11-02 ｜ 性质：文档碎片 + 一个独立测试文件；供组长合并进 `05-w1-closeout-w2-delegation.md` 附录 B。
> 编辑边界：仅新增 `team/reviews/_fragment-appendix-B-m4.md` 与 `server/test/security-contract.test.ts`；未改 `server/src/**`、`server/test/domain.test.ts`、`plugins/`、`routes/`、`schema.prisma`、`web/`；未执行 git add/commit/push。
> 事实分层：**已验证**＝本轮实跑 `npm test` / `npm run build` 或逐行读码取证；**待任务 E 实现**＝代码尚为 501 占位，不得写成已通过；**建议**＝给任务 E 的工程倾向。编号严格沿用 PRD-01 / PRD-02，不新造验收编号。

---

### B.1 W2 测试清单（逐条回溯 PRD 编号）

测试类型口径：**纯单测**＝不依赖 DB/网络，node:test 直跑；**接口集成(需DB)**＝`app.inject()` + 测试库；**前端联调**＝浏览器/页面行为，后端只做配合；**推迟W3**＝依赖草稿闭环或后续周次，本轮只登记不阻塞。

#### B.1.1 PRD-01 账号与数据隔离（§7 A-OK1~OK5 / A-F1~F7）

| 编号 | 用例要点（PRD 原文概括） | 建议测试落点 | 测试类型 | 对应接口 | 现状 |
| --- | --- | --- | --- | --- | --- |
| A-OK1 | 新邮箱注册、密码合规：注册成功自动登录、进工作台；DB 有 users 记录且密码为哈希（无明文） | `server/test/auth.api.test.ts` 例 `register: 新用户成功落库且 passwordHash 为哈希`；DB 断言哈希前缀（argon2id `$argon2id$` / bcrypt `$2`）、`plan=free`、`status=active`；注册响应体不含 passwordHash | 接口集成(需DB) | POST `/api/auth/register` | 待任务 E 实现；错误码契约 409 映射已由 `security-contract.test.ts` 锁定 |
| A-OK2 | 已注册邮箱正确密码登录：登录成功、Cookie 种下、`GET /me` 返回正确用户信息 | `auth.api.test.ts` 例 `login: 凭证正确种 Cookie 且 /me 返回 id/email/emailPrefix/plan/createdAt`；断言 Set-Cookie 属性 HttpOnly、Path、SameSite | 接口集成(需DB) | POST `/api/auth/login`、GET `/api/me` | 待任务 E 实现 |
| A-OK3 | 登录后刷新页面、直接访问业务路由保持登录态 | 后端侧 `auth.api.test.ts` 例 `复用 Cookie 二次请求 /me 与受保护列表仍 200`；前端路由守卫行为归 `web` 联调 | 接口集成(需DB) + 前端联调 | GET `/api/me`、GET `/api/materials` | 待任务 E 实现；前端守卫为占位（`web/src/router` TODO），联调部分推迟 |
| A-OK4 | 退出登录后点后退/刷新：回登录页、看不到业务数据 | `auth.api.test.ts` 例 `logout: 服务端 Session 删除 + clearCookie；再带旧 Cookie 访问 /me 返回 401`；前端清状态跳页为联调项 | 接口集成(需DB) + 前端联调 | POST `/api/auth/logout` | 待任务 E 实现 |
| A-OK5 | 用户 A 创建材料后退出，用户 B 登录，B 列表看不到 A 的材料 | `server/test/materials.api.test.ts` 两用户种子隔离组（与 M-OK5 共用用例集）：B 的 `GET /materials` 不含 A 的材料；B 直取 A 材料 id 返回 404 | 接口集成(需DB) | GET `/api/materials`、GET `/api/materials/:id` | 待任务 E 实现；归属判定纯逻辑 `assertOwner` 已由 `result.test.ts`(3 例) + `security-contract.test.ts` 覆盖 |
| A-F1 | 邮箱格式错 / 密码过短 / 两次密码不一致：前端拦截，绕过前端直调服务端同样 400 | 优先纯校验单测 `server/test/auth-validators.test.ts`（邮箱格式、长度 8–72、含字母+数字、两次一致）；路由层 `auth.api.test.ts` 例 `register: 非法入参矩阵返回 400 VALIDATION_FAILED 且不落库` | 纯单测 + 接口集成(需DB) | POST `/api/auth/register` | 待任务 E 实现（validators 层尚不存在） |
| A-F2 | 注册已存在邮箱：409 明确提示、不创建重复记录 | `auth.api.test.ts` 例 `register: 重复邮箱 → 409 EMAIL_TAKEN，users 表不新增行`；唯一索引冲突也归一到该码，不外泄 DB 错误 | 接口集成(需DB) | POST `/api/auth/register` | 待任务 E 实现；`security-contract.test.ts` 已锁 409 映射契约 |
| A-F3 | 错误密码 / 不存在邮箱：统一「邮箱或密码不正确」，不区分账号是否存在 | `auth.api.test.ts` 两子例：`未知邮箱+任意密码`、`已知邮箱+错误密码`，断言同 `401 INVALID_CREDENTIALS`、响应文案一致、不返回用户存在性提示 | 接口集成(需DB) | POST `/api/auth/login` | 待任务 E 实现；契约 401 已锁定 |
| A-F4 | 未登录直接请求业务 API：401、不下发任何业务数据 | `materials.api.test.ts` 例 `无 Cookie 请求 GET/POST /api/materials → 401 UNAUTHENTICATED，响应体无 materials/data 字段` | 接口集成(需DB) | 全部 `/api/materials/*` | 待任务 E 实现；`requireAuth` 当前为占位恒 401 占位文案，需接真 Session |
| A-F5 | A 把材料/草稿 ID 换成 B 的 ID 请求：404，读不到也改不了；记一条安全日志 | `materials.api.test.ts` 越权矩阵（GET/PUT/DELETE 三个动词各一例）：A 的 Cookie 访问 B 记录全 404 `NOT_FOUND`；服务端安全日志含时间/用户/接口/结果码、不含密码与正文 | 接口集成(需DB) | GET/PUT/DELETE `/api/materials/:id`（草稿类 W3 补） | 待任务 E 实现；`assertOwner` 纯判定已覆盖，越权 404 编排待 E |
| A-F6 | 数据库异常时注册：不产生半成品用户记录、提示可重试 | `auth.api.test.ts` 故障注入例（mock Prisma 写库抛错或事务回滚）：断言无半条 users 记录、响应 500 统一文案、不回显 SQL | 接口集成(需DB，建议 mock/事务) | POST `/api/auth/register` | 待任务 E 实现；本轮不要求 mock 框架就位 |
| A-F7 | 会话过期后提交写操作：401、提示重新登录、且不发生写入 | `auth.api.test.ts` 例 `过期/已删 Session Cookie → POST /api/materials 返回 401，materials 表无新增行` | 接口集成(需DB) | POST `/api/materials`（示例写接口） | 待任务 E 实现；Session 过期判定随方案甲落地 |

#### B.1.2 PRD-02 材料库（§7 M-OK1~OK5 / M-F1~F7；标【W2 后端核心必测】者不得删减）

| 编号 | 用例要点（PRD 原文概括） | 建议测试落点 | 测试类型 | 对应接口 | 现状 |
| --- | --- | --- | --- | --- | --- |
| M-OK1 | 新建材料：选类型、2 个标签、填月份、粘贴正文保存；列表卡片元信息与字数统计正确 | `materials.api.test.ts` 例 `create: 合法材料落库并回读字段一致`；tags 归一（trim/去空/去重）、默认来源名「手工录入」、字数字段由前端展示、服务端存原文 | 接口集成(需DB) | POST `/api/materials`、GET `/api/materials` | 待任务 E 实现；正文长度常量 `LIMITS.body=20000` 已在 `validation.ts` |
| M-OK2 | 上传一份 md 文件保存：正文完整填入、分段保留、来源名为文件名 | `materials.api.test.ts` 例 `上传 md 内容 → body 保留换行、sourceName=文件名`；本期文件内容直接入 body，`fileRef` 留空；前端文件选择器为联调项 | 接口集成(需DB) + 前端联调 | POST `/api/materials` | 待任务 E 实现 |
| M-OK3 | 类型 + 月份 + 关键词组合筛选：仅显示同时满足者；清空条件恢复全量 | `materials.api.test.ts` 例 `筛选交集：type∧period∧keyword 同时命中；清空 query 返回全量`；关键词覆盖标题+正文+来源名 | 接口集成(需DB) | GET `/api/materials?type=&period=&keyword=` | 待任务 E 实现；筛选排序（updated_at 倒序）随接口落地 |
| M-OK4 | 编辑材料正文保存：version+1、关联草稿标记待重新核对、时间戳更新 | `materials.api.test.ts` 例 `PUT: version 1→2、updated_at 刷新`；草稿 `confirmedVersion` 清空联动依赖 Draft 闭环，先断言材料侧 version+1，联动断言随 W3 补 | 接口集成(需DB)（联动部分推迟W3） | PUT `/api/materials/:id` | 待任务 E 实现；版本语义 `validSources` 纯函数已覆盖 |
| M-OK5 | 两份不同用户登录互看材料库：互相不可见（与 PRD-01 联调验证） | 与 A-OK5 共用两用户种子隔离例集；列表 + 详情 + 越权写全覆盖 | 接口集成(需DB) | GET `/api/materials`、`/:id` | 待任务 E 实现；`assertOwner` 纯逻辑已覆盖 |
| M-F1 | 标题空 / 正文空 / 超 20000 字：400/422 明确提示、表单内容保留（前端） | 纯校验 `server/test/material-validators.test.ts`（标题 trim 非空≤100、正文非空≤20000）+ 路由 `materials.api.test.ts` 非法入参矩阵；超长建议 422、其余 400 | 纯单测 + 接口集成(需DB) | POST/PUT `/api/materials` | 待任务 E 实现；`str()` 长度/控制字符边界已由 `security-contract.test.ts` 覆盖 |
| M-F2 | 上传 docx/pdf：入口拒绝并提示本期支持格式，不上传不解析 | `materials.api.test.ts` 例 `非白名单扩展名/MIME 拒绝（400）且不进入解析分支`；前端按钮提示文案为联调项；本期不做 Office 解析（AGENTS.md 不做项） | 接口集成(需DB) + 前端联调 | POST `/api/materials`（上传分支） | 待任务 E 实现 |
| **M-F3【W2 后端核心必测】** | 同用户重复粘贴相同内容：409 提示重复、不写入；标题不同不视为重复 | `materials.api.test.ts` 例 `去重：同 period + 规范化正文指纹 → 409 MATERIAL_DUPLICATE、materials 表不新增；改标题不改内容仍判重；换 period 不判重；换用户不判重`；指纹规范化（去空白哈希）建议抽纯函数先落 `material-validators.test.ts` | 纯单测 + 接口集成(需DB) | POST `/api/materials` | 待任务 E 实现；409 错误码契约已锁定；指纹算法本轮未落地，属 E 核心交付 |
| M-F4 | 删除被草稿引用的材料：确认后删除、关联草稿失效提示；取消删除无变化 | `materials.api.test.ts` 例 `DELETE 成功后记录不存在；引用 Draft.confirmedVersion 清空`；「取消删除无变化」为前端交互联调；草稿联动细节随 W3 草稿闭环 | 接口集成(需DB)（取消交互前端联调；联动部分推迟W3） | DELETE `/api/materials/:id` | 待任务 E 实现 |
| **M-F5【W2 后端核心必测】** | 越权访问他人材料 ID（读/改/删）：全部 404、无数据泄露 | `materials.api.test.ts` 越权矩阵：B 对 A 记录 GET/PUT/DELETE 全 404；响应体不含标题/正文等任何字段；断言不出现 403/404 之外的存在性提示差异 | 接口集成(需DB) | GET/PUT/DELETE `/api/materials/:id` | 待任务 E 实现；`assertOwner` 纯判定 + 契约测试已覆盖；路由编排待 E |
| **M-F6【W2 后端核心必测】** | 非法月份（如 2026-13）、非法类型值：400 拒绝 | 纯单测：`period('2026-13'/'2026-00')` 抛错已由 `domain.test.ts` + `security-contract.test.ts` 覆盖；类型八枚举白名单纯函数建议入 `material-validators.test.ts`；路由层 `materials.api.test.ts` 非法 materialType/period 矩阵 400 | 纯单测 + 接口集成(需DB) | POST/PUT `/api/materials` | period 纯校验**任务 A 已覆盖纯函数部分**；类型枚举白名单与路由校验待任务 E 实现 |
| M-F7 | 无结果搜索：显示「没有匹配材料」空状态 + 新建入口，不报错白屏 | 后端 `materials.api.test.ts` 例 `空结果返回空数组 200 而非 4xx`；空状态文案与新建入口为前端联调 | 接口集成(需DB) + 前端联调 | GET `/api/materials?keyword=` | 待任务 E 实现（后端空响应契约）；页面展示联调 |

#### B.1.3 测试文件规划建议

**已在位（任务 A + 本轮 m4 新增，全部不依赖 DB，`npm test` 直跑）**

- `server/test/domain.test.ts`（24 例）已覆盖的领域能力：
  1. `period()` 合法/非法月份与年份边界（2 例）；
  2. `selection()` 类型校验、`selectMaterials()` 月度/年度过滤与 period+createdAt 排序（3 例）；
  3. `coverage()` 范围内缺月收集、范围外不计缺月（1 例）；
  4. `localSections()` 月度三固定标题、游离段「原文摘录，完成状态待核对：」前缀、空章节「待补充…」占位、年度 `YYYY-MM · ` 分组前缀（3 例）；
  5. `validateSections()` 章节数量边界、空章节、重复 id、来源白名单、evidence 约束、origin 归一、sourceIds 去重、>300 条 422（9 例）；
  6. `createDraft()` 月度/年度标题规则、`sourceVersions` 仅 id+version（2 例）；`validSources()` 版本命中/缺失/不符/空集（1 例）；
  7. `wrap()` 权重（ASCII 0.6 / 中文 1 / Tab 2）、`\n` 强制断行、代理对不截断（4 例）。
- `server/test/result.test.ts`（3 例）：`assertOwner` 不存在/他人/本人三分支。
- `server/test/security-contract.test.ts`（本轮新增 7 例）：错误码↔HTTP 状态契约、domain 目录静态纪律扫描、`str/integer/period` 输入安全边界、`assertOwner` 矩阵。

**任务 E 落地时新增（规划，本轮不实现）**

- `server/test/auth-validators.test.ts`（纯单测，可不连 DB 先行）：邮箱格式与长度、密码 8–72 + 字母数字组合、两次一致、email `trim().toLowerCase()` 归一。
- `server/test/material-validators.test.ts`（纯单测）：标题≤100、类型八枚举白名单、标签 ≤8 且单条≤12 并 trim/去空/去重、来源名≤180 默认值、正文控制字符剔除与 20000 上限、去重指纹规范化（去空白后哈希，标题不参与指纹）。
- `server/test/auth.api.test.ts`（集成，需 DB）：A-OK1~OK4、A-F1~F3、A-F7；Cookie 属性断言；哈希不落库；统一 401；409；403；logout 后旧 Cookie 失效。
- `server/test/materials.api.test.ts`（集成，需 DB）：M-OK1/OK3、M-F1/F3/F5/F6 后端部分；两用户种子隔离（A-OK5/M-OK5）；401 未登录；409 去重；404 越权矩阵；400 校验矩阵。
- 草稿联动（M-OK4/M-F4 的 confirmedVersion 失效）随 W3 草稿闭环在 `server/test/draft.api.test.ts` 补，本轮登记不阻塞。

**node:test 下 Fastify 注入测试做法（不占端口）**

```ts
import { buildApp } from '../src/app.js';

test('示例：未登录访问材料列表返回 401', async () => {
  const app = await buildApp();
  await app.ready();            // 仅注册插件与路由，不 listen
  const res = await app.inject({ method: 'GET', url: '/api/materials' });
  assert.equal(res.statusCode, 401);
  await app.close();
});
```

- `app.inject()` 走 Fastify 完整请求生命周期（含 hooks/错误处理），不监听真实端口，适合 CI；多例共用一个 app 实例在 `before`/`after` 钩子里建与关，避免重复注册。
- **DB 策略建议（二选一，任务 E 开工定）**：①独立测试库 `huixu_test`，每个用例结束 `deleteMany` 按表清理或包裹事务回滚（Prisma 交互式事务 `prisma.$transaction(async tx => {...})`，用例内读写均走 tx，回滚即清空）；②测试前 `prisma migrate reset --force` 到固定种子。禁止用开发库 `huixu` 跑破坏性用例；种子用户固定两账号（userA/userB）覆盖隔离与越权。
- 故障类用例（A-F6）建议对 Prisma 层做依赖注入/mock，不依赖真实 DB 报错行为；本轮不要求引入 mock 框架。

---

### B.2 安全清单（对照任务 E 落地项逐条给出检查点与判定标准）

> 通用原则：助手只读查询 + 生成草稿，不删除外发；错误响应统一 `{error:{code,message}}`，不回显堆栈、SQL、密钥、密码与材料正文（PRD-01 §5、§8.5；现状 `app.ts` 错误中间件已统一 `SERVER_ERR` 文案，服务端 `logger.error` 属服务端日志，不得进入响应体）。

#### B.2.1 密码存储（FR-A01 / PRD-01 §8.2）

| # | 检查点 | 判定标准（任务 E 完成后逐条验） |
| --- | --- | --- |
| 1 | 仅哈希存储 | 优先 argon2id；兜底 bcrypt 且 cost ≥ 10；DB `users.passwordHash` 不以 `$` 之外可识别明文形式存在，抽样断言哈希前缀（`$argon2id$` / `$2b$` 等）；禁止 MD5/SHA1/裸 SHA256 |
| 2 | 不落明文 | 注册 SQL 入参只含哈希；`GET /me`、列表、日志、错误消息、响应体均不出现明文密码或哈希（`/me` 返回字段白名单 `id,email,emailPrefix,plan,createdAt`） |
| 3 | 登录恒定时间比对 | 用库自带校验 API（argon2 `verify` / bcrypt `compare`），不手写 `===` 比较哈希；不允许先查用户再分支提示「用户不存在」 |
| 4 | 错误哈希/无用户统一失败 | 不存在用户也走一次等价耗时的假比对或直接同码返回，避免响应时间侧信道枚举；两者响应恒为 `401 INVALID_CREDENTIALS` 同文案 |
| 5 | 密码规则服务端兜底 | ≥8、≤72、含字母与数字；邮箱 ≤120 且 `trim().toLowerCase()` 后入库；前端校验失败不代表服务端可跳过（A-F1 直调接口 400） |
| 6 | 密码长度字节注意 | bcrypt 内部按 72 字节截断；中文密码 UTF-8 字节可能超 72，注册校验应按字节或给出明确提示，避免静默截断（实现时补说明，列为注意点） |

#### B.2.2 Cookie 安全（FR-A02/A03 / PRD-01 §4.3 方案甲）

| # | 检查点 | 判定标准 |
| --- | --- | --- |
| 1 | 属性齐备 | 登录成功 `reply.setCookie('sid', sid, { httpOnly: true, sameSite: 'lax', path: '/', secure: 生产环境 true, maxAge: 会话有效期 })`；测试逐项断言 Set-Cookie 头 |
| 2 | Cookie 只存 sid | 值为不透明随机 Session id（cuid/uuid），不写邮箱、不写哈希、不写用户 id 明文以外的业务数据；服务端 sessions 表按 sid 查用户 |
| 3 | Secure 环境判定 | 本地 HTTP 开发不强制 Secure（否则登录失败）；生产 HTTPS 必须 Secure；用 `NODE_ENV`/请求协议判定，不写死 |
| 4 | 登出双侧清理 | `POST /auth/logout` 先删服务端 Session 行（或标记失效），再 `reply.clearCookie('sid', {path:'/'})`；登出后旧 Cookie 重放 `/me` 必须 401（A-OK4/A-F7） |
| 5 | 会话失效与清理 | Session 带 `expiresAt`；过期 Session 查询直接 401；建议任务 E 加一次性启动清理或定时任务删除过期行（PRD-01 §8.3）；本期可不做滑动续期 |
| 6 | CORS 与凭证一致 | `@fastify/cors` `credentials: true` 时 `origin` 必须是显式白名单（来自 `CORS_ORIGIN` 环境变量拆分），禁止 `origin: true` 反射任意 Origin |

#### B.2.3 越权与存在性（PRD-01 §4.2 / PRD-02 §5）

| # | 检查点 | 判定标准 |
| --- | --- | --- |
| 1 | 查询强制 userId 作用域 | 所有 `material/draft/...` 查询 `where: { userId: currentUserId }`；`currentUserId` 只从鉴权上下文取，**拒绝接收请求体/query 中的 userId 字段**（出现即 400 或忽略并记录） |
| 2 | 统一 404 不暴露存在性 | 记录不存在与不属于当前用户均走 `assertOwner`  false → `404 NOT_FOUND`（`server/src/lib/result.ts` L27–33 已提供纯判定）；不允许「别人的记录返回 403、不存在返回 404」的可区分差异 |
| 3 | 读写删三动词全覆盖 | A 对 B 资源 GET/PUT/DELETE 全部 404（A-F5、M-F5）；响应体不含任何标题/正文片段 |
| 4 | 系统内置数据例外 | `TemplateCard.user_id = NULL` 的内置卡按「人人可读、不可改」单独放行；个人表（Material/Draft 等）`userId` 非空，无 NULL 放行分支 |
| 5 | 安全日志 | 越权与鉴权失败记录时间、会话 sid 哈希/用户 id、接口、结果码；不记录密码、材料正文、完整 Cookie（PRD-01 §8.5） |
| 6 | 裸查询评审点 | Code Review 检查每条 Prisma 查询是否带 userId 条件；禁止 `findUnique({where:{id}})` 直接返回后再判归属之外的旁路；列表接口同样作用域 |

#### B.2.4 错误码口径表（代码常量以 `server/src/lib/result.ts` 为准）

| 场景 | HTTP | 错误码（代码常量） | 说明 / 判定标准 |
| --- | --- | --- | --- |
| 注册邮箱已占用 | 409 | `EMAIL_TAKEN` | 唯一索引冲突也归一此码；不返回他人邮箱/注册时间等信息 |
| 登录凭证错误（用户不存在 / 密码错） | 401 | `INVALID_CREDENTIALS` | 两场景同码同文案，防账号枚举；不区分提示 |
| 账号停用 | 403 | `ACCOUNT_DISABLED` | `status ≠ 'active'`；本期无停用入口，测试用种子构造 disabled 用户覆盖 |
| 材料重复（同用户 period + 规范化正文指纹） | 409 | `MATERIAL_DUPLICATE` | M-F3 核心；标题不同不判重 |
| 未登录 / 会话失效 | 401 | `UNAUTHENTICATED` | **口径备注**：PRD-01 §5 文字写作 `UNAUTHORIZED`，`result.ts` 实际常量为 `UNAUTHENTICATED`；按任务 C 指令不另造常量、不改代码，统一以代码常量为准，前端只按 HTTP 401 处理，文案由前端展示层给定 |
| 资源不存在 / 不归属 | 404 | `NOT_FOUND` | `assertOwner` false 统一出口 |
| 参数校验失败（字段格式/枚举/长度常规越界） | 400 | `VALIDATION_FAILED` | 路由/service 层对外统一使用；注意 `domain/errors.ts` 的 `fail()` 默认内部码 `INVALID_INPUT` 不直接外漏，由 service 映射为上表对外码 |
| 正文 / 条目数量超限 | 材料 JSON 表单统一 400；`validateSections` 章节 >300 条维持 422 | `VALIDATION_FAILED` 或对应业务码 | 〔2026-11-02 裁定，见 B.2.4.1〕材料 body >20000、非法类型/月份/标签超限/C0 控制字符、空标题空正文均统一 400 `VALIDATION_FAILED`，早期 413/422 讨论本期不采用；422 仅保留给 `validateSections` 草稿章节超限（`AppError.status=422`）；不允许静默截断 |
| 服务端异常 | 500 | `SERVER_ERR` | 统一「服务暂时不可用」；不回堆栈、SQL、连接串 |
| 模型调用失败（W4，仅登记） | 401/403/429/超时/坏 JSON | `AUTH_FAIL/RATE_LIMIT/TIMEOUT/BAD_JSON` | 现状常量已在 `result.ts` 预留；W4 联调，W2 不实现 |
| 占位路由 501 | 501 | `NOT_IMPLEMENTED` | **临时码**，任务 E 路由落地后删除占位与该码使用，不得进入生产响应 |

#### B.2.4.1 状态码裁定记录（2026-11-02 组长拍板，用户确认）

**裁定结论：本期单体内部 JSON 表单的全部载荷校验失败，统一 HTTP 400 + `VALIDATION_FAILED`，不拆 413/422；现有测试断言 400 保持不变，不改 server 代码与 schema。**

| 裁定项 | 统一结论 | 理由 | 未来触发条件 / 备注 |
| --- | --- | --- | --- |
| 材料正文超长（>20000 字） | 400 `VALIDATION_FAILED` | JSON 表单为混合校验（枚举、月份、标签数、正文空/超长/C0 控制字符），前端统一走表单错误展示；改 422 需动 Fastify 错误映射与测试分支，本期收益低 | 未来实现 txt/md 文件上传、出现文件体积超限（实体过大）场景时，再单独评估 413 |
| 非法 materialType（不在八枚举） | 400 `VALIDATION_FAILED` | 枚举白名单校验，属常规表单校验 | 不另立状态码 |
| 非法月份 period（非 YYYY-MM / 年份越界） | 400 `VALIDATION_FAILED` | 同表单校验矩阵；period 空值分支除外 | 不另立状态码 |
| 标签超限（>8 个 / 单条 >12 字） | 400 `VALIDATION_FAILED` | 数量与长度混合校验，前端汇总提示 | 不另立状态码 |
| 正文含非法 C0 控制字符 | 400 `VALIDATION_FAILED` | 服务端拒绝并提示，不静默清洗入库 | 不另立状态码 |
| 空标题 / 空正文 | 400 `VALIDATION_FAILED` | 必填校验，失败时表单内容保留 | 不另立状态码 |

边界保留：`validateSections` 草稿章节 >300 条的 422 属草稿结构校验（domain 纯函数既有行为），不在本裁定范围，维持原状。

#### B.2.5 依赖风险分级表（依据 `server/package.json` + `package-lock.json` 实锁版本；未执行 `npm audit`，不臆造 CVE 结论，分级为暴露面与维护方式评估）

**生产 dependencies（lock 实锁版本）**

| 依赖 | lock 版本 | 分级 | 理由与注意点 |
| --- | --- | --- | --- |
| fastify | 4.29.1（声明 ^4.28.1） | **P1 关注** | Web 框架主干，直接暴露 HTTP 面；锁定 lockfile 不随意跳大版本（Fastify 5 迁移另议）；统一错误中间件不得把 `error.message`/堆栈透给前端；定期关注官方安全公告并在任务 E 收尾跑一次 `npm audit` |
| @fastify/cors | 9.0.1 | **P1 关注** | 凭证跨域开关面；`credentials:true` 必须配显式 origin 白名单；禁止通配 `*` 与 credentials 同用；生产域名由环境变量注入 |
| @fastify/cookie | 9.4.0 | **P1 关注** | 仅负责 Cookie 解析/写入；安全属性（HttpOnly/SameSite/Secure/Path）在任务 E 逐个断言；勿用 Cookie 承载超过 sid 的数据 |
| @prisma/client | 5.22.0（声明 ^5.19.0） | **P1 关注** | ORM 客户端，全部 DB 访问入口；参数化查询天然防注入，但仍禁止 `$queryRawUnsafe` 拼接用户输入；版本与 dev 侧 `prisma@5.22.0` 对齐；schema 中无明文密钥字段（ModelKey.encryptedKey 为 W4 加密预留，本期不写） |
| dotenv | 16.6.1 | **P2 备查** | 仅开发/本地加载 `.env`；`.env` 已被 gitignore 排除（需复核 `.gitignore` 持续生效）；禁止日志/错误响应打印 `process.env`；生产环境由平台注入环境变量，不依赖 `.env` 文件 |
| pptxgenjs | 4.0.1 | **P2 备查** | 仅 W6 导出 pptx 使用，W2 不加载、无网络暴露面；保持 lockfile 锁定；关注其依赖链体积与 Node 版本兼容，云端安装验证留 W8 |
| argon2（任务 E 拟引入，**当前未安装**） | 待定（未入 lock） | **P1 关注（引入时把关）** | 优先 argon2id；原生 N-API 编译产物需匹配 Windows 开发机与 Linux 服务器架构，CI/部署需有预编译二进制回退方案；API 用异步哈希/校验；参数用推荐默认（memoryCost/timeCost/parallelism 不刻意调小）；装不上再按降级方案切 bcrypt，禁止无哈希落库 |
| bcrypt（兜底备选，**当前未安装**） | 待定（未入 lock） | **P1 关注（备选把关）** | cost ≥ 10；必须异步 `hash/compare`，避免同步调用阻塞事件循环；72 字节截断注意（见 B.2.1 第 6 点）；与 argon2 二选一后移除另一个，不双依赖并存 |

**devDependencies（不进生产运行时）**

| 依赖 | lock 版本 | 分级 | 注意点 |
| --- | --- | --- | --- |
| prisma | 5.22.0 | P2 | CLI 仅开发/迁移使用，不打包进生产镜像 |
| tsx | 4.23.15 | P2 | 测试与 dev 运行器；生产用 `node dist/*`，不依赖 tsx |
| typescript | 5.9.3 | P2 | 编译期工具；`strict:true` 已开启，保持不关闭规则 |
| @types/node | 22.20.5 | P2 | 类型声明，无运行时风险 |

**分级汇总**：当前无 **P0 阻塞**依赖；P1 为框架/鉴权/ORM/哈希六个把关项（任务 E 引入哈希库时同步复核）；P2 为开发工具与远期模块。备注：本轮未运行 `npm audit`，上述不含已知漏洞 CVE 判定；任务 E 启动后应补一次 `npm audit --omit=dev` 基线并把结果登记进本附录。

#### B.2.6 输入安全（PRD-02 §6 + PRD-01 FR-A01）

| # | 检查点 | 判定标准 |
| --- | --- | --- |
| 1 | 枚举白名单 | material_type 八值（work_report/project_progress/meeting_minutes/hr_admin/customer_business/contract_deal/regulation/other）、occasion 七值可空、kind 仅 monthly/annual、origin 仅 local/ai/manual；白名单外一律 400，不做前端透传映射 |
| 2 | 长度上限 | 邮箱≤120；密码 8–72；标题≤100；类型≤20；occasion≤30；正文≤20000；来源名≤180；标签 ≤8 个、单个 ≤12 字；章节标题/条目 ≤100/5000（沿用 `LIMITS.item=5000`）；超限拒绝不截断 |
| 3 | 控制字符 | 剔除 C0 控制字符（`\u0000-\u0008\u000b\u000c\u000e-\u001f`），保留 `\t \n \r`；`str()` 正则已对齐初代，任务 E 复用不得放宽（已由 `security-contract.test.ts` 锁边界） |
| 4 | 标签清洗 | 逐个 trim、去空串、去重后落库；总数与单条长度双校验 |
| 5 | 文件上传白名单 | 仅 `.txt/.md/.markdown`，扩展名校验 + 内容 MIME/文本嗅探双判；UTF-8 解码失败返回「请换格式」提示；**不解析 docx/pdf/pptx**（不做项，AGENTS.md 锁定）；单文件 ≤20000 字，超出提示拆分，不静默截断 |
| 6 | 错误响应脱敏 | 不回显堆栈、SQL 片段、连接串、密钥、密码、完整 Cookie；服务端日志可记内部错误码，用户响应只给统一文案 |
| 7 | 归一化与存储 | 邮箱 `trim().toLowerCase()`；标题 trim；period 空值放行但不参与去重指纹歧义；正文去空白哈希用于去重（M-F3），原文仍完整保存不改写 |

---

### B.3 任务 A 复审报告（m4 独立复核，不沿用被审者自述结论）

复审对象：`server/src/domain/{errors,validation,materials,draft,text,index}.ts`、`server/test/domain.test.ts`；对照初代只读件 `D:\学习\制造业管理会汇报助手\app\lib\domain.cjs`、`app\lib\pptx.cjs`（L11–21 wrap）。复审时间 2026-11-02，本机实跑取证。

#### B.3.1 纯函数纪律 —— **通过（无 P0/P1）**

- 全目录 Grep 复核：`@prisma/client`、`node:fs`/`fs/promises`、`process.env`、`fetch(`、`prisma.` 命中数 **0**；`validation.ts` 仅用 `node:crypto.randomUUID`（纯生成，非 IO）。
- 本轮新增 `security-contract.test.ts`「纯函数纪律」静态扫描例，把上述禁止项固化为自动检查，后续任何人往 domain 引入 IO 会直接变红。
- `npm test` 实跑不依赖数据库连接即可通过（见 B.3.4 数据），佐证 domain 无 DB 耦合；`store.cjs` 文件持久化未迁入，符合委派单要求。

#### B.3.2 语义对齐初代 —— **通过（差异均为允许的类型化改写，无逻辑偏差）**

| 复审点 | 初代依据 | TS 实现 | 结论 |
| --- | --- | --- | --- |
| selectMaterials 过滤 | `domain.cjs` L37–39：部门相等或「全部部门」、年份相等、月度比月份/年度比 ≤throughMonth | `materials.ts` L96–110，条件逐条对应；年度分支 `sel.throughMonth ?? Number.NaN` 仅为类型安全兜底，行为不变 | 通过 |
| selectMaterials 排序 | `period.localeCompare` 优先，再 `createdAt.localeCompare` | `materials.ts` L106–109 同表达式 | 通过；测试例 a2/a1 顺序验证 createdAt 次序 |
| coverage 缺月 | L40–44：强制 annual 重算相关集；`inRange: i < throughMonth`；范围内 count=0 进 missing | `materials.ts` L113–122；`through` 局部变量同语义 | 通过；missing=[2,4,5,6]、7 月 inRange=false 均有断言 |
| localSections 三固定标题 | L45 `HEADINGS=['重点进展','问题风险','下期计划']` | `materials.ts` L74 同值；月度固定三节 | 通过；标题数组 deepEqual 断言 |
| 占位文案 | L66 `待补充：未提供本项资料，请人工补充并核对。` | `materials.ts` L159 同文案；空章节 push 且 sourceIds/evidence 为空 | 通过；专例断言 |
| 游离段前缀 | L62 `原文摘录，完成状态待核对：${part}` | `materials.ts` L147 同模板；归属 `sections[target ?? 0]` | 通过；前缀 + sourceIds/evidence 结构断言 |
| 年度前缀 | L70 分组后 title=`${p} · ${s.title}` | `materials.ts` L170–177 同逻辑，period 去重排序后 flatMap | 通过；6 个标题顺序 deepEqual |
| 代理对切分 | L58–61：4000 码位切，末尾高代理 `end--` 回退 | `materials.ts` L140–144 同算法（正则 `/[\uD800-\uDBFF]/u`） | 通过（单元测试另在 wrap 侧补了代理对断言；localSections 切分逻辑与之一致） |
| validateSections 边界 | L81–96：1–36 章、每章≥1、id 唯一、sourceIds≤50 且白名单、evidence≤50 且 sourceId∈sourceIds、>300 条 422、origin 归一、sourceIds 去重 | `draft.ts` L105–166 逐条对应；evidence 先 map 再校验、白名单 `allowed` Set 同构 | 通过；9 个测试例覆盖上述边界 |
| createDraft 标题规则 | L75：月度 `${y}年${m}月管理会汇报`；年度 `${y}年度汇总（截至${t}月${缺月?'，资料不完整':''}）` | `draft.ts` L67–70 同模板拼接 | 通过；月度例、年度缺月/齐全两组断言 |
| validSources | L78–80：非空且每份 id+version 全命中 | `draft.ts` L90–100 同语义 | 通过；命中/版本不符/缺失/空集四分支 |
| wrap 权重 | `pptx.cjs` L11–21：Tab=2、ASCII 0x20–0x7E=0.6、其余=1；`\n` 断行；去 `\r`；`for...of` 码点迭代 | `text.ts` L5–27 逐行等价；权重表、断行、尾行 `if (line \|\| !lines.length)` 保留空串语义一致 | 通过；4 例测试覆盖权重/换行/Tab/代理对 |

**允许差异说明（非缺陷）**：① TS `createDraft` 用显式字段替代初代 `...sel` 展开，输出字段集与初代一致；② `department` 内部字段名按委派要求保留，`index.ts` L1–2 已注释说明 W3 mapper 映射到 Prisma `occasion`；③ 初代 `material()` 材料字段校验、`validateState()` 备份校验、`template()/emptyState()/samples()` 未迁移——委派单明确 `store.cjs` 持久化不迁、备份功能降级后移，不属任务 A 漏项（落点见 P2-3/P2-4）。

#### B.3.3 测试质量 —— **通过（无空跑断言；少量 P2 补测建议）**

- 断言实质：使用 `deepEqual` 比较 id 序列/对象结构、`assert.throws(..., /正则/)` 校验错误消息、`AppError.status === 422` 状态断言；不存在只调用不校验的空跑例。
- 委派点覆盖核对（24 例）：period 校验 2、选材 selection/selectMaterials 3、coverage 缺月 1、三章节 localSections 3、来源约束 validateSections 9、草稿 createDraft 2 + validSources 1、wrap 4，合计 **24 例**，与委派单点名的六类能力一一对应。
- 未覆盖边界（**P2 建议，不阻塞验收**）：
  - P2-a：`selection` 年度未传 throughMonth 的回退分支（当前年取当月、非当前年取 12，`materials.ts` L88–90）无测试；
  - P2-b：`localSections` 中 markdown 标题 `# 重点进展` 剥离 `#` 与结尾全/半角冒号（`materials.ts` L133）无显式断言；
  - P2-c：`wrap` 空字符串、末尾纯换行的尾行行为未测（低风险，逻辑与初代一致）；
  - P2-d：材料 `period` **允许空值**是 PRD-02 新要求（§2「允许未标记期间」），而 `validation.ts` `period()` 拒绝空串；二者不冲突但任务 E validators 必须做空值分支（空 → 存 NULL；非空 → 走 `period()`），不得把 `period()` 直接套到材料 period 字段（**P1 级实现注意**，归任务 E，非任务 A 缺陷，因任务 A 对齐初代语义）；
  - P2-e：tags 数量/长度校验不属 domain 层（委派点未要求），落点任务 E `material-validators.test.ts`，不在此苛求。

#### B.3.4 类型与构建 —— **通过**

- `npm run build`（`tsc -p tsconfig.json`，`strict:true`）本轮实跑退出码 **0**；
- `npm test` 本轮实跑结果：**tests 34 / pass 34 / fail 0**（任务 A 贡献 24 + 既有 3 + 本轮 m4 新增 7），退出码 0；
- `any` 使用排查：`server/src/domain/**` 内 **0 处 `any`**；仅有校验后的窄化断言（`v as string`、`x as string`、`sourceIds as string[]`），可接受。另在占位 `plugins/auth.ts` L12、L25 发现两处 `request:any/reply:any`，**不在任务 A 编辑范围**，登记 P2 交任务 E 类型化为 `FastifyRequest/FastifyReply`。

#### B.3.5 总体结论

**结论：通过，可进入任务 E。** 无 P0、无阻塞性 P1；任务 A 的纯函数迁移与初代等价、测试有实质断言、构建与测试全绿。遗留项均为 P2 建议或任务 E 实现注意：

| 级别 | 项 | 位置 | 期望行为 / 处置 |
| --- | --- | --- | --- |
| P1（实现注意，非缺陷） | 材料 period 空值分支 | 任务 E validators | 空值放行存 NULL；非空复用 `period()`；勿直接整体复用导致「未标期间」被 400 拒 |
| P2-a | selection 回退月份补测 | `materials.ts` L88–90 / `domain.test.ts` | 补 1 例 annual 无 throughMonth 的回退断言（允许任务 E 顺手补，不阻塞） |
| P2-b | 标题剥离 `#`/冒号补测 | `materials.ts` L133 | 补 markdown 标题归一断言 |
| P2-c | 占位 plugin 两处 any | `plugins/auth.ts` L12/L25 | 任务 E 接真 Session 时替换为 Fastify 类型 |
| P2-d | 材料字段校验未迁 | 初代 `material()` L26–27 | 任务 E 落 `validators/` + `material-validators.test.ts`（标题/类型枚举/标签/正文/来源名/去重指纹） |
| P2-e | 备份相关初代函数未迁 | 初代 `validateState/template/emptyState/samples` | 备份功能降级后移，需要时再评估迁移，本轮不补 |

复现方式（组长/任务 E 可独立复验）：`cd server; npm test`（应 34 pass 0 fail）；`npm run build`（应退出 0）；对照初代文件逐节阅读即可复核 B.3.2 表。

---

### B.4 待确认与后续安全建议

**待确认（任务 E 开工评审拍板，不阻塞本附录归档）**

1. Session 有效期：建议固定 7 天过期、本期不做滑动续期；过期行清理策略（启动时清理 vs 定时任务）。
2. `CORS_ORIGIN` 生产域名清单；本地开发保持 `http://127.0.0.1:5173`。
3. 哈希库最终选型：优先 argon2id；若原生二进制在本机/服务器安装失败，按 bcrypt cost≥10 兜底并记录选型理由。
4. 【已裁定 · 2026-11-02】材料正文超长状态码：早期分歧为 400 / 413 / 422（原建议 422，与 `validateSections` 超限一致）；现统一裁定为 **400 `VALIDATION_FAILED`**——含超长正文在内的全部 JSON 表单校验失败不拆 413/422，现有测试断言 400 保持不变；裁定明细见 B.2.4.1，文件上传体积超限场景留待未来再评估 413。
5. `UNAUTHENTICATED`（代码常量）与 PRD 文案 `UNAUTHORIZED` 不做改名统一；前端只依赖 HTTP 401。

**后续安全建议（按优先级）**

- 任务 E 收尾补 `npm audit --omit=dev` 基线，结果回填 B.2.5；依赖安装（argon2/bcrypt）后同步更新 lockfile 分级说明。
- 鉴权失败/越权统一走安全日志中间件（时间、用户、接口、结果码；禁记密码与正文）；注册失败加简单计数日志（PRD-01 FR-A02 安全细节），验证码/限流本期不做。
- 材料去重指纹（去空白规范化 + 哈希）建议先落纯函数测试，再进路由，便于 M-F3 回归；指纹算法不得使用用户可控的哈希密钥外参数导致可绕过。
- 任务 E 完成后复审 `requireAuth` 与每条 Prisma 查询的 userId 作用域（B.2.3 清单逐条勾选），再给出「可进入前端联调」结论。

---

## 附录 C（m1 产品 · W1 收尾对照与 W2 边界确认）

- 负责人：m1-product ｜ 日期：2026-11-02 ｜ 性质：纯文档碎片，供组长合并进 `05-w1-closeout-w2-delegation.md` 附录 C；本文件不改任何源码
- 取证方式：只读实读 `docs/`、`server/`、`web/`、`spikes/`；只读 `git log/ls-files/status`；只读直连本地 PG（`\dt`）核实表清单；未修改文件、未执行 git add/commit/push
- 状态图例：✅完成（有提交/文件/数据库证据）｜🟡部分（主件在、子项缺或未复核）｜⬜未做（无落地证据或未真实验证）｜➖取消降级（按排期 §6 预案移出本期）
- 口径约束：未跑过的测试不写"通过"；未真实调用的模型不写"已调通"；编号严格沿用 PRD-01 / PRD-02，不新造编号

---

### C.1 W1 任务逐条对照表（对照《MVP排期与任务拆解-8周.md》§3 W1）

#### C.1.1 后端

| 排期条目原文要点（§3 W1 后端） | 状态 | 证据（提交 hash / 文件路径 / 实测） | 遗留 / 说明 |
| --- | --- | --- | --- |
| 初始化 TypeScript 工程、lint、测试骨架（node:test 或 Vitest） | 🟡部分 | 工程骨架：`server/package.json`、`server/tsconfig.json`（提交 `ef2056f` 初始化骨架，后续 `856c07f`/`1fb6f2f`/`569fa66` 持续落地）；测试基座：`server/test/result.test.ts`、`server/package.json` 脚本 `test: tsx --test test/*.test.ts`（提交 `569fa66`，node:test） | **lint 子项 ⬜未做**：仓库无 ESLint/任一 lint 配置文件，`package.json` 无 lint 脚本；排期原文的 lint 要求悬空，需二选一：W2 前补 lint，或在 README/排期显式登记"本期以 tsc 类型检查代替 lint"。测试基座目前仅 1 个样例文件 3 例（assertOwner），`npm test` 全绿结论来自 05 委派单登记，本附录未重跑 |
| 定稿数据表（第 4 节），本地起 PostgreSQL，跑通首次迁移 | ✅完成（含一处口径偏差需备注） | 8 模型：`server/prisma/schema.prisma`（User / Session / Material / Draft / TemplateCard / Entity / ModelKey / ExportRecord）；迁移 `server/prisma/migrations/20261031163639_init/migration.sql`（提交 `1fb6f2f`）；只读直连本地库实测 8 张业务表 + `_prisma_migrations` 均在；本地 `psql (PostgreSQL) 16.4` 实测（`D:\pgsql\bin`） | **口径偏差**：排期原文写"本地 Docker 起 PostgreSQL"，实际为免安装 PG 16.4 直跑（05 委派单第一节已登记该方式）；容器化复现留待 W8 云端部署。表数量相对排期 §4 的 7 张主表多出 `Session` 表，属落实 PRD-01 §4.3 方案甲（PG Session）的合理增列，非偏差 |
| 抽出初代 domain.cjs 纯函数（期间计算、三章节本地整理规则、引用校验、长度限制），改造成不依赖 state.json 的模块，配单测 | 🟡部分 · 进行中/待回填（由任务 A 落地，本附录按其产出回填，不写成已完成） | 已在位：`server/src/domain/errors.ts`（AppError/fail）、`server/src/domain/validation.ts`（LIMITS 容量常量、id/now/str/integer/period/dateParts）；初代参考只读件 `D:\学习\制造业管理会汇报助手\app\lib\{domain.cjs,pptx.cjs}` 存在 | **缺口明确**：①上述两个 domain 文件当前 `git status` 显示未跟踪（`?? server/src/domain/`，`git ls-files` 为空），尚未提交，有丢失风险；②初代核心纯函数未迁移：`selectMaterials`、`coverage`（缺月判断）、`localSections`（重点进展/问题风险/下期计划三章节）、`createDraft`、`validSources`、`validateSections`（来源约束/引用校验）、`validateState`、`material/selection/template/emptyState/samples`；③`pptx.cjs` 的 `wrap` 折行未迁；④无 `server/test/domain.test.ts`。任务 A 目标文件 `materials.ts`/`draft.ts`/`text.ts`/`index.ts` 均不存在 |

#### C.1.2 前端

| 排期条目原文要点（§3 W1 前端） | 状态 | 证据（提交 hash / 文件路径） | 遗留 / 说明 |
| --- | --- | --- | --- |
| Vite + Vue3 初始化，路由骨架：登录/工作台/材料库/年度回顾/模板库/设置 | ✅完成 | `web/src/router/index.ts`：`/login`、`/`（工作台）、`/materials`、`/templates`（模板库）、`/year`（年度回顾）、`/settings`；另有 `/editor/:draftId?`（W3 预留路由）；依赖 `web/package.json`（vue 3.4 / vue-router 4.4 / vite 5.4，提交 `9c552f8`、`ef2056f` 骨架） | 路由守卫为占位（`router/index.ts` 内 `TODO(W2)`：未真实调 `GET /me`、401 跳登录逻辑未接）；骨架可预览，不构成登录安全能力 |
| 全局布局：左侧导航 + 右侧主区（飞书式骨架先搭出来） | ✅完成 | `web/src/layouts/MainLayout.vue`：左侧 brand + 6 项导航 + 底部状态位，右侧 topbar + `RouterView` 主区；紫 token 见 `web/src/styles/tokens.css`、`theme.css` | 仅结构骨架；顶栏"问助手"按钮为 W5 占位；无退出按钮与当前用户标识（W2 接 auth store 后补） |
| （配套落点）TDesign + Pinia 五 store 注册 | ✅完成（骨架层） | 提交 `9c552f8`（引入 tdesign-vue-next@1.20.10、pinia@4.1.0 依赖）；提交 `ff02a48`（`web/src/main.ts` 注册 Pinia/router/TDesign；五 store：`stores/auth.ts`、`materials.ts`、`draft.ts`、`template.ts`、`settings.ts` + `index.ts` 统一导出） | **仅注册层完成**：各 store action 为空函数 + `TODO(W2)`（以 `auth.ts` 为例：`fetchMe/login/register/logout` 均未接请求）；`web/src/api/http.ts` 只有 fetch 封装与 401 占位；无页面表单/列表实现。符合 W1"骨架"定位，W2 前端最多最小接 API，不做美化 |

#### C.1.3 技术 Spike

| 排期条目原文要点（§3 W1 Spike） | 状态 | 证据（提交 hash / 文件路径 / 实测） | 遗留 / 说明 |
| --- | --- | --- | --- |
| pptxgenjs 服务端按配置生成 1 页带配色 pptx 并能下载；确认云端环境依赖可装 | 🟡部分（脚本与提交结论在，云端依赖未验） | 提交 `20a951b`（"实测生成示例 pptx 通过"）；脚本 `spikes/s2-pptx-gen.cjs`（紫主色 `6C5CE7` 单页 + 要点 + 来源角标）；`server/package.json` 脚本 `spike:s2`；依赖 `pptxgenjs@4.0.1` 已在 `dependencies` | ①产物 `spikes/out/s2-demo.pptx` 被 `.gitignore` 忽略不入库，当前 `spikes/out/` 为空，本附录未重新生成、未在 Office/WPS 打开复核"文本可编辑、主色生效"，"通过"为提交作者自测结论；②排期后半句"确认云端环境依赖可装"依赖服务器，属 W8 范畴，本周不具备验证条件 |
| 用免费/低价测试 Key 调通 DeepSeek（或选定模型）一次非流式请求，确认网络可达与返回结构 | ⬜未做（未验证，不得写已调通） | 脚本就绪：`spikes/s1-model-check.cjs`（缺 Key 自动 SKIP；含 AUTH_FAIL/RATE_LIMIT/TIMEOUT/BAD_JSON 分类）；`server/.env` 存在 `MODEL_BASE_URL`/`MODEL_NAME`/`MODEL_KEY` 变量（本附录仅确认变量名存在，未读取、未回显密钥值）；`docs/技术Spike方案与脚本模板.md` 各「执行记录」小节空白，仓库无任何 S1 运行输出 | **无真实调用证据**：无 PASS/FAIL 记录、无 `choices[0].message.content` 落档；按排期 §6 降级预案，模型联调受阻时本地规则模式先完整交付，AI 功能只标"接口预留、待 Key 联调"。真实联通与错误分类演练推迟到 W4 模型适配层前补跑并回填执行记录 |
| 服务器环境摸底并记录（对应 Spike-S4 / 12.2-A 清单） | 🟡部分（本机已摸，云端未做） | 本机实测：Node `v22.23.2`、npm `10.9.8`、PG 16.4；`docs/技术Spike方案与脚本模板.md` S4 清单在位；README §6 登记"服务器信息与域名/备案待提供" | 云端服务器 SSH/规格/出网能力/`docker compose up` 空壳验证全部未执行（无服务器信息，见 Spike 方案 S4 前置条件）；按排期 §6 与 README，云端部署顺延 W8，本周以本机闭环为准。备注：S3 母版探针（`s3-master-probe.py`）非本周三条 Spike 之一，缺 2–3 份脱敏 pptx，未执行，维持"本期不做无损套版"口径 |

**W1 周末检查点对照（排期 §3 末段）**：①"本地起空壳前后端"——前后端骨架代码在位、依赖已装，本附录未实际 `npm run dev` 起进程复核（未验证，建议 W2 开工首步起健康检查 `/health` 确认）；②"初代整理规则函数有测试覆盖"——**未达成**，对应 C.1.1 第三行缺口，随任务 A 关闭。

---

### C.2 W2 范围边界（对应任务 E；防提前越界）

#### C.2.1 W2 做（In Scope · 后端主干 P1，前端最小接 API）

来源：排期 §3「W2 账号与材料库」、PRD-01 §1.2、PRD-02 §1.2、05 委派单任务 E。

1. **账号（PRD-01）**：邮箱 + 密码注册 / 登录 / 退出 / `GET /me`；密码 argon2id 优先（bcrypt 兜底）哈希存储、绝不落明文；HttpOnly + `SameSite=Lax`（生产 HTTPS 加 `Secure`）Cookie Session（方案甲，`sessions` 表已在 schema）；`requireAuth` 鉴权中间件接真 Session，未登录统一 401 `UNAUTHENTICATED`。
2. **隔离机制（PRD-01 §4.2）**：所有业务查询强制 `userId` 作用域，不接受前端传用户 id；资源不存在或不归属统一 404 `NOT_FOUND`（不暴露资源存在性）；配套两用户种子数据的隔离自动化测试。
3. **材料 CRUD（PRD-02 §1.2、§5 接口表）**：列表（类型/标签/月份/关键词组合筛选，本期一次返回前端过滤、预留 `page` 参数）、详情、新建、编辑（`version+1`）、删除。
4. **服务端校验全表落地（PRD-02 §6）**：标题非空去空格 ≤100 字；类型命中 `2.1` 八枚举；标签 ≤8 个、单个 ≤12 字、去空去重；期间空或 `YYYY-MM`（2000–2100，非法月份拒绝）；正文非空 ≤20000 字、剔控制字符保换行；来源名 ≤180 字、空默认「手工录入」；文件仅 txt/md/markdown（扩展名校验 + UTF-8 解码）。
5. **去重（PRD-02 §2.3）**：同用户下 `period + 规范化正文指纹`（去空白后哈希）重复 → 409 `MATERIAL_DUPLICATE` 拒绝写入；标题不同不视为重复。
6. **错误码与测试**：`EMAIL_TAKEN` / `INVALID_CREDENTIALS` / `ACCOUNT_DISABLED` / `MATERIAL_DUPLICATE` / `UNAUTHENTICATED` / `NOT_FOUND`；隔离与错误码自动化测试（对应 C.3 标注"后端接口测试可覆盖"的编号）。
7. **前端最小接入（克制）**：登录/注册极简页、主壳退出位与当前邮箱前缀显示、材料列表 + 新建/编辑最小表单调用上述接口；`http.ts` 401 统一跳登录。视觉美化、交互打磨不在本轮。

#### C.2.2 W2 不做（Out of Scope · 明确登记防提前，与 AGENTS.md 第四节、两份 PRD 不做项一致）

| 不做项 | 依据来源 | 归属周次/处置 |
| --- | --- | --- |
| 找回密码、邮箱验证邮件流程；手机号验证码登录、微信/第三方 OAuth 登录；个人资料编辑/头像昵称；账号注销入口；多角色权限 | PRD-01 §1.3；AGENTS.md 第四节"第三方登录" | 本期仅预留字段/接口位，不发邮件、不做入口 |
| docx / pdf / pptx 原文件解析；材料 OCR、图片内容识别 | PRD-02 §1.3；AGENTS.md 第四节"Word/PDF/PPTX 解析" | 上传入口仅接受 txt/md，其他格式点击即提示，不发起解析 |
| 材料版本历史对比（只留最新版 + 更新时间）；收藏置顶、分享链接、多人可见；文件夹/层级目录；批量删除 | PRD-02 §1.3、FR-M05 | 扁平列表 + 筛选满足本期 |
| 复杂分页（本期材料量小，接口仅预留 `page`）；图表统计、材料维度计数图表 | PRD-02 §9-3；排期 W7"简单图表" | 统计条最多做轻量份数/月份数，不引图表库 |
| W3 草稿生成闭环：本地三章节初稿、编辑器增删改/上下移/来源跳转、确认流程、pptx 导出、年度视图基础版、JSON 备份导入导出 | 排期 §3 W3；PRD-02 §8 衔接 | 本轮不建 drafts 业务接口；M-OK4/M-F4 联动用例随 W3 |
| W4 模型 Key 加密存储、AI 调用、SSE 流式进度、错误分类实战、外发确认弹窗 | 排期 §3 W4；AGENTS.md 第四节"RAG/Function Calling/Agent 编排/微调/多模型" | `ModelKey` 表仅占位；`MODEL_KEY` 环境变量是本地测试用途，两者关系待 W4 前厘清（见 C.4） |
| W6 模板卡片匹配打分 Top3、三栏编辑器成型、逐页 HTML 预览、卡片套用版式导出 | 排期 §3 W6 | `/templates` 路由与 store 仅占位，不实现匹配逻辑 |
| 前端 UI 美化、窄屏响应式打磨、空状态/加载态统一视觉 | 排期 §6 降级预案"视觉美化放 W7"；05 任务 E 范围外 | 本轮基础组件保证功能即可 |
| 会员支付、团队协作、小程序先行、自由无限画布、无损母版套版、演讲稿生成 | AGENTS.md 第四节；README §5 | 永久不做或本期不做，`plan`/`hasWatermark` 仅字段预留 |

---

### C.3 验收编号映射表（编号严格沿用两份 PRD 第 7 节，不新增发明编号）

判定列说明：**后端可测**＝W2 接口/自动化测试直接覆盖；**需联调**＝后端可断言主体、前端页面表现需前后端联调确认；**推迟**＝依赖后续周次能力，W2 不承诺验收。

#### C.3.1 PRD-01 账号与数据隔离

| 编号 | PRD 用例要点（按原文概括） | W2 判定 | 备注 |
| --- | --- | --- | --- |
| A-OK1 | 新邮箱合规注册 → 注册成功、自动登录、进工作台、DB 有 users 记录且密码为哈希 | 后端可测 | 服务端断言：201 + 落库 + 密码非明文哈希；"自动登录跳工作台"的前端表现需联调 |
| A-OK2 | 已注册邮箱正确密码登录 → 成功、Cookie 种下、`GET /me` 返回正确用户信息 | 后端可测 | Cookie 读写与 `/me` 响应体可在集成测试断言；页面右上角前缀显示需联调 |
| A-OK3 | 登录后刷新页面、直接访问业务路由保持登录态 | 需联调 | 依赖前端路由守卫接 `GET /me`（当前为 TODO 占位）；服务端 Session 有效性随 A-OK2 覆盖 |
| A-OK4 | 退出登录后点浏览器后退/刷新 → 回登录页、看不到业务数据 | 需联调（后端部分可测） | `POST /auth/logout` 销毁 Session 后端可测；前端清态与跳转属联调 |
| A-OK5 | A 创建材料后退出，B 登录看不到 A 的材料 | 推迟 | PRD 原文已注"材料库联调时覆盖"，与 M-OK5 同一跨账号场景；W2 后端隔离用例先覆盖 API 层，页面级互不可见随材料库联调 |
| A-F1 | 邮箱格式错/密码过短/两次不一致 → 前端拦截；绕过前端直调服务端同样 400 | 后端可测（服务端 400 部分） | 前端表单拦截提示属联调；服务端校验规则以 PRD-01 FR-A01 为准 |
| A-F2 | 注册已存在邮箱 → 409 明确提示、不建重复记录 | 后端可测 | 错误码 `EMAIL_TAKEN`；断言无重复行 |
| A-F3 | 错误密码/不存在邮箱 → 统一「邮箱或密码不正确」，不区分账号是否存在 | 后端可测 | 错误码 `INVALID_CREDENTIALS`；响应文案一致即可，不回显枚举差异 |
| A-F4 | 未登录直接请求业务 API → 401、前端跳登录页、不下发业务数据 | 后端可测（服务端 401） | 前端跳转行为属联调；本轮业务 API 主要是 `/materials` |
| A-F5 | A 把材料/草稿 ID 换成 B 的 ID 请求 → 404，读不到改不了，记安全日志 | 部分可测 / 草稿部分推迟 | 材料资源越权（读/改/删）W2 后端测试覆盖；**草稿资源越权用例推迟 W3**（草稿接口未建）；安全日志字段不落密码与正文 |
| A-F6 | 数据库异常时注册 → 不产生半成品用户记录、提示可重试 | 后端可测（错误路径约定） | 以事务/错误处理断言为主；真实故障注入条件允许时补，否则登记为约定覆盖 |
| A-F7 | 会话过期后提交写操作 → 401、提示重新登录且不发生写入 | 后端可测 | 构造过期/不存在 sid 调用写接口，断言 401 且无数据变更 |

#### C.3.2 PRD-02 材料库

| 编号 | PRD 用例要点（按原文概括） | W2 判定 | 备注 |
| --- | --- | --- | --- |
| M-OK1 | 新建材料：类型 + 2 标签 + 月份 + 粘贴正文保存 → 列表出现卡片、元信息正确、字数统计正确 | 后端可测（数据层） | 返回字段与落库值可断言；卡片 UI 与前端字数统计显示需联调 |
| M-OK2 | 上传一份 md 文件保存 → 正文完整填入、分段保留、来源名为文件名 | 推迟/联调 | 服务端 txt/md 解析与扩展名校验可在 W2 随 POST `/materials` 落地；文件选择交互、来源名自动填充与完整用例需前端联调，本轮不单独承诺 |
| M-OK3 | 类型 + 月份 + 关键词组合筛选 → 仅显示交集结果，清空条件恢复全量 | 后端可测（查询逻辑） | 筛选组合查询在 API 层断言；前端筛选条联动需联调 |
| M-OK4 | 编辑材料正文保存 → version+1；关联草稿被标记待重新核对；时间戳更新 | 推迟（W3） | `version+1` 本身 W2 可测；**草稿 confirmedVersion 清空联动依赖草稿模型接口，随 W3 验证** |
| M-OK5 | 两份不同用户登录互看材料库 → 互相不可见（与 PRD-01 联调验证） | 需联调 | 对应 A-OK5；W2 先完成 API 层隔离测试（M-F5），页面级互不可见随联调 |
| M-F1 | 标题空/正文空/超 20000 字 → 400/422 明确提示、表单内容保留 | 后端可测 | 表单保留已填内容属前端行为，后端只断言拒绝与错误结构 |
| M-F2 | 上传 docx/pdf → 入口拒绝并提示本期支持格式，不上传不解析 | 推迟/联调 | 服务端 MIME + 扩展名校验可先落；前端入口提示与阻止上传动作随联调，口径上绝不解析 Office 文件 |
| M-F3 | 同用户重复粘贴相同内容 → 409 提示重复、不写入 | 后端可测（W2 核心） | 错误码 `MATERIAL_DUPLICATE`；指纹 = period + 去空白规范化正文哈希；标题不同不算重复 |
| M-F4 | 删除被草稿引用的材料 → 确认后删除、关联草稿失效提示出现；取消无变化 | 推迟（W3） | 取消/确认交互属前端；草稿失效联动无草稿接口无法验证，随 M-OK4 一并 W3 |
| M-F5 | 越权访问他人材料 ID（读/改/删）→ 全部 404、无数据泄露 | 后端可测（W2 核心） | 与 A-F5 材料部分共用两用户种子用例；断言不返回他人字段、不泄露存在性 |
| M-F6 | 非法月份（如 2026-13）、非法类型值 → 400 拒绝 | 后端可测 | 覆盖 period 正则边界与 `2.1` 枚举白名单 |
| M-F7 | 无结果搜索 → 显示「没有匹配材料」空状态 + 新建入口，不报错白屏 | 需联调（后端空列表可测） | 后端返回空数组即可；空状态 UI 与新建入口属前端联调 |

**推迟到后续周次的验收编号汇总（供组长排期）**：
- 推迟 W3（草稿闭环依赖）：**M-OK4、M-F4**；A-F5 的草稿资源部分随 W3 补。
- 推迟/联调类（后端主体 W2 可测、完整用例需前端联调或文件交互）：**A-OK3、A-OK4、A-OK5、M-OK2、M-OK5、M-F2、M-F7**；其中 A-OK5 与 M-OK5 为同一跨账号场景的两个编号，联调时一次覆盖两处。
- 不列入 W2 验收：W4 AI 相关、W6 模板匹配相关用例（两份 PRD 未编号，不在本表内新增）。

---

### C.4 W1 遗留风险与产品建议（事实分层：已确认 / 待验证 / 建议）

#### C.4.1 已确认事实（有提交、文件或只读实测证据）

1. **地基表结构已落地**：8 模型 schema + 迁移 `20261031163639_init`，本地 PG16.4 实测 8 张业务表存在（`1fb6f2f`、直连 `\dt` 结果）。
2. **后端骨架在但业务为空**：`routes/auth.ts`、`routes/materials.ts` 全部为 501 占位；`plugins/auth.ts` 的 `requireAuth` 未读 Cookie、`currentUserId` 恒 null；无 `services/`、无真实校验层接入路由（05 委派单第二节已登记一致）。
3. **测试基座仅样例级**：node:test 在位（`569fa66`），仅 `assertOwner` 三例；领域函数单测缺失（见 C.1.1）。
4. **前端为纯骨架**：路由、布局、五 store 注册完成（`9c552f8`、`ff02a48`），store action 与路由守卫全为 TODO；无真实业务页面。
5. **模型 Spike 未真跑**：`s1-model-check.cjs` 就绪、`.env` 变量就位，但无执行记录、无调用证据；产品口径保持"本地规则优先、AI 不伪装成功"。
6. **组件库口径已切换**：实际落地 TDesign Next Vue；README §1 选型表仍写 Element Plus、01 评估报告 P1-1 的旧疑问被新决策覆盖，文档未同步。
7. **文档不做清单守住**：schema 中 `plan`、`hasWatermark`、`ModelKey.encryptedKey` 仅为预留字段；代码未发现支付、协作、第三方登录、Office 解析等越界实现。

#### C.4.2 待验证（本周未取证、W2 开工前应补证，不得在报告中写成已完成）

1. `npm test` 与 `npm run build`（tsc）当前是否全绿——05 委派单登记为通过，本附录未重跑；任务 A 完成后须由 m3/m4 复跑确认。
2. `spike:s2` 重新生成的 pptx 在 Office/WPS 中文本是否可编辑、紫主色是否生效；当前 `out/` 无产物可核。
3. S1 DeepSeek 一次非流式请求的真实连通性与错误分类输出（待 Key 条件满足时补跑并填写 Spike 执行记录）。
4. 前后端 `npm run dev` 实际起服状态：`/health`、`/api/auth/*` 占位响应、前端 5173 页面可达性。
5. 迁移在干净数据库（或未来 Docker 卷）上的可复现性，避免本机直装库与容器库口径漂移。

#### C.4.3 产品建议（按优先级）

1. **P0 · 先收口任务 A 再开任务 E**：C.1.1 第三行的 domain 缺口是 W3 本地闭环的前置；当前两个 domain 文件还未被 git 跟踪，建议尽快随任务 A 独立提交，避免工作区文件丢失。任务 E（W2 主干）以 domain 可用为启动条件，不跳过。
2. **P1 · 消除 lint 悬空项**：W2 开工前二选一——补最小 ESLint 配置并加脚本，或在 README/排期显式登记"本期以 `tsc --noEmit` 代替 lint"；不留排期要求与仓库现状不一致的尾巴。
3. **P1 · W2 验收按 C.3 判定表裁剪承诺**：对外/对排期只承诺"后端可测"编号全绿；联调编号列入联调清单；推迟编号（M-OK4、M-F4 等）明确不进 W2 完成定义，防止 W2 周被草稿联动拖期。
4. **P1 · 同步两处文档口径**：README 组件库由 Element Plus 改为 TDesign；补一句"`MODEL_KEY` 环境变量仅供本地 Spike/W4 测试，多用户正式鉴权以 `model_keys` 表为准"（承接 01 报告 P1-6）。
5. **P2 · 可选字段对齐**：PRD-01 的 `lastLoginAt`、PRD-02 的 `isSample` 与 schema 当前差异，在 W2 建表/接口实现时决定补字段或在 PRD 标注裁剪（承接 01 报告 P2-A），不阻塞 W2 开工。
6. **P2 · 外部依赖持续登记不伪装**：模型 Key 联调、云端服务器与备案、脱敏 pptx 样本三项外部条件维持"待到位"状态；任一缺失时按排期 §6 降级预案走本地模式，不挤占账号隔离 + 材料库主线。

---

> 本碎片仅含产品视角对照与边界结论；技术分层与字段映射见 m2 附录 A，测试用例编号追溯见 m4 附录 B；合并后由组长统一核对编号与提交。
