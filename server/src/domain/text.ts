// 纯折行函数：迁移自初代 app/lib/pptx.cjs 第 11–21 行的 wrap。
// 权重：Tab=2；ASCII 可见字符（0x20–0x7E）=0.6；其余字符=1。
// 遇 \n 强制断行；for...of 按码点迭代，代理对（emoji 等）不会被截成两半。
// planSlides / render / loadPackage 属 W6，不在本任务迁移范围。
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  let units = 0;
  for (const c of text.replace(/\r/g, '')) {
    if (c === '\n') {
      lines.push(line);
      line = '';
      units = 0;
      continue;
    }
    const weight = c === '\t' ? 2 : /[\x20-\x7e]/.test(c) ? 0.6 : 1;
    if (units + weight > width) {
      lines.push(line);
      line = '';
      units = 0;
    }
    line += c;
    units += weight;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
