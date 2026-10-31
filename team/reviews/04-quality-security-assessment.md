# 04 · 质量与安全评估报告（m4 质量与安全官）

- 负责人：m4-quality ｜ 依据技能：ec-security-review、terminal-security-audit、receiving-code-review、doubao-coding-review-code、tdd / test-driven-development
- 评估日期：2026-10-31 ｜ 只读评估，不改源码
- 输入：`server/src/**`、`schema.prisma`、`.env.example`、`.gitignore`、两份 PRD 安全/失败用例章节、`docs/AI汇报助手-产品方案与架构设计-v1.md` §6.4、`docs/核心任务流说明.md` 异常矩阵
- 输出位置：`team/reviews/04-quality-security-assessment.md`
- 边界声明：本报告区分「当前代码中已存在的可利用问题」与「设计已识别、待实现落地的安全要求」；当前业务功能未实现，现存攻击面很小，不得把"尚未实现"等同于"已有漏洞"。

---

## 一、结论先行（质量安全视角）

**总体判断：当前不存在可被实际利用的高危漏洞（原因是业务接口与登录均未实现，攻击面尚未形成）；代码中已体现若干正确的安全基线（不回显堆栈、参数化 ORM、.env 排除、行级 userId 设计）。真正的安全工作集中在 W2–W4 随功能落地：会话、密码哈希、越权校验、输入校验、Key 加密、速率限制。结论为「保留设计与骨架，把 PRD 安全验收项作为 W2 强制门禁补齐」，不需要推倒重来。**

- 质量侧：无测试基座、无 lint、占位为主；质量风险是"未建立可验证的回归保护"，而非现有代码有大量缺陷。
- 安全侧：多数 PRD 失败用例尚无代码可测，应在对应功能开发时以测试先行（TDD）方式覆盖，而不是现在补造安全机制。

## 二、当前威胁面盘点（按可访问性）

| 暴露面 | 现状 | 风险等级 |
| --- | --- | --- |
| `GET /health` | 公开，返回 `dbConnected/aiConfigured` 布尔 | 低：仅布尔，不泄露连接串与密钥；生产可收敛为仅 status |
| `/api/auth/*` | 4 个处理器全部 501，无真实登录/注册 | 暂无（无认证逻辑可攻击） |
| `/api/materials/*` | 5 个处理器全部 501；且当前未挂 `requireAuth` | 暂无业务数据可访问；一旦实现必须立即挂守卫 |
| 数据库 | 未连接、无迁移、无真实数据 | 暂无数据泄露风险；环境准备时需限制监听与账号权限 |
| 模型 Key | 未配置、未存储；`model_keys` 表空壳 | 暂无；实现时为重点保护对象 |
| 前端静态资源 | 占位页面，无用户输入处理、无 v-html、无外部脚本引用 | 低 |
| 导出文件 | 无下载路由；仅 spike 脚本本地生成 | 暂无 |

## 三、已做对的安全/质量基线（保留并坚持）

1. **错误响应不回显堆栈**：`app.ts` errorHandler 统一返回 `{code:'SERVER_ERR', message:'服务暂时不可用'}`，未把 error.message/stack 透出给客户端，符合"生产不泄内部细节"。
2. **数据库访问参数化**：使用 Prisma 客户端而非手写拼接 SQL，天然缓解 SQL 注入；后续不得写原生 `$queryRawUnsafe` 拼接用户输入。
3. **环境密钥不入库**：`.gitignore` 已排除 `.env`、`.env.*`，仅保留 `.env.example` 占位；需持续保证不把真实 Key 提交。
4. **数据隔离已建模在 schema**：业务表统一 `userId` 外键 + Cascade 级联；`TemplateCard.userId` 可空表达内置共享；`lib/result.assertOwner` 归属判断函数已预备。
5. **Vue 默认文本插值转义**：前端未使用 `v-html`，默认缓解 XSS；后续渲染材料正文/AI 文本时延续此约束。
6. **统一错误码枚举**：`result.ts` 已列出鉴权、冲突、限流、超时等分类，便于错误分类与前端一致处理。
7. **TypeScript strict 开启**：减少类型层面的缺陷混入。

## 四、分项安全评估与整改要求

### 4.1 认证与会话（P1，W2 强制落地）

现状证据：`plugins/auth.ts` 的 `currentUserId` 恒为 `null`，`requireAuth` 恒回 401 占位；`@fastify/cookie` 已注册但**未传任何配置**（无 secret、未限定 HttpOnly/SameSite/Secure）；schema 无 `Session` 表；`package.json` 无 bcrypt/argon2。

要求：
- 密码存储：禁止明文与可逆加密；选用 bcrypt 或 argon2（二选一，建议 argon2id 或成熟 bcrypt cost≥10），注册与登录统一走哈希比对；不要在代码里硬编码盐值逻辑。
- 会话：按 ADR-003 建 `sessions`（sid、userId、expiresAt、createdAt）；登录成功服务端生成随机 sid 写入 Cookie，属性 `HttpOnly`、`SameSite=Lax`、生产 `Secure`；登出服务端删行；定期清理过期会话。
- 登录失败：统一模糊文案（"邮箱或密码错误"），避免枚举有效邮箱；记录失败次数并接入速率限制（见 4.5）。
- 已禁用：第三方登录、邮件找回（本期边界，不实现即安全边界清晰）。

### 4.2 数据隔离与越权（P1，W2/W3 强制门禁）

现状：`assertOwner` 已写但**零调用方**；业务路由尚未挂守卫。PRD-01 隔离约定（强制 `WHERE user_id`、越权统一 404 而非 403 枚举存在性、内置模板 `user_id=NULL`）与 PRD-02 去重/版本规则需在实现时逐条测试。

要求：
- 所有业务路由前置 `requireAuth`，处理器内从会话取 `currentUserId`，查询/写入强制带 `userId` 条件。
- `:id` 资源先按 `userId + id` 查询；不存在或不归属一律 404，不区分"不存在"与"无权"。
- 写操作（材料编辑/删除、草稿确认、导出、Key 删除）服务端复核归属，前端隐藏按钮不作为安全边界。
- 越权用例必须自动化：A 账号令牌访问 B 账号材料/草稿/Key 的请求被拒（对应 PRD 失败用例，W2 建测试基座后首批补齐）。
- 级联删除遵循 schema 设计：删用户清理业务数据；删材料需联动失效引用它的草稿待核状态（PRD-02 已述，实现时测试覆盖）。

### 4.3 密钥与隐私（P1，W4 落地；本地模式 P2）

现状：`ModelKey.encryptedKey` 字段存在但无加密实现；`.env.example` 的 `MODEL_*` 全空；`SESSION_SECRET` 示例为 `change-me-to-a-long-random-string`（占位，生产必须替换）。

要求：
- 用户 Key 落库前用服务端主密钥加密存储（至少 AES-GCM/对称封装），主密钥来自环境变量，不进代码库；接口响应只返回掩码（前 4 后 4 或 `sk-****`），永不回传明文。
- 测试连通性由服务端代发请求，明文 Key 不下发到前端；外发 AI 请求前在 UI 明示本次发送内容范围（任务流 F3/F1-4 约定）。
- 会话密钥 `SESSION_SECRET`、数据库密码、模型 Key 全部经环境变量注入；`.env.example` 只写空值与注释。
- 导出文件按方案 §6.4 隐私分级：本地模式不离开本机；外发模式逐材料确认；水印预留字段 `hasWatermark` 在导出实现时生效。
- 个人材料正文属敏感内容：日志禁止记录材料正文、Key、密码（pino 配 `redact` 路径）。

### 4.4 输入校验与注入（P1，随接口落地）

现状：无校验库、无 Fastify schema；`result.ts` 无 VALIDATION_FAILED 使用方。

要求：
- 服务端统一校验层（Fastify JSON Schema 或 zod 择一，不混用），落实 PRD-02 硬约束：标题 ≤100、正文 ≤20000 字、标签 ≤8 个且每个 ≤12 字、period `YYYY-MM` 且 2000–2100 合法区间、类型/场合枚举白名单。
- 注册接口校验邮箱格式、密码强度下限、确认密码一致；非法输入返回 `VALIDATION_FAILED` 与字段级消息，前端红边展示。
- 继续禁止 `$queryRawUnsafe` 拼接；排序/筛选字段白名单化，避免 order by 注入。
- 导出文件文件名做净化（去除路径分隔符与 `../`），存储路径限定在用户目录内，防目录穿越（W3 实现导出时）。

### 4.5 CORS / CSRF / 速率限制 / 安全响应头（P1–P2）

现状：`@fastify/cors` 按 `CORS_ORIGIN` 白名单 `split(',')` 并 `credentials:true`；未装 `@fastify/rate-limit`；无安全头中间件。

要求：
- CORS 生产环境 `CORS_ORIGIN` 必须为明确 HTTPS 域名白名单，**禁止配置为 `*`**（与 credentials:true 组合属错误配置）；开发默认 5173 保留。
- Cookie 会话方案下配 `SameSite=Lax` 缓解 CSRF；敏感写操作（删 Key、导出、备份）可加来源/Token 二次确认。
- 登录/注册/Key 测试接口接入速率限制与简单失败冷却，防暴力枚举与撞库。
- 生产补基础安全响应头（不强制 helmet 全量，至少禁 MIME 嗅探、限制 iframe 嵌入、CSP 基础策略）；W8 部署前检查。

### 4.6 日志、错误与可观测（P2）

- 生产关闭或降级 `logger:true` 的详细请求日志级别；敏感字段 redact。
- 全局 errorHandler 当前把所有非预期错误统一成 SERVER_ERR 文案是对的，但**HTTP 状态码仍透传 `error.statusCode`**，且 404/400 等业务错误也可能被兜底成 SERVER_ERR 语义——应让路由层先用 `result.fail` 返回细分错误码与正确状态码，兜底只处理未捕获异常（与 m2 R-6 一致）。
- 模型错误按 `AUTH_FAIL/RATE_LIMIT/TIMEOUT/BAD_JSON/CONTENT_INVALID/SERVER_ERR` 分类落日志，便于降级，不把模型报错原文抛给用户。

### 4.7 依赖供应链与构建产物（P2）

- 提交 `package-lock.json`/`pnpm-lock.yaml` 锁定版本（确认已随 install 生成并入库；node_modules 已被 gitignore 排除）。
- 不引入运行期未知来源包；Spike 临时脚本与生产依赖分离（`spikes/` 不被 server 启动链引用）。
- 构建产物 `dist/` 不入库；`.env.example` 不含真实值（已满足，保持）。

### 4.8 质量工程：测试与验收门禁（P1 机制，逐步充实）

现状：业务测试文件为 0（Glob 命中全部是 node_modules 第三方测试）；无测试脚本；无 lint 脚本。

要求（按 m3 排期落地）：
- W2 选定运行器（node:test 或 vitest 其一），首批测试：注册/登录/会话失效、跨账号越权访问、材料校验失败与去重冲突（409 MATERIAL_DUPLICATE）。
- 每实现一个 PRD 失败用例即对应一条测试；验收标准（A-OK/M-OK 正常、A-F/M-F 失败）作为提交前检查项。
- 后端接口用 light-my-request（fastify 自带注入能力）做集成测试，不必依赖真实起端口；前端至少为校验逻辑与五步状态机写单元测试，组件渲染测试可后置。
- 提交门禁：类型检查通过、新增测试通过、不提交 `.env`/`dist`/`out`。

## 五、对照 PRD 失败用例的覆盖计划（不编造逐条结果）

| PRD 失败类 | 对应安全/质量要求 | 当前代码状态 | 落地时机 |
| --- | --- | --- | --- |
| 未登录访问受保护资源 → 401 跳登录 | 守卫 + 前端路由守卫 | 前后端均占位 | W2 |
| 越权访问他人资源 → 404 | assertOwner 接线 + 测试 | 函数在、未调用 | W2/W3 |
| 注册邮箱已占用 → 409 EMAIL_TAKEN | 注册唯一约束 + 重复处理 | 未实现；注意 `result.ts` 错误码尚未含 EMAIL_TAKEN，需补枚举 | W2 |
| 密码错误 → 401 INVALID_CREDENTIALS | 统一模糊提示 + 限速 | 未实现；错误码枚举需补 | W2 |
| 账号停用 → 403 ACCOUNT_DISABLED | status 状态校验 | User.status 字段已建模、逻辑未写 | W2 |
| 材料重复提交 → 409 MATERIAL_DUPLICATE | period + 正文指纹去重 | 错误码已在枚举、逻辑未写 | W2 |
| 非法入参（超长/枚举外/坏月份）→ VALIDATION_FAILED | 统一校验层 | 未建 | W2 |
| AI 失败（Key 错/限流/超时/坏 JSON）→ 回退本地稿 | 错误分类 + 回退 | 错误码预留、适配层未建 | W4–W5 |
| 导出失败/材料失效不污染原稿 | 版本链与事务 | schema 有 version、事务未写 | W3/W6 |

> 说明：`result.ts` 当前 ErrorCode 缺 `EMAIL_TAKEN / INVALID_CREDENTIALS / ACCOUNT_DISABLED` 三项（PRD-01 要求），属 W2 前需补的枚举缺口，列入清单。

## 六、风险分级汇总

### P0（现存、必须立即处理）
无现存高危可利用问题。**若 W2 实现登录时未带会话保护与哈希，将立刻升级为 P0**，因此下面 P1 项带有"实现即强制"性质。

### P1（功能落地同期必须完成，否则不予合并）
1. 密码哈希库选型与实现；禁止明文存密码。
2. Session 表 + HttpOnly/SameSite Cookie 会话全链路 + 过期清理。
3. 所有业务路由挂守卫；`assertOwner` 全部接线；越权自动化测试首批落地。
4. 服务端统一输入校验层，落实两份 PRD 字段硬约束。
5. 模型 Key 加密存储、掩码返回、主密钥环境化。
6. 登录/Key 测试接口速率限制；CORS 禁止 `*` 配置。
7. 补 ErrorCode 缺失三项；建立测试运行器与首批隔离/校验测试。
8. `SESSION_SECRET` 生产强随机值与部署配置规范。

### P2（迭代加固，不阻塞主闭环）
1. 生产日志降级与敏感字段 redact；基础安全响应头。
2. 导出文件名净化与存储目录边界（防目录穿越）。
3. ESLint/Prettier 基础规范与提交前检查脚本。
4. 备份文件加密与权限控制。
5. 健康检查生产收敛（不暴露 db/ai 配置布尔亦可保留内部版）。
6. 依赖锁文件复核与定期审计。

## 七、质量与安全结论（是否推倒重来）

**不推倒重来。**

- 现状代码短、结构简单，尚未积累需要清洗的安全债；正确的基线（不泄堆栈、参数化 ORM、密钥排除、隔离模型）已经打下，重写无收益。
- 安全保障的正确做法是"随功能实现以测试先行补齐"，而不是现在凭空堆砌成熟方案；当前把 P1 项排进 W2–W4 任务、作为合并门禁即可控制风险。
- 对团队流程的要求：每位成员提交涉及鉴权/持久写/外部调用的改动前，按本报告 P1 清单自查；m4 在 W2 末、W4 末各做一次专项复查（隔离越权测试通过、Key 不落明文、无 `.env` 入库）。

## 八、已验证 / 未验证 / 阻塞

- 已验证：`.gitignore` 正确排除环境变量；错误处理器不透传堆栈；CORS 白名单机制存在；schema 行级外键与级联；cookie 插件当前无安全配置（待补）；无业务测试文件。
- 未验证：真实登录与越权行为（无实现、无 DB）；密码哈希强度；Key 加密方案；生产头与限流；导出路径安全。
- 阻塞：数据库实例（隔离测试无法运行）；模型 Key（加密存储联调推迟到 W4）；部署环境（生产安全头与 HTTPS Cookie Secure 在 W8 验证）。
