# IA 站点地图 · 路由与数据对照表（前端搭骨架直接输入）

版本：v1.0 ｜ 阶段：🧪 Design ｜ 对应 PRCSS 任务「Information Architecture 站点地图」
配套可视化：`IA站点地图.html`（同目录，紫主题离线单文件）
技术栈口径：前端 Vue3 + TS + Vite + Vue Router；后端 Node + TS + ORM；PostgreSQL 15；接口沿用 REST 草案，服务端为权威。

> 用途：本表直接作为 W1 前端路由骨架（`router/index.ts`）与页面组件清单的输入。每行 = 一个路由/页面，含路由 path、组件、鉴权、主要接口、主数据表。所有业务表强制 `user_id` 归属（PRD-01 4.2）。

---

## 1. 顶层信息架构（一句话）

未登录只看登录页；登录后进入「左侧导航 + 右侧主区」主壳，主壳六个一级模块；AI 助手是全局右侧抽屉（不占路由）；新建材料/新建草稿/导出确认/删除确认等是全局模态层（不占路由）。替代初代「部门」字段的新维度是：`期间 period` + `场合 occasion` + `材料类型 materialType`。

```
公开区（requiresAuth = false）
└─ 登录 / 注册

主壳 Layout（requiresAuth = true，守卫先 GET /me）
├─ 工作台 /
├─ 材料库 /materials
├─ 草稿编辑 /editor/:draftId?        （内部五步，非独立路由）
├─ 模板库 /templates
├─ 年度回顾 /year
└─ 设置 /settings

全局层（不占路由）
├─ AI 助手抽屉 AssistantDrawer
├─ 新建草稿弹窗 NewDraftModal
├─ 材料新建/编辑弹窗 MaterialModal
├─ 删除/导出二次确认 ConfirmModal
└─ 导出确认弹窗 ExportConfirmModal
```

---

## 2. Vue Router 路由表（直接落 `router/index.ts`）

### 2.1 公开路由

| path | name | 组件 | meta | 说明 / 主要接口 |
| --- | --- | --- | --- | --- |
| `/login` | `auth` | `views/auth/AuthView.vue` | `{ public: true, layout: 'blank' }` | 登录/注册切换；`POST /auth/login`、`POST /auth/register`；注册成功自动登录跳 `/` |
| `/logout` | `logout` | 无视图（守卫动作） | `{ public: true }` | `POST /auth/logout` 后跳 `/login` |

### 2.2 主壳路由（父路由 `MainLayout.vue`，子路由渲染于主区）

父路由：`/` → `layouts/MainLayout.vue`；`meta.requiresAuth = true`；`meta.title` 供面包屑与导航高亮。

| path | name | 组件 | 面包屑标题 | 主要接口 | 主数据表 |
| --- | --- | --- | --- | --- | --- |
| `/` | `home` | `views/home/HomeView.vue` | 工作台 | `GET /me`；`GET /drafts?kind=drafting`；`GET /materials/summary` | drafts、materials |
| `/materials` | `materials` | `views/material/MaterialListView.vue` | 材料库 | `GET /materials?type&tag&period&keyword`；`GET /materials/tags` | materials |
| `/materials/new` | `material-new`（弹窗承载，可选路由备份） | `MaterialFormModal` | — | `POST /materials` | materials |
| `/materials/:id` | `material-detail`（详情抽屉/弹窗） | `MaterialDetailModal` | — | `GET /materials/:id`；`PUT /materials/:id`；`DELETE /materials/:id` | materials |
| `/editor/:draftId?` | `editor` | `views/editor/EditorView.vue` | 草稿编辑 · `草稿/{标题}` | `GET /drafts/:id`；`POST /drafts`；`PUT /drafts/:id`；`GET /materials`（圈选）；`POST /drafts/generate`（规则/AI）；`POST /templates/match`；`POST /exports/pptx`（W3 落地，本期占位） | drafts、materials、template_cards |
| `/templates` | `templates` | `views/tpl/TemplateListView.vue` | 模板库 | `GET /templates?scene=`；`POST /templates/match`（按大纲打分）；`POST /templates`（仅元数据卡） | template_cards（系统内置 user_id=NULL + 个人卡） |
| `/year` | `year` | `views/year/YearView.vue` | 年度回顾 | `GET /year/overview?year=`；`GET /entities?year=`；`POST /entities/:id/confirm`；`GET /year/export`（清单占位） | materials（聚合）、entities |
| `/settings` | `settings` | `views/settings/SettingsView.vue` | 设置 / 模型 Key | `GET /me`；`GET /model-keys`；`POST /model-keys/test`；`POST /model-keys`；`DELETE /model-keys/:id`；`GET /backup/export`；`POST /backup/import` | users、model_keys |

### 2.3 重定向与兜底

| 规则 | 行为 |
| --- | --- |
| 未登录访问任意 `requiresAuth` 路由 | 重定向 `/login?redirect=<原path>`，登录成功回跳 |
| 已登录访问 `/login` | 重定向 `/` |
| 未知 path | 重定向 `/`（404 极简页本期可选，不专门设计） |
| `/editor/:draftId` 归属校验失败（404） | 提示「草稿不存在或无权访问」并回 `/`，不白屏 |

---

## 3. 编辑器五步与路由 / 数据映射（编辑器是单路由内的状态机，不拆五个 URL）

编辑器组件内部用 `step` 状态（1–5）切换面板，对应 `renderStep(n)`；前进/回退只改本地状态，草稿整体存于 `drafts` 表。

| 步骤 | 面板组件（内部） | 读写数据 | 主要接口（草案） | 进入下一步前置条件 |
| --- | --- | --- | --- | --- |
| ① 准备材料 | `EditorStepRange` + `EditorStepSources` | materials 子集圈选；drafts.rangeFilter | `GET /materials?period&type&occasion`；`PUT /drafts/:id`（rangeFilter + sourceRefs） | 至少勾选 1 份材料 |
| ② 大纲确认 | `EditorStepOutline` | drafts.sections（章节+要点数） | `POST /drafts/generate`（规则整理优先，AI 可选）；`PUT /drafts/:id` | 至少 1 个章节；章节名称非空 |
| ③ 逐页核对 | `EditorStepCheck`（三栏） | drafts.sections[].items[]（sourceIds、evidence）；materials 原文 | `PUT /drafts/:id`（条目改/排序/删除）；`POST /drafts/confirm` | 阻塞项（warn）允许带提示前进，但导出前须处理 |
| ④ 模板匹配 | `EditorStepMatch` | template_cards；drafts 大纲需求向量/标签 | `POST /templates/match {pageRequirement}` 返回 Top3；`PUT /drafts/:id {templateCardId}` | 选中 1 张卡（无适配可存新元数据卡） |
| ⑤ 导出 PPTX | `EditorStepExport` | drafts 定稿；template_cards；export_jobs（预留） | `POST /exports/pptx {draftId, scope, templateId, fileName}` | 检查清单非阻塞项清零或用户确认忽略；本期为下载占位，W3 接 pptxgenjs |

> 说明：步骤 ①–⑤ 不各自建 URL，便于刷新续编时整体恢复草稿；`draftId` 落在路由参数即可。

---

## 4. 页面 × 数据表归属矩阵

| 页面 / 路由 | users | sessions | materials | drafts | template_cards | entities | model_keys | export_jobs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` `/logout` | 读写（注册/校验） | 读写（种/毁 Cookie） | — | — | — | — | — | — |
| `/` 工作台 | 读（GET /me） | — | 读（摘要统计） | 读（草稿列表） | 读（推荐位） | — | — | — |
| `/materials` | — | — | 读写删（全操作） | 读（失效联动提示） | — | — | — | — |
| `/editor/:draftId?` | — | — | 读（依据/原文跳转） | 读写（核心） | 读写（选用记录） | — | 读（模式标识：本地/AI） | 写（任务记录，预留） |
| `/templates` | — | — | — | 读（当前大纲需求入参） | 读写（内置只读 + 个人元数据卡） | — | — | — |
| `/year` | — | — | 读（按 period 确定性聚合） | 读（年度 kind 草稿） | — | 读写（候选→确认入库） | — | 读（导出清单占位） |
| `/settings` | 读（/me） | — | — | — | — | — | 读写（加密 Key、连通测试） | — |

隔离规则：除 `users / sessions / 系统内置 template_cards(user_id=NULL)` 外，其余表行级带 `user_id`；服务端查询强制作用域，越权统一 404（PRD-01 4.2）。

---

## 5. 全局浮层 / 模态清单（非路由组件，前端骨架同样要先建占位组件）

| 组件 | 触发页面 | 作用 | 数据/接口 | 关闭与回退 |
| --- | --- | --- | --- | --- |
| `AssistantDrawer` AI 助手抽屉 | 全部主壳页（右侧滑出） | 意图识别 + 槽位追问 + 白名单动作（查询/生成草稿），不删除、不直接外发导出 | `POST /assistant/chat`（规则兜底；AI 可选） | 关闭不离开当前页；动作只产生草稿或查询结果 |
| `NewDraftModal` 新建稿 | 工作台、材料库 | 选类型（月度/年度/自由）、期间、场合，进入 `/editor/:draftId` | `POST /drafts` 建空草稿后跳转 | 取消不建记录 |
| `MaterialModal` 材料新建/编辑 | 材料库、编辑器步骤① | 粘贴 / 上传 txt/md；校验与去重 | `POST/PUT /materials`；409 `MATERIAL_DUPLICATE` | 校验失败保留表单 |
| `MaterialDetailModal` 材料详情 | 材料库、编辑器左栏「跳转原文」 | 只读原文 + 元信息；可「用此材料生成汇报」预选圈选 | `GET /materials/:id` | 返回保留筛选状态 |
| `ConfirmModal` 二次确认 | 材料删除、草稿删除、Key 删除 | 明示影响（引用草稿失效等）后才执行 | 对应 DELETE | 取消无副作用 |
| `ExportConfirmModal` 导出确认（AI 外发） | 编辑器步骤⑤、助手触发生成 | 外发材料份数/清单明示确认（仅 AI 生成时） | 复用导出接口 | 取消则不发起收费调用 |

---

## 6. 路由守卫与状态兜底（骨架阶段就要预留的空/错态）

1. **守卫**：`beforeEach` 中 `requiresAuth` 路由先 `GET /me`；401 → 清前端态 → `/login?redirect=`；其余业务接口 401 统一 toast「登录已过期，请重新登录」。
2. **四态**（每个列表/详情页预留组件位）：`data` 有数据 / `empty` 空态（带新建或筛选清空入口）/ `loading` 骨架屏 / `error` 错误重试。
3. **禁用条件**：编辑器「下一步/导出」随步骤前置条件禁用；材料未圈选、章节为空、检查清单阻塞项存在时主按钮置灰并给提示文案。
4. **失败不丢稿**：生成/导出异常保留 `drafts.version` 与 `confirmedVersion`，提示重试或切回本地规则，不自动重试收费调用。

---

## 7. IA 明确不收录（本期不建页面/不建路由，防止骨架膨胀）

- 找回密码、邮箱验证、第三方登录、账号注销（仅数据层预留）。
- 团队/多人协作、分享链接、角色权限。
- 文件夹层级、材料版本对比、收藏置顶、材料导出为文件。
- 真实母版无损填充编辑台、自由画布、演讲稿生成。
- 会员支付页、付费水印配置（`users.plan` 与水印字段仅预留，无独立路由）。
- 小程序 / 桌面端页面（后置，不在 Web 路由表）。
- Word/PDF/PPTX 解析上传入口（类型枚举与上传提示中明确不支持）。

---

## 8. 与既有产物对照

- 高保真成品：`ui-design/console/index.html`（6 个 `data-view` + 登录屏；视图名与本表组件一一对应：home/mat/editor/tpl/year/settings）。
- 低保真线框：`线框图-核心8页-v1.html`（P1 登录、P2 工作台、P3 材料库、P4 编辑器五步、P5 助手抽屉、P6 模板库、P7 年度、P8 设置）。
- 接口合同：PRD-01（auth/users/sessions）、PRD-02（materials）；drafts/templates/entities/model_keys/exports 接口为草案，W1 定稿时补错误码表。
