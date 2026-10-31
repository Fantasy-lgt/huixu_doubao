# design.md 设计规范模板（HS5 / 工程化交付）

问题列表第 2、9 条落地：**必须实际交付 `design.md`，含可落地参数，不能只给预览链接或静态图。**
`selfcheck.py` 会检查 design.md 是否存在（SPEC-01）以及 色值/字体/间距/断点 四类参数是否齐全（SPEC-02）。

把下面模板复制为交付目录下的 `design.md` 并填成真实值（不是占位）。

---

## 1. 色值 Design Token

| Token | 值 | 用途 |
|---|---|---|
| `--color-primary` | `#2563EB` | 主色/主按钮 |
| `--color-primary-hover` | `#1D4ED8` | 主色悬停 |
| `--color-text` | `#111827` | 正文（与白底对比 ≈16:1 ✅） |
| `--color-text-muted` | `#6B7280` | 次要文字（对比≥4.5:1 ✅） |
| `--color-bg` / `--color-surface` | `#FFFFFF` / `#F9FAFB` | 背景/卡片 |
| `--color-border` | `#E5E7EB` | 分隔线（非文本对比≥3:1） |
| `--color-success/warning/danger` | `#16A34A/#D97706/#DC2626` | 语义色 |

- 暗色模式（若支持）：给出对应 dark token 表。
- 每个前景/背景组合标注对比比值，确保达 accessibility-wcag.md 阈值。

## 2. 字体与类型阶梯

- 字体栈：`-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
- 单位统一 **px/rem，不用 pt**。

| 层级 | 字号 | 字重 | 行高 |
|---|---|---|---|
| Display | 32px | 700 | 1.25 |
| H1 / H2 | 24 / 20px | 700 / 600 | 1.3 |
| Body | 16px | 400 | 1.5 |
| Caption | 14px | 400 | 1.4 |

（移动端正文≥16px 更稳）

## 3. 间距与栅格

- 基准 **8px 栅格**（间距取 4/8/12/16/24/32…；4px 用于图标/紧凑处）——8pt grid 是主流约定，非强制标准，团队统一即可。
- 容器最大宽、内边距、卡片圆角/阴影 token 化列出。

## 4. 断点（响应式）

| 断点 | 范围 | 布局要点 |
|---|---|---|
| Mobile | ≤767px | 单列；导航收为汉堡菜单；触控目标≥44pt |
| Tablet | 768–1023px | 两列/自适应网格 |
| Desktop | ≥1024px | 多列；容器最大宽如 1200px |

## 5. 组件状态枚举

每个交互组件列全状态：`default / hover / focus(焦点环≥3:1) / active / disabled / loading / error`。

## 6. B 端专属（若为 B 端）

- **业务语义映射**：把颜色/图标/状态映射到业务含义（如 红=风险、黄=待处理），不止是视觉。
- **密度切换**：紧凑/标准/舒适三档的行高与内边距参数。
- 数据表格：排序/筛选/分页/空态/超长文本处理规则。

---

交付说明里引用 design.md，不要把这些参数只截图。参数齐全 + 与实现一致，SPEC 门才通过。
