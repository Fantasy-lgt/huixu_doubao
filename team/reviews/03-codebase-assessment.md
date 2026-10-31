# 03 · 代码库评估报告（m3 研发工程师）

- 负责人：m3-developer ｜ 依据技能：doubao-coding-analyze-codebase、doubao-coding-develop-frontend/backend-features、verification-before-completion、prototype
- 评估日期：2026-10-31 ｜ 只读评估，不改源码
- 输入：`server/src/**`、`web/src/**`、`server/prisma/schema.prisma`、`spikes/**`、两份 package.json、`docs/MVP排期与任务拆解-8周.md`
- 输出位置：`team/reviews/03-codebase-assessment.md`
- 说明：工作量数字为**经验估算**，用于排期对照，非实测工时；标注「已验证」的均来自此前迁移后实际运行结果。

---

## 一、结论先行（代码视角）

**总体判断：代码是一套"可编译、可起服务、但业务能力约 5–10% 的契约骨架"。结构方向干净、无历史包袱和坏味道代码，值得保留；缺的是按排期填充实现，不存在需要推倒重写的代码债务。建议「在现有骨架上继续开发」。**

- 后端：仅 `/health` 完整可用；`auth`、`materials` 路由为 501 契约占位；草稿/模板/实体/Key/导出/助手等路由尚未建文件。
- 前端：路由表与主壳布局成形；7 个视图中 6 个为占位面板，登录页也是静态说明卡片而非真实表单；无状态管理、无组件库、无接口模块。
- 工程可运行性：此前实测后端 `/health` 返回 200（dbConnected=false、aiConfigured=false，符合无库无 Key 的预期）；前端 `vue-tsc -b` 退出码 0、`vite build` 成功产出。**即"能编译能起壳"，但端到端业务链路一条都还没通。**

## 二、运行可验证性记录

| 验证项 | 命令/方式 | 结果（此前迁移后复测） | 状态 |
| --- | --- | --- | --- |
| 后端进程启动 | `server npm run dev`（tsx watch） | 监听 3001，进程可起 | 已验证可启动 |
| 健康检查 | `GET http://127.0.0.1:3001/health` | `{status:"ok", service, time, dbConnected:false, aiConfigured:false}` | 已验证；db/ai 字段为环境布尔，符合预期 |
| 后端类型检查 | `tsc -p tsconfig.json`（build 脚本） | 未在本次单独重跑；`tsconfig` strict 开启 | 待 W2 随实现跑通确认 |
| 前端类型检查 | `vue-tsc -b` | 退出码 0 | 已通过 |
| 前端生产构建 | `vite build` | 成功，产出 dist 约 15 个文件 | 已通过 |
| 业务接口（注册/登录/材料 CRUD） | 对应路由 | 全部 501 `NOT_IMPLEMENTED` | 未实现 |
| 数据库迁移 | `prisma migrate dev` | 无 DATABASE_URL、无 migrations 目录 | 未执行 |
| S2 导出脚本 | `node spikes/s2-pptx-gen.cjs` | 历史提交记录生成示例 pptx 通过；`out/` 被 gitignore | 部分验证（单页，非多页产品逻辑） |
| S1 模型连通 | 缺 Key | 脚本缺变量时自动 SKIP | 未验证 |
| S3 母版探针 | 缺脱敏模板 | 未运行 | 未验证 |

> 本次评估为只读，未重启服务、未改代码；上表历史实测结论来自迁移后复测，具体运行证据可在 W2 开发时复跑。

## 三、后端逐文件状态

| 文件 | 职责 | 实现状态 | 备注 |
| --- | --- | --- | --- |
| `src/index.ts` | 入口、端口、错误退出 | ✅ 可用 | `0.0.0.0` 监听；`PORT` env 覆盖 |
| `src/app.ts` | 插件与路由组装、错误兜底 | 🟡 结构可用，兜底偏粗 | 已注册 cors/cookie/prisma/auth；errorHandler 统一 SERVER_ERR，细分错误应在路由层用 result.fail |
| `src/plugins/prisma.ts` | Prisma 单例、连接释放 | ✅ 结构可用 | 无 DATABASE_URL 不报错；未做连接失败处理细化 |
| `src/plugins/auth.ts` | requireAuth 守卫 | 🔴 占位 | `currentUserId` 恒 null；requireAuth 直接 401 占位；无 Session 读取、无 Cookie 解析调用 |
| `src/routes/health.ts` | 健康检查 | ✅ 唯一完整路由 | 仅环境布尔探测，无依赖注入式 DB ping（当前可接受） |
| `src/routes/auth.ts` | register/login/logout/me | 🔴 四个 501 | 注释契约对应 PRD-01，位置正确待填 |
| `src/routes/materials.ts` | 材料 CRUD + 筛选 | 🔴 五个 501 | 注释契约对应 PRD-02，含去重/版本/联动失效提示 |
| `src/lib/result.ts` | 错误码、ok/fail、assertOwner | 🟡 工具已写未接线 | 10 个错误码枚举齐全；`assertOwner` 无任何调用方 |

**后端完全缺失（排期 §5 接口草案要求但无文件）**：
- `routes/drafts.ts`（generate/列表/详情/更新/确认/导出）
- `routes/template-cards.ts`（列表/新建/匹配打分）
- `routes/entities.ts`（列表/新建/确认）
- `routes/model-keys.ts`（列表/测试/保存/删除）
- `routes/exports.ts`（pptx 生成下载）
- `routes/assistant.ts`（意图解析/SSE 生成）
- `routes/backup.ts`（导出/导入）
- `services/`（本地整理规则、模板打分、引用校验、错误分类、pptx 渲染编排）
- 密码哈希依赖（bcrypt/argon2）、会话存储、入参校验库均未在 package.json 出现。

## 四、前端逐视图状态

| 文件 / 路由 | IA 对应 | 实现状态 | 说明 |
| --- | --- | --- | --- |
| `router/index.ts` | IA §2 | 🟡 路由表成形，守卫未接线 | 7 条路由与 IA 对应；`beforeEach` 仅设 title，`GET /me` 拦截为 TODO |
| `layouts/MainLayout.vue` | 主壳 | 🟡 静态骨架 | 左侧 6 项导航、高亮态、顶栏"问助手"按钮无事件绑定；无用户信息/退出/会话态；侧栏硬编码"本地规则模式·未配置 Key" |
| `api/http.ts` | 接口层 | 🟡 基础封装可用 | fetch + credentials:include + 统一解包；401 跳转为 TODO；无按模块拆分的 api 方法 |
| `views/AuthView.vue` | `/login` | 🔴 静态说明卡片 | 无真实表单、无校验、无提交；仅文案 + 跳转链接（与"登录页高保真原型"差距大，原型在 docs/ui-design） |
| `views/HomeView.vue` | `/` | 🔴 PlaceholderPanel | 工作台 KPI/任务卡/折线均未实现 |
| `views/MatView.vue` | `/materials` | 🔴 PlaceholderPanel | 列表/筛选/新建弹窗未实现 |
| `views/EditorView.vue` | `/editor/:draftId?` | 🔴 PlaceholderPanel | **五步状态机（step1–5）未实现**；仅文字描述接口顺序；无三栏布局、无步骤条、无草稿数据结构 |
| `views/TplView.vue` | `/templates` | 🔴 PlaceholderPanel | 模板卡列表/Top3 匹配未实现 |
| `views/YearView.vue` | `/year` | 🔴 PlaceholderPanel | 热力格/实体候选未实现 |
| `views/SettingsView.vue` | `/settings` | 🔴 PlaceholderPanel | Key 表单/掩码/连通测试未实现 |
| `components/PlaceholderPanel.vue` | 通用 | ✅ 占位组件 | 供骨架阶段统一展示，正式功能落地后逐页替换 |
| `styles/tokens.css` | 紫主题 | ✅ 已建 | 紫 token（--accent #6C5CE7 等）与侧边宽度约定保留 |

**前端完全缺失**：stores（状态管理）、组件库（Element Plus 未装）、各业务 api 模块、全局浮层组件（AssistantDrawer/MaterialModal/ConfirmModal/ExportConfirmModal，IA §5 列了 6 个）、空/加载/错误四态组件、编辑器五步子组件（IA §3 列了 10 个 step 内组件）。

## 五、资产三分类清单

### 5.1 已实现且应保留（有效资产）
1. 前后端工程化配置：`vite.config.ts`（别名 + `/api` 代理）、`tsconfig` strict、`package.json` 脚本、`.env.example`、`.gitignore`。
2. 后端装配骨架：app 插件注册顺序、统一响应/错误码枚举、归属判断辅助函数、Prisma 单例生命周期。
3. 前端路由表与主壳布局、紫主题 token、fetch 封装。
4. `schema.prisma` 七模型（详见 m2 报告，主体保留）。
5. Spike 脚本三件套（s1/s2/s3）与方案文档，作为技术验证模板。
6. `docs/` 全套产品/设计文档与原型截图，作为开发直接输入。

### 5.2 占位契约（位置正确，待填实现，不是废代码）
- 后端 auth/materials 的 501 路由（注释写明了 PRD 来源与行为）。
- 前端 7 个视图占位面板与路由守卫 TODO。
- 这些占位的价值是"接口/页面位置已对齐设计"，填充时按注释契约实现即可，无需重新规划结构。

### 5.3 完全缺口（排期要求但当前无代码）
- 账号与会话闭环、材料库业务、草稿五步工作流、模板匹配、导出服务、模型适配层、助手抽屉、实体表、备份、部署编排、测试基座。
- 初代 v0.1 业务内核（整理规则、引用校验、pptx 分页折行、原子写/乐观锁思路）**尚未迁入本仓库**，是 W1–W3 的实质工作量来源。

## 六、初代可复用内核移植差距（方案 §6.6 对照）

| 初代资产（方案声称可复用） | 新仓库现状 | 移植动作 |
| --- | --- | --- |
| domain.cjs 整理规则/期间计算/引用校验 | 未迁入 | 抽为 `server/src/services/` 纯函数，注入 userId 上下文，补单测 |
| ai.cjs 输出契约/错误分类 | 未迁入；错误码已在 result.ts 预留 | W4 扩为模型适配层校验器 |
| pptx.cjs 分页折行/母版渲染 | 仅 s2 单页脚本 | W3 扩展为多页分页 + 模板卡配色 |
| store.cjs 原子写/乐观锁 | 未迁入 | 改为 Prisma 事务 + `version` 乐观锁字段 |
| 前端四页交互与文案 | 重组为 Vue 组件进行中 | 沿用流程语义，不复用旧原生 JS 代码 |

> 注意：方案 §0"现在手里有什么"描述的是**初代旧项目**已跑通闭环；当前新仓库尚未把这些内核搬过来，评估时不能把初代能力算进新仓库完成度。

## 七、技术债与代码质量观察

| 项 | 观察 | 建议 | 级别 |
| --- | --- | --- | --- |
| 无自动化测试 | 业务测试文件为 0；无测试运行器依赖 | W2 前引入 node:test 或 vitest，先覆盖鉴权与隔离 | P1 |
| 守卫前后端都未接线 | 前端 beforeEach 无 `/me`；后端 requireAuth 占位 | W2 同步实现，以前端拦截为体验、服务端校验为准 | P1 |
| 全局错误处理过粗 | app.ts 兜底覆盖所有未处理错误 | 路由层先返回细分码，兜底只兜 500 | P2 |
| 占位文案直接面向用户 | AuthView 标题即"（占位）" | 正式实现前不进入对外演示；开发期可接受 | P2 |
| 依赖与文档不一致 | Element Plus/Pinia 缺依赖（见 m1/m2 报告） | W1 统一决策并更新 README | P1 |
| 无 lint/格式化配置 | package.json 无 eslint/prettier 脚本 | 可在 W2 补基础 ESLint，非阻塞 | P2 |
| 环境变量读取不一致风险 | health 用 MODEL_KEY；模型表为用户级 Key | 统一命名与来源（m1 P1-6、m2 R-10） | P1 |

## 八、改造路径与工作量粗估（单人，对照 8 周排期）

> 估算口径：按"从零填充到可演示"的开发+自测工时折算为周颗粒度；不含外部等待（Key/服务器/样本）。数字供排期对照，允许 ±30% 浮动。

| 阶段（排期周次） | 主要实现任务 | 代码落点 | 粗估工作量 | 风险点 |
| --- | --- | --- | --- | --- |
| W1 | 本地 PG + 首个迁移；Session 模型；组件库安装；规则纯函数抽离+单测；Spike 记录 | schema、services、tests、依赖 | 3–5 人日 | 本机 PG 环境；初代代码阅读整理 |
| W2 | 注册/登录/退出/me；会话中间件；材料 CRUD + 组合筛选 + 去重；校验层；隔离测试 | routes/auth、routes/materials、plugins/auth、services/validate | 6–9 人日 | 越权用例必须先有测试基座 |
| W3 | 草稿生成（本地规则）；编辑器基础编辑/排序/来源跳转；导出 pptx 多页；年度基础覆盖格；备份基础 | routes/drafts、services/rules、services/pptx、EditorView 骨架 | 7–10 人日 | 初代分页折行逻辑移植；导出实机验收 |
| W4 | 模型适配层 + Key 加密存储 + 外发确认 + 错误分类 + 失败回退 | adapters/llm、routes/model-keys、services/validate | 5–7 人日（无 Key 则只做接口与 mock 分类） | 依赖外部 Key；加密主密钥管理 |
| W5 | 助手抽屉；意图规则兜底 + LLM JSON 槽位；SSE 进度；≥3 选项 chips | AssistantDrawer、routes/assistant | 5–7 人日 | 无 SSE 经验外的编排复杂度需克制 |
| W6 | 模板卡数据与内置卡；匹配打分 Top3；三栏编辑器成型；逐页 HTML 预览；保存为新卡 | services/match、TplView、EditorView 五步子组件 | 7–10 人日 | 前端最重模块；建议先跑通主路径再美化 |
| W7 | 三类实体表与确认流；年度聚合视图；备份脚本；窄屏/空错态打磨 | routes/entities、YearView、deploy 脚本 | 5–7 人日 | 实体来源回溯一致性 |
| W8 | compose 编排；部署演练；README/架构图/演示脚本；面试问答 | deploy/、docs 更新 | 4–6 人日（依赖服务器到位） | 备案/服务器外部等待 |

**排期现实性提示**：合计净开发工时偏满，与 m1 报告判断一致；建议把"备份基础版、年度实体全三类、助手完整版"列为可砍降档项，优先保证 W3 本地闭环与 W6 编辑器主路径。

## 九、对"是否推倒重来"的代码意见

**不重写，保留现有骨架继续填。**

- 支持保留：工程配置正确、分层雏形合理、契约占位清晰、紫主题与路由已对齐设计文档；代码总量小（后端 8 文件、前端 14 文件），重写没有可回收的历史包袱，也没有必须清洗的坏代码。
- 不建议保留为"成品"的错觉：当前不可对外演示业务功能，下一步必须按 W2 顺序把占位逐条填实，不能停在骨架阶段宣称完成。
- 迁移注意：初代旧项目源码不在本仓库内，移植时应从只读旧源读取逻辑、在新仓库用 TS 重写为纯函数并配测试，而非直接复制 .cjs 文件进 TS 工程。

## 十、已验证 / 未验证 / 阻塞

- 已验证：前后端可安装依赖、可启动/可构建；health 可用；路由与视图清单完整盘点；占位与 PRD 接口对应关系成立。
- 未验证：任何写数据库的接口；登录会话；前端真实交互；导出多页效果；测试通过率（无测试可跑）。
- 阻塞：PG 环境与连接串；模型 Key；脱敏样本；服务器。
- 下一步建议（交组长排期）：W1 先补数据库迁移 + 测试基座 + 组件库定案，再进入 W2 账号与材料库实现。
