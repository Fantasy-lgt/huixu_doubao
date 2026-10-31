// Spike-S2：服务端 pptxgenjs 生成 1 页带紫主色 pptx（不依赖数据库与模型）
// 运行：在 server/ 目录 npm install 后执行  npm run spike:s2
// 产物：spikes/out/s2-demo.pptx（已被 .gitignore 忽略）
const fs = require('fs');
const path = require('path');
// 依赖装在 server/node_modules，脚本位于 spikes/，从 server 包边界解析
const { createRequire } = require('module');
const serverRequire = createRequire(path.join(__dirname, '..', 'server', 'package.json'));
const pptxgen = serverRequire('pptxgenjs');

(async () => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.author = '汇序 Pro';
  pptx.title = 'Spike 演示页';

  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  // 主色色块（验证紫 #6C5CE7 生效）
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.55, fill: { color: '6C5CE7' },
  });
  slide.addText('月度管理会汇报 · Spike 演示', {
    x: 0.6, y: 1.4, w: 12, h: 0.8, fontSize: 30, bold: true, color: '1F1B3D',
  });
  slide.addText([
    { text: '1. 订单交付按计划完成', options: { bullet: true, breakLine: true } },
    { text: '2. 库存盘点完成，差异项待核', options: { bullet: true, breakLine: true } },
    { text: '3. 重点客户回访已排期', options: { bullet: true } },
  ], { x: 0.6, y: 2.5, w: 12, h: 2.6, fontSize: 18, color: '403C5E', lineSpacingMultiple: 1.4 });
  // 来源角标占位（对应“带出处标注”要求，导出时逐页挂 sourceRefs）
  slide.addText('来源：材料库示例条目（导出时逐页挂 sourceRefs）', {
    x: 0.6, y: 6.7, w: 12, h: 0.35, fontSize: 9, color: '6E6B8C',
  });

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 's2-demo.pptx');
  await pptx.writeFile({ fileName: file });
  console.log('RESULT: PASS', file, fs.statSync(file).size, 'bytes');
})().catch((e) => {
  console.error('RESULT: FAIL', e.message);
  process.exit(1);
});
