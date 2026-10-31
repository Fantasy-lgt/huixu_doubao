// Spike-S1：模型最小非流式连通 + 错误分类演练（缺 Key 自动跳过，不报错退出）
// 运行（在 server/ 目录，先 npm i pptxgenjs 之外的依赖；本脚本仅用 Node 原生 fetch）：
//   $env:MODEL_BASE_URL="https://api.deepseek.com"; $env:MODEL_NAME="deepseek-chat"; $env:MODEL_KEY="sk-xxx"; node ../spikes/s1-model-check.cjs
const BASE_URL = process.env.MODEL_BASE_URL;
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
    console.log('SKIP: 缺少 MODEL_BASE_URL / MODEL_NAME / MODEL_KEY，本地规则模式不阻塞主流程');
    process.exit(0);
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
        temperature: 0.2,
        max_tokens: 300,
        stream: false,
      }),
      signal: controller.signal,
    });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    const kind = classify(res.status, body);
    console.log(JSON.stringify(
      {
        httpStatus: res.status,
        kind,
        content: body?.choices?.[0]?.message?.content ?? null,
        usage: body?.usage ?? null,
      },
      null,
      2
    ));
    console.log(kind === 'OK' ? 'RESULT: PASS' : `RESULT: ${kind}`);
  } catch (e) {
    const kind = e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERR';
    console.log(JSON.stringify({ kind, message: String(e.message) }));
    console.log(`RESULT: ${kind}`);
  } finally {
    clearTimeout(timer);
  }
}
main();
