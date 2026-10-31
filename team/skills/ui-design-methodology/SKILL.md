---
version: "1.0.0"
name: ui-design-methodology
label: UI 设计方法论
icon: "https://lf3-static.bytednsdoc.com/obj/eden-cn/evithyeh7vibfuhpe/doubao_skill_icon_528/ui-design-methodology.png"
description: "UI 设计师的美感与设计方法论基线，以及在妙搭网页上如何把 UI 效果展示到位。当要做界面/组件/原型设计、定色板与字体、排版布局、评估设计美感，或要在妙搭网页上呈现多状态/真实交互/响应式/暗色/设计系统时使用。凡是涉及'怎么设计得更专业、更好看、更可评审'都先看本技能。数值阈值以 ui-delivery-standard 的无障碍参考为准。"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
---

# UI 设计方法论 —— 让设计既好看又讲得清"为什么"

这是本专家的**设计功力基线**：一半是"怎么设计得有美感"（载体无关），一半是"在妙搭网页上怎么把 UI 效果展示到位"（本专家默认载体）。做任何界面、组件、原型、可视化之前，先用这里的方法论定调，再动手。

一句话原则：**美感不是玄学，是可拆解、可复用、可讲清理由的一组规则。** 每个设计决策都能追溯到：用户目标 / 可用性 / 品牌调性 / 无障碍 中至少一条。

## 何时用

| 用 | 不用 |
|---|---|
| 做界面/组件/原型/落地页的视觉与交互设计 | 交付前的质量门与自测（→ `ui-delivery-standard`） |
| 定色板、字体阶梯、间距、圆角、动效参数 | 选产物形态/平台工具路由（→ `delivery-routing`） |
| 评估/复盘设计美感与可用性 | 纯前端代码落库（→ `doubao-coding-develop-frontend-features`） |
| 在妙搭网页上展示多状态/交互/响应式/暗色 | 品牌视觉大方向企划（→ `doubao-visual-creative`） |

## 两份方法论

| 关注点 | 文件 |
|---|---|
| **美感与设计方法论**（视觉层次、格式塔、色彩、字体、间距节奏、布局网格、一致性、留白、动效、需求→设计的转化） | `references/design-methodology.md` |
| **妙搭网页 UI 效果展示**（多状态同页、真实交互、375/768/1280 响应式实测、暗色、设计系统可见、情境化设备框、评审自检、图表内联口径） | `references/miaoda-ui-showcase.md` |

## 怎么用（配合其它技能）

1. **设计定调**：按 `design-methodology.md` 第 10 节问清目标用户/场景/任务/调性/约束，定风格关键词，翻译成具体参数。
2. **做设计**：按 `design-methodology.md` 的层次、色彩、字体、间距、动效规则落地；在妙搭网页上按 `miaoda-ui-showcase.md` 把效果展示到位。
3. **交付前**：把成品交给 `ui-delivery-standard` 过质量门与自测；产物形态/平台工具走 `delivery-routing`。

> 无障碍数值阈值（对比度/字号/触控/焦点）统一以 `skills/ui-delivery-standard/references/accessibility-wcag.md` 为准，本技能不另造标准。
