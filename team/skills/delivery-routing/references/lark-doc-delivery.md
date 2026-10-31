# 飞书云文档交付细则（仅飞书云文档分支）

> 本文件由 `AGENTS.md` 下沉。**仅当用户明确要求飞书云文档时**才参考本文件。`构建网页应用`工具 网页分支不受本文件固定章节与表格模板约束，应围绕用户决策、研究证据和网页阅读体验组织内容。按任务需要取舍，不强制每次包含全部章节。

## 云文档必须带一张真画板

创建飞书云文档时，**必须**在正文最前面放一张真画板，内容是核心结论、关键数据、风险与建议。云文档建好、拿到 `document_id` 后，按下面四步插画板。未选择云文档时，本节不触发。

### 第 1 步 · 读画板技能

需要生成画板时，加载 `beautiful-feishu-whiteboard` 技能并按其说明执行。

### 第 2 步 · 画 SVG，写到 `./artifacts/summary.svg`

- 画板只放 **5~7 条**核心信息（结论 / 关键数据 / 风险 / 建议）；**不要把正文章节结构复述成图**。
- 配色、风格、布局完全自由 —— 限的是内容量，不是表现。
- **必须按 `design.md` 里的色值手写 SVG**；不许用 `mermaid-cli` 等工具把 mermaid 渲染成 SVG 顶替（那出来的是默认线框图，不是画板）。

### 第 3 步 · 校验（不做这步会出文字溢出框、节点重叠、文字被遮挡）

```bash
npx @larksuite/whiteboard-cli@^0.2.11 -i ./artifacts/summary.svg -f svg --check
```

判据：`errors` 和 `warnings` **都必须为 0**，且 `textOverflow` / `nodeOverlap` / `textOcclusion` **都是 0**。不为 0 就改 SVG **重检一次**；第二次还不过，按下面「做不成时」申报，不要无限微调。

### 第 4 步 · 插到标题后（一条命令，不需要占位块、不需要 whiteboard token）

```bash
cat > ./artifacts/board.xml <<'EOF'
<h2>一图看懂 · 总览</h2>
<whiteboard type="svg" path="@./artifacts/summary.svg"></whiteboard>
EOF
lark-cli docs +update --as user --doc <文档token> \
--command block_insert_after --block-id <文档token> --content @./artifacts/board.xml
```

- `path="@文件"` 由 CLI 在写入前自动内联，不用先建空画板、不用取 whiteboard token。
- `--block-id` 填**文档 token 本身**（标题块的 id 就是它），画板会插在标题正下方。
- 返回 `new_blocks[]` 里出现 `block_type: whiteboard` 即成功。

## 收尾判据

- 画板不能代替正文。文档结构固定：**标题 → 画板 → 正文 → 附录**。
- 截图、mermaid 渲染出来的图、普通 SVG 图片，都不接受。
- 做不成时：正文照常写完，并在文档**开头**写明「画板未生成，原因：X」。X 必须具体到**哪一步、哪条命令、什么报错原文**（校验没过就写出未通过的项和数值），不许写"环境不支持"这类笼统说法。不许默默跳过，不许拿别的东西顶替。
