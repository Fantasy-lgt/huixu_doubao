---
name: beautiful-feishu-whiteboard
label: 飞书画板生成器
description: 使用 35 种精选配色风格（从克制到大胆）生成美观、可编辑的飞书画板（Whiteboard）。输入内容包括标题、主题和风格偏好（可直接命名风格或描述氛围），即可自动生成可视化画板并写入飞书云文档。支持风格切换。触发关键词：画板、whiteboard、飞书画板、可视化图解、架构图、思维导图。
---

# Beautiful Feishu Whiteboard

35 种精选配色风格，将内容转化为美观、可编辑的飞书画板。

## 前置检查（Preflight）

执行前验证环境：

```bash
bash ~/.aily/workspace/beautiful-feishu-whiteboard/scripts/preflight.sh
```

检查内容：
- Node.js 20+（whiteboard-cli 运行依赖）
- `@larksuite/whiteboard-cli` 可通过 npx 调用

**注意**：本环境使用 `larksuite-cli` 作为飞书 API 客户端（已内置配置），无需手动认证。

## 使用流程

### 1. 理解内容

确认用户想用画板呈现什么：
- **主题**：技术概念、流程说明、对比分析、架构图、产品介绍等
- **内容来源**：用户提供文字/链接、已有文档/对话、需要我搜索/分析
- **呈现目标**：知识讲解、方案对比、流程梳理、概念可视化

### 2. 选择风格

根据用户意图从 35 种风格中选择。阅读 [CATALOG.md](references/CATALOG.md) 获取完整风格列表。

**快速选择指南**：
- **严肃/专业/报告** → Restrained 风格（Avocado Press、Grove、Macchiato）
- **通用/平衡/日常** → Balanced 风格（Berry Pop、Riso Brut、Cobalt Bloom）
- **活泼/创意/演示** → Bold 风格（BlockFrame、Confetti Wedge、Crayon Stack）

用户指定风格名称或描述（如"简约蓝绿色调"、"活泼糖果色"）时，匹配最接近的风格。

### 3. 设计布局

阅读选定风格的 [design.md](assets/templates/<style>/design.md) 获取配色方案，然后：

1. **规划内容结构**：将内容拆解为可视觉化的模块（标题区、卡片、流程、对比、列表等）
2. **分配颜色角色**：
   - `Primary`：主背景/标题区/重点强调
   - `Secondary`：次强调/高亮/图标
   - `Background`：页面底色/卡片背景
   - `Text`：正文/标签文字
3. **布局原则**：使用飞书画板原生形状（rect、round_rect、ellipse、text_shape、connector），禁止渐变/透明度/滤镜

### 4. 构建 SVG

使用选定的配色，按以下结构编写 SVG：

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="<content-height>" viewBox="0 0 1640 <content-height>">
  <!-- 配色从 design.md 获取 -->
  <rect width="1640" height="<content-height>" fill="{Background}"/>
  
  <!-- 标题区 -->
  <rect x="0" y="0" width="1640" height="160" fill="{Primary}"/>
  <text x="60" y="72" font-size="38" fill="{Text on Primary}">{标题}</text>
  
  <!-- 内容区... -->
</svg>
```

### 5. 渲染与检查

使用 whiteboard-cli 渲染并检查缺陷：

```bash
# 渲染为 PNG 预览
npx @larksuite/whiteboard-cli@^0.2.11 \
  -i diagram.svg -o diagram.png -f svg

# 检查常见缺陷
npx @larksuite/whiteboard-cli@^0.2.11 \
  -i diagram.svg -f svg --check
```

**常见缺陷处理**：
- `invalid_opacity`：移除所有 `opacity` 属性（飞书画板不支持）
- `invalid_gradient`：改用纯色填充
- `polygon_arrow`：箭头改为 `<line>` + `marker-end`
- `text_color_mismatch`：确保 text 元素的 fill 与容器背景有足够对比度

### 6. 写入飞书

创建文档并写入画板：

```bash
# 1. 创建文档（包含空白画板块）
larksuite-cli docs +create \
  --api-version v2 \
  --content '<title>标题</title><whiteboard type="blank"></whiteboard>' \
  --doc-format markdown --as user

# 2. 获取 whiteboard-token（从文档编辑页面 URL 提取或查看文档块）

# 3. Dry-run 检查
npx @larksuite/whiteboard-cli@^0.2.11 -i diagram.svg --to openapi --format json 2>/dev/null | \
  larksuite-cli whiteboard +update \
    --whiteboard-token <token> \
    --source - --input_format raw \
    --idempotent-token <unique-id> \
    --overwrite --dry-run --as user

# 4. 正式写入
npx @larksuite/whiteboard-cli@^0.2.11 -i diagram.svg --to openapi --format json 2>/dev/null | \
  larksuite-cli whiteboard +update \
    --whiteboard-token <token> \
    --source - --input_format raw \
    --idempotent-token <unique-id> \
    --overwrite --as user
```

### 7. 交付

- **飞书文档链接**：可编辑的画板
- **导出图片**：供快速预览
- **提示风格切换**：用户可随时更换风格重新渲染

## 风格速查

35 种风格按克制程度分组：

### Restrained（克制）
| 风格 | 正式度 | 氛围 |
|------|--------|------|
| Avocado Press | 中 | 干净双色调，白底蓝绿 |
| Grove | 高 | 编辑感，羊皮纸配森林绿 |
| Macchiato | 高 | 温暖单色，杏仁色配咖啡 |
| Monochrome | 高 | 极简，文字优先 |
| Reading Room | 高 | 安静，文学感，学院风 |

### Balanced（平衡）
| 风格 | 正式度 | 氛围 |
|------|--------|------|
| Berry Pop | 中 | 果味清新，白底莓红配紫罗兰 |
| Riso Brut | 中 | 新野兽派编辑风，自信设计感 |
| Cobalt Bloom | 中 | 超大字体，时尚编辑风 |
| Checker Bloom | 低 | 活泼手绘，薄荷配蓝绿 |
| Soft Editorial | 中 | 温暖杂志风，柔和粉彩 |

### Bold（大胆）
| 风格 | 正式度 | 氛围 |
|------|--------|------|
| BlockFrame | 低 | 极繁主义，糖果色，贴纸风 |
| Confetti Wedge | 低 | 活泼轻快，庆典粉彩 |
| Crayon Stack | 低 | 原色蜡笔，明亮有趣 |
| Riso Brut | 中 | 新野兽派，自信设计感 |

完整列表见 [CATALOG.md](references/CATALOG.md)。

## 技术约束

阅读 [RULES.md](references/RULES.md) 了解飞书画板渲染器的完整限制：

- **仅原生形状**：rect、round_rect、ellipse、text_shape、connector
- **无透明度**：`fill_opacity` 必须为 100 或省略
- **无渐变/模糊/滤镜**：纯色填充
- **文本颜色导出异常**：设置 text 元素的 `fill` 可能导出后变色，需测试验证
- **Z-index**：后定义的元素在上层
- **尺寸限制**：单张画板高度建议不超过 3000px，宽度固定 1640px

## 示例对话

**用户**：「用 Berry Pop 风格给我做个画板，讲解 Transformer 架构」
→ 读取 Berry Pop design.md → 设计布局（标题区、Self-Attention、FFN、整体架构图）→ SVG → 飞书文档

**用户**：「帮我把这篇文档做成可视化画板」
→ 获取文档内容 → 提取要点 → 推荐 Balanced 风格（如 Riso Brut）→ 生成画板

**用户**：「可以换成更活泼的风格吗？」
→ 切换到 Bold 风格（如 BlockFrame）→ 保持内容结构 → 重新渲染

## 切换风格

用户要求切换风格时：
1. 保持原有内容结构和布局逻辑
2. 读取新风格的 design.md 获取配色
3. 替换所有颜色值
4. 重新渲染并写入（覆盖或新建文档）

不需要重新设计布局，仅需颜色替换。
