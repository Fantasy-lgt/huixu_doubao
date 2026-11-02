// 选材与本地章节：迁移自初代 app/lib/domain.cjs 的 selection / selectMaterials /
// coverage / localSections。纯函数，不访问数据库与文件系统。
import { fail } from './errors.js';
import { dateParts, id, integer, str } from './validation.js';

export type SelectionKind = 'monthly' | 'annual';

// 入参为外部未校验对象；校验通过后产出 Selection
export interface SelectionInput {
  kind?: unknown;
  department?: unknown;
  year?: unknown;
  month?: unknown;
  throughMonth?: unknown;
}

export interface Selection {
  kind: SelectionKind;
  department: string;
  year: number;
  month?: number;
  throughMonth?: number;
}

// 初代内部字段 department 对应新 Prisma 模型 Material.occasion；
// 本类型为领域层内存记录，不绑定 ORM；W3 由 mapper 完成与 Prisma 记录之间的映射。
export interface MaterialRecord {
  id: string;
  title: string;
  department: string;
  period: string; // YYYY-MM
  body: string;
  sourceName: string;
  version: number;
  createdAt: string;
}

export interface MaterialState {
  materials: MaterialRecord[];
}

export interface EvidenceItem {
  sourceId: string;
  quote: string;
}

export type ItemOrigin = 'local' | 'ai' | 'manual';

export interface SectionItem {
  id: string;
  text: string;
  sourceIds: string[];
  origin: ItemOrigin;
  evidence: EvidenceItem[];
}

export interface Section {
  id: string;
  title: string;
  items: SectionItem[];
}

export interface CoverageMonth {
  month: number;
  count: number;
  inRange: boolean;
}

export interface CoverageResult {
  months: CoverageMonth[];
  missing: number[];
}

export const HEADINGS: readonly string[] = ['重点进展', '问题风险', '下期计划'];

// 汇报选材条件校验与规范化
export function selection(v: SelectionInput, date: Date = new Date()): Selection {
  if (!['monthly', 'annual'].includes(v.kind as string)) fail('汇报类型无效');
  const kind = v.kind as SelectionKind;
  const current = dateParts(date);
  const result: Selection = {
    kind,
    department: str(v.department || '全部部门', '部门', 40),
    year: integer(v.year, 2000, 2100, '年份'),
  };
  if (kind === 'monthly') {
    result.month = integer(v.month, 1, 12, '月份');
  } else {
    const fallback = v.year === current.year ? current.month : 12;
    result.throughMonth = integer(v.throughMonth ?? fallback, 1, 12, '截至月份');
  }
  return result;
}

// 按选材条件过滤材料；月度匹配当月，年度匹配截至月份；按 period + createdAt 排序
export function selectMaterials(state: MaterialState, sel: Selection): MaterialRecord[] {
  return state.materials
    .filter(
      (m) =>
        (sel.department === '全部部门' || m.department === sel.department) &&
        Number(m.period.slice(0, 4)) === sel.year &&
        (sel.kind === 'monthly'
          ? Number(m.period.slice(5)) === sel.month
          : Number(m.period.slice(5)) <= (sel.throughMonth ?? Number.NaN))
    )
    .sort(
      (a, b) =>
        a.period.localeCompare(b.period) || a.createdAt.localeCompare(b.createdAt)
    );
}

// 年度覆盖度：inRange 内 count 为 0 的月份进入 missing
export function coverage(state: MaterialState, sel: Selection): CoverageResult {
  const relevant = selectMaterials(state, { ...sel, kind: 'annual' });
  const through = typeof sel.throughMonth === 'number' ? sel.throughMonth : Number.NaN;
  const months: CoverageMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: relevant.filter((m) => Number(m.period.slice(5)) === i + 1).length,
    inRange: i < through,
  }));
  return { months, missing: months.filter((x) => x.inRange && !x.count).map((x) => x.month) };
}

// 本地章节整理：月度三固定标题；年度按 period 分组并加 `YYYY-MM · ` 前缀
export function localSections(materials: MaterialRecord[], sel: Selection): Section[] {
  function group(records: MaterialRecord[]): Section[] {
    const sections: Section[] = HEADINGS.map((title) => ({ id: id(), title, items: [] }));
    for (const m of records) {
      let target: number | null = null;
      for (const raw of m.body.split(/\r?\n/)) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const heading = trimmed.replace(/^#+\s*/, '').replace(/[：:]$/, '');
        const index = HEADINGS.indexOf(heading);
        if (index >= 0) {
          target = index;
          continue;
        }
        // 无标题归属的原文逐段保留，加状态提示；长行按 4000 码位单位切分，不截断代理对
        for (let offset = 0; offset < raw.length; ) {
          let end = Math.min(offset + 4000, raw.length);
          if (end < raw.length && /[\uD800-\uDBFF]/u.test(raw[end - 1])) end--;
          const part = raw.slice(offset, end);
          offset = end;
          sections[target ?? 0].items.push({
            id: id(),
            text: target === null ? `原文摘录，完成状态待核对：${part}` : part,
            sourceIds: [m.id],
            origin: 'local',
            evidence: [{ sourceId: m.id, quote: part }],
          });
        }
      }
    }
    for (const s of sections) {
      if (!s.items.length) {
        s.items.push({
          id: id(),
          text: '待补充：未提供本项资料，请人工补充并核对。',
          sourceIds: [],
          origin: 'local',
          evidence: [],
        });
      }
    }
    return sections;
  }

  if (sel.kind === 'monthly') return group(materials);
  return Array.from(new Set(materials.map((m) => m.period)))
    .sort()
    .flatMap((p) =>
      group(materials.filter((m) => m.period === p)).map((s) => ({
        ...s,
        title: `${p} · ${s.title}`,
      }))
    );
}
