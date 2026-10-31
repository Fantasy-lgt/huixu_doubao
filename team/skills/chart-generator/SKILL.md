---
version: "4.0.0"
name: chart-generator
label: 图表生成
icon: "https://lf3-static.bytednsdoc.com/obj/eden-cn/evithyeh7vibfuhpe/doubao_skill_icon_528/chart-generator.png"
description: "图表与数据可视化的落地技能，以妙搭网页为主。当页面/报告需要柱状图、折线图、饼图、趋势、占比、对比矩阵、关系图等可视化时使用：默认在妙搭网页里把图表作为 UI 的一部分、用设计系统内联实现；仅当交付物本身是飞书云文档时，才改走内置 beautiful-feishu-whiteboard 生成画板。本技能不自带绘图脚本。"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
---

# 图表生成 —— 图表首先是界面的一部分

**对 UI 设计师来说，图表不是外挂的东西，而是界面的组成部分。** 所以本技能的立场很明确：**默认在妙搭网页里把图表当 UI 来做**，用设计系统的色板/字体/间距内联实现，跟页面一起响应式、一起暗色、一起离线。只有一种例外——交付物本身是飞书云文档时，才用画板。

本技能只做"决定用哪条路 + 给出该路的硬要求"，不自带绘图脚本。

## 一条决策规则（先定载体，再谈图表）

| 交付载体 | 图表怎么做 | 何时 |
|---|---|---|
| **妙搭网页 / 原型 / dashboard（默认）** | 在页面内用 HTML/CSS/SVG **内联实现**，是 UI 的一部分 | 本专家的绝大多数场景 |
| **飞书云文档（唯一例外）** | 引导使用内置的 `beautiful-feishu-whiteboard` 技能生成**画板** | 且仅当用户明确要求交付飞书云文档时 |

> 两条路**不混用**：网页交付里不出现云文档画板，云文档里不塞网页截图。这样图表与交付载体始终连贯。

## 主路径 · 妙搭网页里的图表（默认，重点）

图表作为界面元素来设计，遵循 `../ui-design-methodology/references/miaoda-ui-showcase.md` 与 `../ui-design-methodology/references/design-methodology.md`：

1. **用设计系统上色**：配色取自页面 token（主色/辅助/中性/语义色），不另起一套；深浅用同色相明度变化。
2. **随页面自适应**：响应式断点下不溢出、可读；若页面支持暗色，图表同步适配。
3. **可读性达标**：坐标轴、刻度、图例、数值标签清晰；图形对象与背景对比 ≥ 3:1（见 accessibility-wcag.md），不靠颜色单独区分数据系列（辅以图案/标签/直接标注）。
4. **选对图表类型**：比较用柱状、趋势用折线、占比用饼/环（类别 ≤5）、分布用直方、关系用散点、构成随时间用堆叠面积；类别过多改用条形或表格。
5. **数据真实**：用真实数据；示例数据必须在页面 `## 数据来源与采用建议` 里标为"仅占位·勿据此决策"，并说明它只用于验证图表布局/视觉量级，不能作为业务判断依据。
6. **离线可用**：不引用外部 CDN / 字体，颜色、坐标、文本全部内联，可随 zip 导出（`ui-delivery-standard` 的 HS3）。

## 例外路径 · 飞书云文档里的画板

仅当交付物是飞书云文档时：加载内置 `beautiful-feishu-whiteboard` 技能，在云文档里生成画板。核心约束（完整四步命令流见 `../delivery-routing/references/lark-doc-delivery.md`）：

1. 画板只放 **5~7 条**核心信息（结论/关键数据/风险/建议），不复述正文结构。
2. 按 `design.md` 的色值组织画板视觉。
3. 生成后校验 `errors / warnings / textOverflow / nodeOverlap / textOcclusion` **全为 0**，不为 0 改一次重检。
4. 画板不代替正文；做不成时正文照常写完，并在文档开头写明"画板未生成，原因：具体到哪一步、什么报错"。

## 不做什么

- 不自带 `chart.py` / `chart.sh` 等绘图脚本，也不生成 ASCII 图表。
- 网页交付里不塞飞书画板；云文档里不用截图、mermaid 渲染图或普通 SVG 图片顶替画板。
