# 技术 Spike 方案与脚本模板（W1 · 先文档化，待 Key / 服务器 / 脱敏模板到位后再执行）

版本：v1.0 ｜ 阶段：🪄 Test（技术验证）｜ 对应假设 H6（Brief 象限四）与排期 W1「技术 Spike」
原则：每项只做最小验证、不搭完整功能；**通过与失败都要留书面记录**；失败即触发既定降级预案，不硬撑进主线。本期默认只产出方案与可执行脚本模板，不在无 Key / 无服务器条件下真跑。

> 执行前提（当前缺口，到位后再跑对应项）：
> - Spike-1 需要 1 个测试 Key（建议 DeepSeek 兼容协议；厂商未最终确认）。
> - Spike-2 本机即可跑（Node ≥22，pptxgenjs@4.0.1，与初代同版本）。
> - Spike-3 需要 2–3 份**脱敏**真实 pptx 模板；真实内部资料不可外发、不可上传模型。
> - Spike-4 需要服务器 SSH / 登录信息（当前未提供）。

---

## 0. Spike 总览

| 编号 | 验证目标 | 依赖 | 通过判据（宽松、可证伪） | 失败降级预案（H6 / 风险表 11） | 产出记录 |
| --- | --- | --- | --- | --- | --- |
| S1 模型最小连通 | 调通 1 家兼容模型一次**非流式**请求，确认网络可达 + 返回结构可解析 | 测试 Key、服务器出网 | 200 + 合法 JSON + 能取出 `choices[0].message.content`；错误码可被分类 | 模型不通 → 换兼容厂商；仍不通 → 本地规则模式为唯一生成路径，不阻塞 P0 | `spike-s1-model.md` |
| S2 服务端出 PPTX | 服务端用 pptxgenjs 生成 1 页带主色 pptx，可下载、文本可编辑 | Node ≥22、npm 可装包 | 文件生成成功；PowerPoint/WPS 打开；标题主色生效；文本框可直接编辑 | 出图不稳 → 降级 HTML 页预览 + 手动导出；不承诺真实母版渲染 | `spike-s2-pptx.md` |
| S3 母版填充探针（B 层，只评估） | 摸清 python-pptx / Node 对等能力能填哪些占位符、不支持什么 | 2–3 份脱敏模板 | 列出「可填 / 不可填」清单；至少 1 个已声明占位符被成功写入并导出 | 不通 → 坚持 A 层卡片版，不对外承诺「无损套版」（风险表第 1 条） | `spike-s3-master-probe.md` |
| S4 服务器环境摸底 | 记录部署环境与出网能力，定 Docker Compose 落地条件 | 服务器信息 | 清单逐项有值或标注缺失；`docker compose up` 空壳可起 | 环境不满足 → 先用本机 Demo / 局域网演示，正式上线前再补（风险表合规条） | `spike-s4-env.md` |

时间盒：每项 ≤ 0.5 天；执行顺序建议 **S2（不依赖外部）→ S1（待 Key）→ S4（待服务器）→ S3（待脱敏模板）**。每项结束更新本文件对应「执行记录」小节。

---

## S1 · 模型最小非流式连通验证

### 1. 目标与边界
- 只验证「服务端能把一个最小请求发到兼容 OpenAI 协议的模型，并稳定拿到结构化文本」。
- **不做**：流式 SSE、Function Calling、Agent、RAG、多模型路由、微调、上下文长链。
- 非流式（`stream:false`）先跑通；SSE 是 W4 独立任务，不在本 Spike。

### 2. 请求合同（兼容协议草案）
- Endpoint：`POST {BASE_URL}/chat/completions`（DeepSeek 兼容；BASE_URL 与 model 名由 env 注入，不写进代码库）。
- 请求体：
```json
{
  "model": "env:MODEL_NAME",
  "messages": [
    {"role": "system", "content": "你是汇报整理助手，只输出给定结构，不编造数据。"},
    {"role": "user", "content": "用三行要点概括：本月完成了订单交付、库存盘点、客户回访。"}
  ],
  "temperature": 0.2,
  "max_tokens": 300,
  "stream": false
}
```
- 成功解析路径：`data.choices[0].message.content`；同时记录 `data.usage.total_tokens`（后续成本控制用）。

### 3. 错误分类表（前端/后端统一口径，对应任务流 F3-3 与 W4 错误分类）

| 分类 | 触发条件 | 系统动作 | 用户提示方向 |
| --- | --- | --- | --- |
| AUTH_FAIL | HTTP 401 / 403 | 不保存 Key、不重试 | Key 无效或无权限，请检查 |
| RATE_LIMIT | HTTP 429 | 不自动重试，退本地规则 | 当前限流，稍后再试 |
| TIMEOUT | 请求超时（建议 20s） | 退本地规则稿 | 连接超时，检查网络/出网策略 |
| BAD_JSON | 200 但 body 非 JSON 或缺 choices | 整份拒绝，保留原稿 | 返回格式不符兼容协议 |
| CONTENT_INVALID | 文本无结构 / 含越界引用（无 sourceId） | 沿用逐字引用校验，不合格整份拒绝 | 生成结果不可用，已保留原稿 |
| SERVER_ERR | 5xx | 稍后手动重试 | 服务暂时不可用 |

### 4. 通过判据
1. 用测试 Key 连续 3 次请求，至少 2 次返回合法 JSON 且能取出文本。
2. 6 类错误至少用 mock 响应（或断网/错误 Key）各触发一次，分类分支被正确走到。
3. Key 只从环境变量读取，代码与日志中不出现明文。

### 5. 脚本模板 `spikes/s1-model-check.cjs`（待 Key 后运行）

```js
// Spike-1：模型最小非流式连通 + 错误分类演练
// 运行：BASE_URL=https://api.deepseek.com MODEL_NAME=deepseek-chat MODEL_KEY=sk-xxx node spikes/s1-model-check.cjs
const BASE_URL = process.env.BASE_URL;
const MODEL_NAME = process.env.MODEL_NAME;
const MODEL_KEY = process.env.MODEL_KEY;

function classify(status, body) {
  if (status === 401 || status === 403) return 'AUTH_FAIL';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_ERR';
  if (!body || !body.choices || !body.choices[0]) return 'BAD_JSON';
  return 'OK';
}

async function main() {
  if (!BASE_URL || !MODEL_NAME || !MODEL_KEY) {
    console.log('SKIP: 缺少 BASE_URL / MODEL_NAME / MODEL_KEY 环境变量');
    process.exit(0); // 无 Key 不报错退出，保持本地可跑
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MODEL_KEY}` },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: '只输出三行要点，不编造数据。' },
          { role: 'user', content: '概括：完成订单交付、库存盘点、客户回访。' },
        ],
        temperature: 0.2, max_tokens: 300, stream: false,
      }),
      signal: controller.signal,
    });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    const kind = classify(res.status, body);
    console.log(JSON.stringify({ httpStatus: res.status, kind,
      content: body?.choices?.[0]?.message?.content ?? null,
      usage: body?.usage ?? null }, null, 2));
    if (kind === 'OK') console.log('RESULT: PASS'); else console.log(`RESULT: ${kind}`);
  } catch (e) {
    const kind = e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERR';
    console.log(JSON.stringify({ kind, message: String(e.message) }));
    console.log(`RESULT: ${kind}`);
  } finally { clearTimeout(timer); }
}
main();
```

### 6. 执行记录（跑完填写）
- 结论：PASS / FAIL / PARTIAL；日期；执行人。
- 证据：3 次请求的状态码、耗时、tokens；错误分类演练覆盖到哪几类。
- 对主线影响：是否进入 W4 模型适配层；若 FAIL，采用哪家替代或纯本地规则。

---

## S2 · 服务端 pptxgenjs 生成 1 页带配色 PPTX

### 1. 目标与边界
- 验证云端 Node 环境能装 `pptxgenjs@4.0.1`（与初代同版本，降低移植风险）并生成可下载文件。
- 只做 1 页：封面/标题页或要点列表页之一；不做完整分页、不做图表、不碰真实母版。
- 主色用产品紫 `#6C5CE7`，验证配色能写进母版级主题/形状填充。

### 2. 通过判据
1. `npm i pptxgenjs@4.0.1` 安装成功，脚本无报错生成 `out/s2-demo.pptx`。
2. 文件能被 PowerPoint / WPS 打开；标题文字为**可编辑文本框**（不是图片）。
3. 标题或色块使用了指定紫色；页脚含「来源角标占位」一行小字。
4. 通过 HTTP 接口（`GET /exports/demo`）能触发生成并返回文件下载头 `Content-Disposition`。

### 3. 脚本模板 `spikes/s2-pptx-gen.cjs`

```js
// Spike-2：服务端生成 1 页带主色 pptx
// 运行：node spikes/s2-pptx-gen.cjs  → 输出 out/s2-demo.pptx
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

(async () => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.author = '汇序 Pro';
  pptx.title = 'Spike 演示页';

  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  // 主色色块（验证配色生效）
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.55, fill: { color: '6C5CE7' } });
  slide.addText('月度管理会汇报 · Spike 演示', {
    x: 0.6, y: 1.4, w: 12, h: 0.8, fontSize: 30, bold: true, color: '1F1B3D',
  });
  slide.addText([
    { text: '1. 订单交付按计划完成', options: { bullet: true, breakLine: true } },
    { text: '2. 库存盘点完成，差异项待核', options: { bullet: true, breakLine: true } },
    { text: '3. 重点客户回访已排期', options: { bullet: true } },
  ], { x: 0.6, y: 2.5, w: 12, h: 2.6, fontSize: 18, color: '403C5E', lineSpacingMultiple: 1.4 });
  // 来源角标占位（对应「带出处标注」要求）
  slide.addText('来源：材料库示例条目（导出时逐页挂 sourceRefs）', {
    x: 0.6, y: 6.7, w: 12, h: 0.35, fontSize: 9, color: '6E6B8C',
  });

  const outDir = path.join(__dirname, '..', 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 's2-demo.pptx');
  await pptx.writeFile({ fileName: file });
  console.log('RESULT: PASS', file, fs.statSync(file).size, 'bytes');
})().catch((e) => { console.error('RESULT: FAIL', e.message); process.exit(1); });
```

### 4. 降级预案
- 若服务端环境装不上包 / 生成乱码：先保证**前端 HTML 页预览**可用，导出按钮退为「复制大纲 + 手动套模板」，不阻塞 P0 内容闭环（H6 降级项）。
- 超长按规则分页或明确拒绝（方案 4.3 验收 3），不在 Spike 阶段实现复杂分页。

### 5. 执行记录
- 结论 / 文件大小 / 打开验证人 / 配色与可编辑性确认 / 遗留问题。

---

## S3 · 真实母版填充可行性探针（B 层，只评估、不进主线）

### 1. 目标与边界
- 回答一个问题：**给定一份真实 pptx 母版，程序能否只往「已声明占位符」里填文字，且保留母版配色与图形？**
- 严格不做：任意母版智能拆解、版式视觉识别、自动匹配所有页型、承诺「无损」。
- 工具对比：`python-pptx`（Python 侧能力先摸）与 Node 生态对等库（如 `pptxgenjs` 不读母版；Node 侧 OOXML 库能力弱，仅记录结论，不强行选型）。

### 2. 探针步骤
1. 取 2–3 份脱敏模板（不含真实人名/金额/合同条款）。
2. 用脚本枚举每份模板的 `slide_layouts` 与每个 `placeholders`（idx、type、name、位置）。
3. 选 1 个文本占位符写入测试文字，另存为新文件，人工在 PowerPoint/WPS 打开核对：文字是否落位、母版配色/图形是否保留。
4. 逐项填写下方能力清单。

### 3. 能力清单（探针结论表，跑完逐项打勾）

| 能力项 | python-pptx 实测 | 结论（支持/部分/不支持） | 备注 |
| --- | --- | --- | --- |
| 读取 slide_layouts 与占位符清单 | 待填 | | |
| 写入文本占位符并保留位置 | 待填 | | |
| 保留母版主题色 / 字体 | 待填 | | |
| 保留母版图形 / 页脚 / Logo | 待填 | | |
| 填充图表占位（柱状等） | 待填 | | 复杂图表样式大概率不支持 |
| SmartArt 内容填充 | 待填 | | 通常不支持 |
| 动画 / 切换效果保留 | 待填 | | 通常不保留 |
| 新增母版没有的版式类型 | 待填 | | 不支持，需白名单页型 |
| WPS 与 PowerPoint 渲染一致性 | 待填 | | 差异需截图记录 |

### 4. 探针脚本模板 `spikes/s3-master-probe.py`（Python 3.13，`pip install python-pptx`）

```python
# Spike-3：枚举占位符 + 试填一个文本占位符，输出能力清单原始数据
# 运行：python spikes/s3-master-probe.py path/to/template.pptx
import sys, json
from pptx import Presentation

def probe(path):
    prs = Presentation(path)
    report = {"file": path, "layouts": []}
    for li, layout in enumerate(prs.slide_layouts):
        phs = []
        for ph in layout.placeholders:
            phs.append({"idx": ph.placeholder_format.idx,
                         "type": str(ph.placeholder_format.type),
                         "name": ph.name,
                         "has_text_frame": ph.has_text_frame})
        report["layouts"].append({"layout": layout.name, "placeholders": phs})
    # 试填：第一个文本占位符（仅在第一份布局上演示，不保存为产品功能）
    target = None
    for layout in prs.slide_layouts:
        for ph in layout.placeholders:
            if ph.has_text_frame:
                target = ph; break
        if target: break
    report["fill_target"] = target.name if target else None
    if target:
        target.text_frame.text = "SPIKE 测试文字（探针用，非成品）"
        out = path.replace(".pptx", "-filled.pptx")
        prs.save(out)
        report["filled_out"] = out
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python s3-master-probe.py <template.pptx>"); sys.exit(0)
    probe(sys.argv[1])
```

### 5. 通过 / 不通过结论口径
- **PARTIAL 可产品化**：仅当「文本占位符填充 + 母版配色图形保留」在 ≥2 份模板稳定成立，且不支持项被白名单明确排除，才在 P1 评估产品化；仍不写「无损」字样。
- **FAIL 坚持卡片版**：若占位符落位不稳、母版元素丢失或 WPS/PPT 差异明显，结论直接为「B 层本期不做」，主线维持 A 层模板卡片（方案 5.3.1 / 风险表第 1 条）。

### 6. 执行记录
- 模板份数、每份能力清单结果、人工打开截图说明、最终结论（进 P1 / 不做）。

---

## S4 · 服务器环境摸底清单

### 1. 目标
为 Docker Compose 落地收集客观事实，不做部署改造；当前无服务器信息，脚本先备好，到位后逐项执行。

### 2. 清单与命令（SSH 登录后逐条跑，记录输出）

| 检查项 | 命令 / 方法 | 记录口径 |
| --- | --- | --- |
| 操作系统 / 架构 | `cat /etc/os-release; uname -m` | 版本、是否 x86_64 |
| Node 版本 | `node -v; npm -v` | 是否 ≥22；否则 nvm / Docker 内运行 |
| Docker / Compose | `docker -v; docker compose version` | 是否可直接 compose up |
| 内存 / 磁盘 | `free -h; df -h /` | 够不够前后端 + PG 最小运行 |
| PostgreSQL 可用性 | `docker images \| grep postgres` 或计划用容器 | 版本 ≥15 |
| 出网到模型厂商 | `curl -I https://api.deepseek.com`（仅测连通，不带 Key） | 可达 / 被防火墙拦 |
| 端口与域名 / SSL | 记录已用端口；域名解析与证书方案 | 80/443 是否被占 |
| 备份目录与定时任务位置 | `ls /root` 现状 | 备份落盘路径预留 |

### 3. 通过判据
- 清单无「未知」空缺；`docker compose config` 语法校验通过；空壳前后端 + 一个空 PG 容器可 `up` 并停止（对应排期 W1 周末检查点）。

### 4. 降级预案
- 服务器暂时不可用：W1–W3 先在本机完成前后端闭环与自测；公网部署顺延，不阻塞功能开发与作品集演示（风险表合规条：MVP 可先本地 Demo + 局域网演示）。

### 5. 执行记录
- 环境快照、缺口清单、是否需要调整 compose 服务资源配置。

---

## 统一记录模板（每个 Spike 结束复制使用）

```
## Spike-Sx 执行记录 · YYYY-MM-DD
- 结论：PASS / PARTIAL / FAIL
- 覆盖场景：（列出实际跑到的请求/文件/模板）
- 关键证据：（状态码、文件大小、截图文件名、清单勾选结果）
- 对主线决策的影响：（进入哪个 W 任务 / 是否触发降级）
- 降级动作（若 FAIL/PARTIAL）：（采用预案哪一条，谁在何时确认）
- 遗留问题与下一步：
```

## 本期 Spike 明确不验证（防止范围越界）
- 不验证 RAG 向量检索、Function Calling、Agent 编排、Dify/Coze、模型微调、多模型编排（与真实简历能力边界一致，不背进主线）。
- 不验证任意母版智能拆解（方案 5.3.1 C 层，不立项）。
- 不在 Spike 阶段实现 SSE 流式、外发扣费控制、备份加密的完整产品逻辑，只确认最小技术可行性。
- 所有真实业务材料不进入模型请求；探针模板必须脱敏。
