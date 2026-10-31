# 汇序 Pro（huixu_doubao）· 云端账号版 AI 汇报材料应用

个人材料库 + 模板卡片 + 可溯源汇报初稿的 Web 工作台。本期为 8 周 MVP：P0 月度汇报闭环全量 + 部分 P1（对话助手简化版、年度实体表轻量版）。

> 设计与产品文档不在本仓库，位于上层目录：`../`（方案 v1、PRD-01/02、IA 对照表、任务流说明、Spike 方案、高保真原型 `ui-design/console/index.html`）。本仓库只放可运行代码。

## 1. 技术选型（W1 拍板，无特殊偏好按此默认值，不再反复比较）

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 前端框架 | Vue 3 + TypeScript + Vite | 与简历技术栈一致；组合式 API |
| 前端路由 | Vue Router 4 | 路由表对照 `../IA站点地图-路由与数据对照表.md` |
| 前端组件库 | Element Plus | 表格/表单/抽屉等 B 端基础件，视觉主题再覆盖紫 token |
| 后端运行时 | Node 22 + TypeScript | 与前端同语言，降低切换成本 |
| 后端框架 | Fastify | 轻量、类型友好、插件生态清晰 |
| ORM | Prisma | schema 即建表来源，迁移命令 `prisma migrate dev` |
| 数据库 | PostgreSQL 15+ | 业务表强制 `user_id` 行级隔离 |
| 导出 | pptxgenjs@4.0.1 | 与初代同版本，便于移植分页折行逻辑 |
| 模型 | DeepSeek 兼容协议（预留，未确认 Key） | 非流式先通，SSE 为 W4 独立任务；不做 RAG/Agent/微调/多模型编排 |
| 部署 | Docker Compose（W8） | 前期本地开发，服务器到位再部署 |

## 2. 目录结构

```
huixu_doubao/
├─ web/                  # 前端 Vue3+TS+Vite
│  ├─ src/
│  │  ├─ views/         # 七个视图：Auth/Home/Mat/Editor/Tpl/Year/Settings
│  │  ├─ layouts/       # MainLayout 主壳（左导航 + 右主区）
│  │  ├─ router/        # 路由表 + 守卫占位
│  │  ├─ api/           # fetch 封装与接口模块
│  │  ├─ components/    # 可复用组件（步骤条、模板卡、来源条目等）
│  │  └─ styles/        # 紫主题 token
├─ server/              # 后端 Fastify+TS+Prisma
│  ├─ prisma/schema.prisma   # 六主表 + 导出留痕表
│  └─ src/
│     ├─ routes/        # auth / materials / drafts / templates / entities / model-keys
│     ├─ plugins/       # prisma 客户端、鉴权守卫、CORS/Cookie
│     ├─ services/      # 本地规则整理、模板打分、错误分类
│     └─ lib/           # 统一响应、错误码、版本/校验工具
└─ spikes/              # W1 技术 Spike 脚本（S1 模型 / S2 PPTX / S3 母版探针）
```

## 3. 本地启动（先装依赖，再分别起前后端）

前置：Node ≥ 22、npm ≥ 10。

```bash
# 后端（默认 3001）
cd server
npm install
npm run dev

# 前端（默认 5173，代理 /api 到 3001，见 vite.config.ts）
cd web
npm install
npm run dev
```

数据库：先在 `server/.env` 填 `DATABASE_URL`（参考 `.env.example`），再执行 `npx prisma migrate dev`；无数据库阶段后端健康检查 `/health` 可独立运行。

## 4. 核心数据流与边界

- 主线闭环：注册登录 → 材料入库 → 选范围生成大纲 → 三栏核对 → 模板卡片匹配 → 导出 PPTX（带来源角标）→ 草稿沉淀回库。
- 失败保护：AI 鉴权/限流/超时/坏 JSON 一律回退本地规则稿，不污染原稿、不自动重试收费调用；无 Key 时本地规则链路完整可用。
- 安全：Key 服务端加密、前端只见掩码、不进备份与日志；所有写接口强制 `user_id` 归属校验，越权统一 404。

## 5. 本期不做（防止范围膨胀，详见方案不做清单）

任意母版无损套版、自由无限画布、团队协作、会员支付、第三方登录、RAG/Agent/微调/多模型编排、小程序先行、Word/PDF/PPTX 解析、演讲稿自动生成。

## 6. 待外部条件（未到位不伪装完成）

- 模型测试 Key：Spike-S1 与 W4 模型适配层；
- 服务器信息与域名/备案：Spike-S4 与 W8 部署；
- 2–3 份脱敏真实 pptx：Spike-S3 母版填充探针；真实内部资料不得外发模型。
