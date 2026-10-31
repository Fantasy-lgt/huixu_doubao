---
version: "1.0.0"
name: delivery-routing
label: 交付路由与平台集成
icon: "https://lf3-static.bytednsdoc.com/obj/eden-cn/evithyeh7vibfuhpe/doubao_skill_icon_528/delivery-routing.png"
description: "决定'产物用什么形态交付、走哪个平台能力'的路由技能。当要判断做成妙搭网页还是飞书云文档、选 arch_type、附数据来源与采用建议、写飞书云文档结构与画板、或对齐运行时工具映射（web-search/aily-generate-image/lark-cli 等）与飞书权限红线时使用。AGENTS.md 的交付硬规则在此展开为可执行细则。"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
---

# 交付路由与平台集成 —— 产物走哪条路的细则

`AGENTS.md` 里定了交付的**顶层硬规则**（何时网页、何时云文档、最终回复门禁）；本技能把这些规则**展开成可执行细则**，并统一运行时工具与平台集成口径。冲突时以 `AGENTS.md` 顶层硬规则为准。

一句话原则：**先定交付载体，再谈内容**；工具名不是可自由互换的别名，只调用运行时实际提供且匹配的能力，未提供按失败/降级处理，不臆造工具或成功状态。

## 三份细则

| 关注点 | 文件 |
|---|---|
| **交付路由细则**：`构建网页应用` 分支要点、`fact_ledger`、`## 数据来源与采用建议`末尾表格、`arch_type`（html/jspage/fullstack）参数约束 | `references/delivery-routing.md` |
| **飞书云文档交付**：仅当用户明确要云文档时的正文结构与画板四步命令流（配合内置 `beautiful-feishu-whiteboard`） | `references/lark-doc-delivery.md` |
| **平台集成**：运行时工具映射表、`doubao-visual-creative` 载体覆盖声明、飞书集成权限与硬性红线 | `references/platform-integration.md` |

## 怎么用

1. 判断产物形态：默认妙搭网页（`arch_type=html`）；只有用户明确要飞书云文档才走云文档分支——细则见 `references/delivery-routing.md`。
2. 网页/云文档都要在末尾附 `## 数据来源与采用建议`（真实内容填充，非占位；按内容给出"可直接使用 / 需你确认后使用 / 仅占位·勿据此决策"，不再给单一总体等级）——见 `references/delivery-routing.md`。
3. 云文档必须带一张真画板，按 `references/lark-doc-delivery.md` 的四步生成并校验（errors/warnings/overflow 全为 0）。
4. 调用任何工具前，先按 `references/platform-integration.md` 对齐当前运行时实际提供的能力名与权限红线。

> 图表可视化的落地（网页内联 vs 云文档画板）走 `chart-generator`；设计美感与妙搭展示走 `ui-design-methodology`；交付前质量门走 `ui-delivery-standard`。
