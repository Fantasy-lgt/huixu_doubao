# W1 技术 Spike 脚本目录

对应《技术Spike方案与脚本模板.md》。原则：最小验证、不搭完整功能；通过与失败都记录；失败按降级预案走，不硬撑进主线。

| 脚本 | 目的 | 前置条件 | 通过判据 |
| --- | --- | --- | --- |
| `s1-model-check.cjs` | 模型最小非流式连通 + 错误分类 | 测试 Key（MODEL_BASE_URL/MODEL_NAME/MODEL_KEY） | 200 且能取到 choices[0].message.content；缺 Key 自动 SKIP |
| `s2-pptx-gen.cjs` | pptxgenjs 生成 1 页带紫主色 pptx | `server/` 内 `npm install` | 生成 `out/s2-demo.pptx`，打开后文本可编辑、主色生效 |
| `s3-master-probe.py` | 母版占位符填充可行性（只评估） | 2–3 份**脱敏** pptx；`pip install python-pptx` | 产出能力清单；文本占位符可填且母版元素保留才评估产品化 |

## 运行方式

```bash
# S2（本机即可跑，不依赖外部）
cd server
npm install
npm run spike:s2

# S1（待 Key；PowerShell 示例）
$env:MODEL_BASE_URL="https://api.deepseek.com"
$env:MODEL_NAME="deepseek-chat"
$env:MODEL_KEY="sk-你的测试Key"
node ../spikes/s1-model-check.cjs

# S3（待脱敏模板）
pip install python-pptx
python s3-master-probe.py 脱敏模板.pptx
```

## 记录要求

每项结束按 Spike 文档「统一记录模板」填写：结论 PASS / PARTIAL / FAIL、证据、对主线影响、降级动作。

降级预案：
- S1 不通 → 换兼容厂商；仍不通 → 本地规则为唯一生成路径。
- S2 不稳 → 降级 HTML 页预览 + 手动导出。
- S3 不通 → 坚持 A 层模板卡片版，不承诺无损套版。

生成物 `out/` 已在 `.gitignore` 忽略，不入库。
