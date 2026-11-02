# 06 · W2 前端最小联调走查报告（m3 前端方向）

日期：2026-11-02。范围：把已推送后端（Cookie 会话 + 材料 CRUD/校验/指纹去重/越权 404）接到 TDesign Vue3 骨架，完成登录注册、材料列表筛选/新建/详情只读/删除确认、路由守卫与顶栏退出。不做上传、分页、编辑表单、W3 草稿、AI、模板匹配、年度视图。

## 一、本轮改动清单（绝对路径）

### 前端 web/
- 改写 `D:\学习ai应用开发\huixu\web\src\api\http.ts`：`credentials:'include'`；统一 `/api` 前缀；fetch reject 归一 `NETWORK_ERROR`（提示“网络异常，请稍后重试”）；非 JSON 响应按状态码兜底；401 触发可注入 `setUnauthorizedHandler` 后抛 `RequestError('UNAUTHENTICATED', ..., 401)`。
- 新增 `D:\学习ai应用开发\huixu\web\src\api\auth.ts`：`AuthUser`（id/email/emailPrefix/plan/createdAt）、register/login/logout/me 类型化方法。
- 新增 `D:\学习ai应用开发\huixu\web\src\api\materials.ts`：`Material`、`MaterialUpsertPayload`、`MaterialQuery` 类型；list/create/getById/update/remove；查询参数仅携带非空值。
- 改写 `D:\学习ai应用开发\huixu\web\src\stores\auth.ts`：state（currentUser/loading/error/initialized）、`isLoggedIn` computed；fetchMe 401/网络失败静默置 null；login/register 成功写用户；logout 调后端后清态；`clearLocal()` 供 401 拦截器只清前端态。
- 改写 `D:\学习ai应用开发\huixu\web\src\stores\materials.ts`：list/loading/error/selected/filters；fetchList/create/getById/update/remove；操作成功后刷新列表；resetFilters。
- 改写 `D:\学习ai应用开发\huixu\web\src\router\index.ts`：beforeEach async 守卫；requiresAuth 且未 initialized 先 fetchMe；未登录带 redirect 跳 `/login`；已登录访问 `/login` 跳 `/`；title 逻辑保留。
- 改写 `D:\学习ai应用开发\huixu\web\src\main.ts`：Pinia→router→TDesign 装配顺序不变；Pinia 安装后注入 401 处理器（clearLocal + 仅业务壳路由跳转）。
- 改写 `D:\学习ai应用开发\huixu\web\src\views\AuthView.vue`：登录/注册切换、前端预校验、错误码映射、提交 loading 禁用、redirect 仅允许 `/` 开头内部路径。
- 改写 `D:\学习ai应用开发\huixu\web\src\views\MatView.vue`：筛选条、八类型色标卡片、新建对话框（标签动态增删、正文 x/20000）、只读详情对话框、删除二次确认弹窗、加载/错误重试/空态三态。
- 改写 `D:\学习ai应用开发\huixu\web\src\layouts\MainLayout.vue`：顶栏右侧 emailPrefix 徽标 + 退出按钮；问助手按钮置灰（W5 接入）。
- 未改动：Home/Tpl/Year/Editor/Settings 占位视图、stores/index.ts（导出名 CurrentUser/MaterialItem/MaterialFilters 保持兼容）、样式 token、vite 配置、其他 store。

### 后端（仅允许的最小响应形状修复，无 schema/迁移改动）
- `D:\学习ai应用开发\huixu\server\src\services\material.service.ts`：listMaterials 的 select 补 `body: true`（卡片正文预览依赖）。
- `D:\学习ai应用开发\huixu\server\test\materials.api.test.ts`：新增 1 例“列表项携带 body 且为字符串”断言；其余用例不动。

## 二、自动化验证结果（实跑证据）

### web `npm run build`（vue-tsc -b && vite build）
- 退出码：0。
- 摘要：✓ 3864 modules transformed；✓ built in 14.64s；产物含 MatView-ABOAC9PSR.js 11.19 kB（gzip 4.68 kB）、AuthView-BF_sz9Zx.js 3.36 kB（gzip 1.79 kB）。仅存在 chunk >500 kB 体积提示（TDesign 全量注册所致，历史既有警告，非类型/编译错误）。
- vue-tsc strict 无报错。

### server `npm test`（tsx --test test/*.test.ts）
- `# tests 51 / # pass 51 / # fail 0 / # cancelled 0 / # skipped 0`。
- `npm run build`（tsc -p tsconfig.json）退出码 0。
- 新增后端列表 body 断言 1 例；既有 50 例全部保持绿。

### 静态自查
- `web/src` grep：无 `localStorage` / `sessionStorage` 调用；`passwordHash` 仅出现在“响应不含 passwordHash”的注释中；无 `sk-`/Bearer/secret 等硬编码密钥；无 `127.0.0.1`/`http://` 写死地址（请求统一相对 `/api`，代理由 vite.config.ts 指向 3001）。
- 凭证只经 HttpOnly Cookie（`sid`）承载，前端 JS 不可读。

## 三、PRD 验收逐条走查（编号原文取自 PRD-01 §7 / PRD-02 §7）

覆盖标记说明：【后端自动化】= server/test 现有用例已断言；【前端人工】= 需浏览器点验，本轮未实机点击（见第五节未验证项）。

### PRD-01 账号与数据隔离

| 编号 | 手动点验步骤 | 预期 | 覆盖归属 |
| --- | --- | --- | --- |
| A-OK1 | `/login` 切注册页；填新邮箱、合规密码（字母+数字、8–72 位）、确认密码一致；提交 | 注册成功自动登录、进入工作台；顶栏出现 emailPrefix；后端 users 落库且 passwordHash 为 `$argon2id$` 前缀、响应体无哈希 | 落库/哈希/响应字段【后端自动化】（auth.api.test.ts 注册用例）；自动跳转与顶栏展示【前端人工】 |
| A-OK2 | 退出后用已注册邮箱+正确密码登录 | 登录成功；DevTools Application 可见 HttpOnly `sid` Cookie；登录后 `GET /me` 返回白名单五字段；顶栏显示用户前缀 | Cookie 种植与 `/me` 白名单【后端自动化】；前端守卫 fetchMe 渲染顶栏【前端人工】 |
| A-OK4 | 登录后点退出；再点浏览器后退、刷新 `/materials` | 回到登录页，不下发业务材料数据；后退不进入业务壳 | 前端守卫（未登录跳 `/login`）【前端人工】；无对应后端自动化（前端流程） |
| A-F1 | 前端：邮箱填 `abc`、密码 `123`、注册确认密码不一致；绕过前端直调接口 | 前端字段级红字先拦截；服务端同样 400 VALIDATION_FAILED | 前端拦截【前端人工】；服务端 400 矩阵【后端自动化】（auth.api.test.ts 非法入参用例） |
| A-F2 | 用已注册邮箱再次提交注册 | 409；前端文案“该邮箱已注册，可直接登录”；不产生重复记录 | 409 EMAIL_TAKEN【后端自动化】；前端文案映射【前端人工】 |
| A-F3 | 分别用错误密码、不存在邮箱登录 | 两者同为 401，文案统一“邮箱或密码不正确”，不暴露账号是否存在 | 【后端自动化】（两条 401 同 code 同 message）；前端映射同文案【前端人工】 |
| A-F4 | 未登录直接访问 `/materials`；再直调 `GET /api/materials` | 前端守卫跳 `/login?redirect=/materials`；接口返回 401，响应体无业务数据 | 接口 401【后端自动化】（auth.api.test.ts 未登录访问 materials 用例）；前端跳转【前端人工】 |

补充关联项（任务书点名范围外但本轮顺带核对）：A-OK3 刷新保持登录态 = 守卫 fetchMe 机制【前端人工】；A-F5 越权换 ID = 【后端自动化】（materials.api.test.ts 两用户隔离用例，B 对 A 的读/改/删全 404）。

### PRD-02 材料库

| 编号 | 手动点验步骤 | 预期 | 覆盖归属 |
| --- | --- | --- | --- |
| M-OK1 | `/materials` 点新建材料；选类型、打 2 个去重标签、填月份（如 2026-10）、粘贴两段正文保存 | 列表出现新卡片；类型色标、标题、期间、场合、来源名、更新时间、正文字数（body.length）显示正确；标签去重 | 落库字段/标签去重/来源名缺省/version=1【后端自动化】（materials.api.test.ts M-OK1）；卡片元信息与字数展示【前端人工】 |
| M-F1 | 新建时标题留空、正文留空；正文粘贴超 20000 字提交 | 前端先拦截标题/正文为空；超长返回 400 VALIDATION_FAILED 明确提示；对话框不关闭、表单内容保留 | 后端长度/必填校验【后端自动化】；前端表单保留与提示【前端人工】 |
| M-F3 | 同一用户、同期间、粘贴与已有材料相同正文再次保存 | 409 MATERIAL_DUPLICATE；前端弹窗“内容与已有材料重复（同期间正文一致）”；列表不新增 | 指纹去重（标题不同仍判重、换 period 不判重、改标题不改内容仍 409）【后端自动化】；前端 409 文案【前端人工】 |
| M-F5 | 用户 B 登录后，直接把地址/请求指向用户 A 的材料 id 做 GET/PUT/DELETE | 全部 404 NOT_FOUND，无任何 A 的数据返回 | 【后端自动化】（两用户隔离用例覆盖读/改/删 404）；前端列表互不可见【前端人工】 |
| M-F6 | 提交非法月份（2026-13）、非法 materialType 值 | 400 VALIDATION_FAILED 拒绝；前端类型下拉只给八个合法 code，月份输入带 YYYY-MM 预校验 | 服务端枚举/月份校验【后端自动化】；前端下拉与预校验【前端人工】 |
| M-F7 | 输入无命中关键词查询 | 显示“还没有匹配的材料”空态 + 新建入口，不报错不白屏；后端空列表返回 `[]`（200） | 空数组响应【后端自动化】；空态 UI 与新建入口【前端人工】 |

补充人工项：M-OK3 类型+期间+关键词组合交集筛选、“重置筛选”恢复全量【前端人工】（后端 list 查询条件已由隔离/筛选类用例间接覆盖查询分支）。

## 四、前端类型 ↔ 后端响应对齐

| 前端类型（位置） | 后端响应字段 | 对齐说明 |
| --- | --- | --- |
| `AuthUser`（api/auth.ts） | register/login/logout 后的 `data` | id、email、emailPrefix、plan、createdAt；不含 passwordHash |
| `Material`（api/materials.ts） | `GET /materials` 列表项 / `GET /materials/:id` / POST/PUT 返回 | title、materialType、tags[]、period(nullable)、occasion(nullable)、body、sourceName(nullable)、version、createdAt、updatedAt；列表本轮补回 body 供预览 |
| `MaterialUpsertPayload` | POST/PUT 请求体 | title/materialType/tags/period/occasion/body；sourceName 缺省由后端补“手工录入”；period 空传 null |
| `MaterialQuery` | GET query string | materialType/period/tag/keyword 均可选，空串不拼参 |
| 错误处理 | `{error:{code,message}}` | 前端 RequestError.code 按码映射文案；401 仅按 HTTP 状态触发清态跳转（错误码名 UNAUTHENTICATED，未改名） |

materialType 八 code 与中文标签映射在 MatView `TYPE_META`；occasion 七值下拉 `OCCASIONS`（可空），与 `server/src/validators/material.validator.ts` 白名单一致。

## 五、已验证 / 未验证 / 阻塞 / 待确认 / 推迟

### 已验证（有命令或代码证据）
- web `npm run build` 退出 0，vue-tsc strict 无类型错误，构建摘要见第二节。
- server `npm test` 51 pass / 0 fail；server `npm run build` 退出 0。
- 后端最小缺口（列表缺 body）已修复并补 1 例断言；未改动鉴权/去重/校验规则，未改 schema、未跑迁移。
- 前端无凭证落 localStorage/sessionStorage，无硬编码密钥与写死后端地址。

### 未验证（本轮未实跑，勿视为通过）
- 浏览器 dev server 实机点击全流程（注册→登录→新建→筛选→详情→删除→退出→换号互不可见）：本轮只做了类型构建与后端自动化，未起 `npm run dev` 手工走查；上述表中【前端人工】行需组长/产品在 127.0.0.1:5173 + 后端 3001 同时在线时点验。
- Cookie 实际种植属性（HttpOnly/SameSite=Lax/maxAge=7d、本地 http 下 Secure=false）未在浏览器 DevTools 目视确认（后端代码已实现，测试覆盖接口行为）。
- `npm audit` 未执行。
- 前端 chunk 体积提示（TDesign 全量注册，主包 gzip 385 kB）未做代码分割优化，本轮不在范围。

### 阻塞
- 无。后端 PG 在线、argon2 预编译可用；构建与测试均通过。

### 待确认
- 真实浏览器联调时若代理/Cookie 跨端口行为异常（5173→3001），以 DevTools Network 为准再调；当前实现已 `credentials:'include'`。
- 超长正文字段级提示：后端统一返回 400 VALIDATION_FAILED + message，前端新建对话框汇总展示，未做逐字段红字（PRD M-F1 要求“表单内容保留”已满足：对话框不关闭）。

### 推迟项（本轮明确不做，登记留痕）
- 草稿联动（删除材料时 confirmedVersion 清空 / 关联草稿失效标记）推迟 W3：删除确认弹窗已含“引用该材料的草稿将失效”文案，但草稿表与接口本轮未实现，实际联动待 W3。
- 材料编辑表单（PUT 的 UI 入口）本轮未做；store.update 方法保留可用。
- TXT/MD 上传解析与 fileRef（M-OK2）、docx/pdf 拒绝入口（M-F2）、分页、标签高级选择器、AI 助手抽屉、模板匹配、年度视图、模型 Key 设置页，均属后续周次。
