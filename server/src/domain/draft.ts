// 草稿要素：迁移自初代 app/lib/domain.cjs 的 createDraft / validSources / validateSections。
// 纯函数：只做结构校验与归一，不访问数据库与文件系统。
import { fail } from './errors.js';
import { id, LIMITS, now, str } from './validation.js';
import {
  coverage,
  type EvidenceItem,
  type ItemOrigin,
  type MaterialRecord,
  type MaterialState,
  type Section,
  type Selection,
} from './materials.js';

export interface SourceVersion {
  id: string;
  version: number;
}

export interface Draft {
  id: string;
  version: number;
  kind: Selection['kind'];
  department: string;
  year: number;
  month?: number;
  throughMonth?: number;
  title: string;
  sections: Section[];
  sourceVersions: SourceVersion[];
  generationMode: string;
  confirmedVersion: number | null;
  createdAt: string;
  updatedAt: string;
}

// 外部未校验的章节原始结构
export interface RawEvidence {
  sourceId: unknown;
  quote: unknown;
}

export interface RawSectionItem {
  id: unknown;
  text: unknown;
  sourceIds: unknown;
  origin?: unknown;
  evidence?: unknown;
}

export interface RawSection {
  id: unknown;
  title: unknown;
  items: unknown;
}

// 生成草稿骨架：年度缺月时标题带“资料不完整”；sourceVersions 只保留 id + version
export function createDraft(
  state: MaterialState,
  sel: Selection,
  materials: MaterialRecord[],
  mode: string,
  sections: Section[]
): Draft {
  const stamp = now();
  const missing = sel.kind === 'annual' ? coverage(state, sel).missing : [];
  const title =
    sel.kind === 'monthly'
      ? `${sel.year}年${sel.month}月管理会汇报`
      : `${sel.year}年度汇总（截至${sel.throughMonth}月${missing.length ? '，资料不完整' : ''}）`;
  return {
    id: id(),
    version: 1,
    kind: sel.kind,
    department: sel.department,
    year: sel.year,
    month: sel.month,
    throughMonth: sel.throughMonth,
    title,
    sections,
    sourceVersions: materials.map((m) => ({ id: m.id, version: m.version })),
    generationMode: mode,
    confirmedVersion: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

// 依据材料集合非空且每份 id+version 都能在当前库中对上
export function validSources(
  state: MaterialState,
  draft: Pick<Draft, 'sourceVersions'>
): boolean {
  return (
    draft.sourceVersions.length > 0 &&
    draft.sourceVersions.every((v) =>
      state.materials.some((m) => m.id === v.id && m.version === v.version)
    )
  );
}

// 章节校验：1–36 章、每章至少 1 条、id 全局唯一、来源白名单 ≤50、
// evidence ≤50 且 sourceId 必须在条目 sourceIds 内、总条目 ≤LIMITS.items（超限 422）；
// origin 仅 local/ai/manual 合法，其余归一 manual。
export function validateSections(
  v: unknown,
  sourceVersions: SourceVersion[],
  preserveOrigin = true
): Section[] {
  if (!Array.isArray(v) || !v.length || v.length > 36) fail('章节数量须为1至36');
  const allowed = new Set(sourceVersions.map((s) => s.id));
  let total = 0;
  const seen = new Set<string>();
  return (v as RawSection[]).map((s) => {
    if (!s || !Array.isArray(s.items) || !s.items.length) fail('每章至少保留一项内容');
    const sectionId = str(s.id, '章节标识', 100);
    if (seen.has(sectionId)) fail('章节或条目标识重复');
    seen.add(sectionId);
    return {
      id: sectionId,
      title: str(s.title, '章节标题', 100),
      items: (s.items as RawSectionItem[]).map((item) => {
        if (++total > LIMITS.items) fail('内容条目过多，请缩小汇报范围', 422);
        const itemId = str(item.id, '条目标识', 100);
        if (seen.has(itemId)) fail('章节或条目标识重复');
        seen.add(itemId);

        const sourceIds = Array.isArray(item.sourceIds)
          ? (item.sourceIds as unknown[])
          : null;
        if (
          !sourceIds ||
          sourceIds.length > 50 ||
          sourceIds.some((x) => !allowed.has(x as string))
        ) {
          fail('条目来源不在本次所选材料中');
        }

        const evidence: EvidenceItem[] = Array.isArray(item.evidence)
          ? (item.evidence as RawEvidence[]).map((e) => ({
              sourceId: str(e.sourceId, '依据来源', 100),
              quote: str(e.quote, '原文摘录', LIMITS.body),
            }))
          : [];
        if (evidence.length > 50 || evidence.some((e) => !sourceIds.includes(e.sourceId))) {
          fail('原文依据无效');
        }

        const origin: ItemOrigin =
          preserveOrigin &&
          typeof item.origin === 'string' &&
          (item.origin === 'local' || item.origin === 'ai' || item.origin === 'manual')
            ? item.origin
            : 'manual';

        return {
          id: itemId,
          text: str(item.text, '条目内容', LIMITS.item),
          sourceIds: [...new Set(sourceIds as string[])],
          origin,
          evidence,
        };
      }),
    };
  });
}
