import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/domain/errors.js';
import { period } from '../src/domain/validation.js';
import {
  selection,
  selectMaterials,
  coverage,
  localSections,
  HEADINGS,
  type MaterialRecord,
  type MaterialState,
  type Selection,
} from '../src/domain/materials.js';
import { createDraft, validSources, validateSections } from '../src/domain/draft.js';
import { wrap } from '../src/domain/text.js';

// 测试用材料构造器：字段对齐初代 MaterialRecord（内部沿用 department 字段名）
const mat = (
  id: string,
  department: string,
  period: string,
  createdAt: string,
  body = '重点进展\n事项。\n'
): MaterialRecord => ({
  id,
  title: `材料-${id}`,
  department,
  period,
  body,
  sourceName: 'test.txt',
  version: 1,
  createdAt,
});

// ---------- period 校验 ----------

test('period：合法 YYYY-MM 通过', () => {
  assert.equal(period('2026-11'), '2026-11');
  assert.equal(period('2000-01'), '2000-01');
  assert.equal(period('2100-12'), '2100-12');
});

test('period：非法月份/格式/年份越界抛错', () => {
  for (const bad of ['2026-13', '2026/12', '', '1999-01', '2101-01', '2026-1', null, undefined, 202611]) {
    assert.throws(() => period(bad), AppError);
  }
});

// ---------- selection / selectMaterials ----------

test('selection：非法汇报类型抛错', () => {
  assert.throws(() => selection({ kind: 'weekly', year: 2026 }), /汇报类型无效/);
});

test('selectMaterials：月度按部门+年月过滤；全部部门不过滤部门；按 period+createdAt 排序', () => {
  const state: MaterialState = {
    materials: [
      mat('c1', '生产部', '2026-03', '2026-03-03T00:00:00Z'),
      mat('a1', '综合部', '2026-01', '2026-01-02T00:00:00Z'),
      mat('a2', '综合部', '2026-01', '2026-01-01T00:00:00Z'),
      mat('b1', '综合部', '2026-02', '2026-02-01T00:00:00Z'),
      mat('d1', '生产部', '2026-07', '2026-07-01T00:00:00Z'),
    ],
  };

  const monthly: Selection = selection({ kind: 'monthly', department: '综合部', year: 2026, month: 1 });
  assert.deepEqual(selectMaterials(state, monthly).map((m) => m.id), ['a2', 'a1']);

  const annual: Selection = selection({ kind: 'annual', department: '全部部门', year: 2026, throughMonth: 6 });
  const annualPicked = selectMaterials(state, annual).map((m) => m.id);
  assert.deepEqual(annualPicked, ['a2', 'a1', 'b1', 'c1']);
});

test('selectMaterials：年度只取截至月份之前（含）的材料', () => {
  const state: MaterialState = {
    materials: [
      mat('m1', '综合部', '2026-03', '2026-03-01T00:00:00Z'),
      mat('m2', '综合部', '2026-07', '2026-07-01T00:00:00Z'),
    ],
  };
  const sel = selection({ kind: 'annual', department: '全部部门', year: 2026, throughMonth: 6 });
  assert.deepEqual(selectMaterials(state, sel).map((m) => m.id), ['m1']);
});

// ---------- coverage ----------

test('coverage：inRange 内缺月进入 missing；有材料月份 count 正确；范围外月份不计缺月', () => {
  const state: MaterialState = {
    materials: [
      mat('a', '综合部', '2026-01', '2026-01-01T00:00:00Z'),
      mat('b', '综合部', '2026-01', '2026-01-02T00:00:00Z'),
      mat('c', '生产部', '2026-03', '2026-03-01T00:00:00Z'),
      mat('d', '综合部', '2026-07', '2026-07-01T00:00:00Z'),
    ],
  };
  const sel = selection({ kind: 'annual', department: '全部部门', year: 2026, throughMonth: 6 });
  const cov = coverage(state, sel);
  assert.deepEqual(cov.missing, [2, 4, 5, 6]);
  assert.equal(cov.months[0].count, 2);
  assert.equal(cov.months[2].count, 1);
  assert.equal(cov.months[6].inRange, false);
  assert.equal(cov.months[6].count, 0);
});

// ---------- localSections ----------

test('localSections：月度产出三个固定标题章节；无标题归属原文加前缀；sourceIds 指向来源材料', () => {
  const m1 = mat(
    'm1',
    '综合部',
    '2026-10',
    '2026-10-01T00:00:00Z',
    '游离段落一\n重点进展\n完成归档事项\n下期计划\n已定命名规则'
  );
  const m2 = mat('m2', '生产部', '2026-10', '2026-10-02T00:00:00Z', '问题风险\n冷却改进待验证');
  const sel = selection({ kind: 'monthly', department: '全部部门', year: 2026, month: 10 });
  const sections = localSections([m1, m2], sel);

  assert.equal(sections.length, 3);
  assert.deepEqual(sections.map((s) => s.title), [...HEADINGS]);

  const firstItem = sections[0].items.find((i) => i.text.includes('游离段落一'))!;
  assert.ok(firstItem.text.startsWith('原文摘录，完成状态待核对：游离段落一'));
  assert.deepEqual(firstItem.sourceIds, ['m1']);
  assert.deepEqual(firstItem.evidence, [{ sourceId: 'm1', quote: '游离段落一' }]);

  assert.ok(sections[1].items.some((i) => i.text === '冷却改进待验证'));
  assert.ok(sections[2].items.some((i) => i.text === '已定命名规则'));
});

test('localSections：无内容章节补“待补充”占位条目，sourceIds/evidence 为空', () => {
  const m = mat('m9', '综合部', '2026-10', '2026-10-01T00:00:00Z', '重点进展\n仅进展项');
  const sel = selection({ kind: 'monthly', department: '全部部门', year: 2026, month: 10 });
  const sections = localSections([m], sel);
  const risk = sections[1];
  assert.equal(risk.items.length, 1);
  assert.equal(risk.items[0].text, '待补充：未提供本项资料，请人工补充并核对。');
  assert.deepEqual(risk.items[0].sourceIds, []);
  assert.deepEqual(risk.items[0].evidence, []);
});

test('localSections：年度按 period 分组，标题加 YYYY-MM · 前缀', () => {
  const m1 = mat('m1', '综合部', '2026-01', '2026-01-01T00:00:00Z', '重点进展\n一月事项');
  const m2 = mat('m2', '综合部', '2026-03', '2026-03-01T00:00:00Z', '问题风险\n三月风险');
  const sel = selection({ kind: 'annual', department: '全部部门', year: 2026, throughMonth: 6 });
  const sections = localSections([m1, m2], sel);
  assert.equal(sections.length, 6);
  assert.deepEqual(sections.map((s) => s.title), [
    '2026-01 · 重点进展',
    '2026-01 · 问题风险',
    '2026-01 · 下期计划',
    '2026-03 · 重点进展',
    '2026-03 · 问题风险',
    '2026-03 · 下期计划',
  ]);
});

// ---------- validateSections ----------

const sources = [
  { id: 'm1', version: 1 },
  { id: 'm2', version: 1 },
];

test('validateSections：合法输入通过；非法 origin 归一 manual；重复 sourceIds 去重', () => {
  const out = validateSections(
    [
      {
        id: 's1',
        title: '重点进展',
        items: [
          {
            id: 'i1',
            text: '条目正文',
            sourceIds: ['m1', 'm1'],
            origin: 'weird',
            evidence: [{ sourceId: 'm1', quote: '摘录原文' }],
          },
        ],
      },
    ],
    sources
  );
  assert.equal(out.length, 1);
  const item = out[0].items[0];
  assert.equal(item.origin, 'manual');
  assert.deepEqual(item.sourceIds, ['m1']);
  assert.equal(item.evidence[0].sourceId, 'm1');
  assert.equal(item.evidence[0].quote, '摘录原文');
});

test('validateSections：sourceIds 出现不在允许集合的 id 抛错', () => {
  assert.throws(
    () =>
      validateSections(
        [{ id: 's1', title: 't', items: [{ id: 'i1', text: 'x', sourceIds: ['nope'], evidence: [] }] }],
        sources
      ),
    /不在本次所选材料中/
  );
});

test('validateSections：章节为空/超 36 抛错；章节无条目抛错；重复 id 抛错', () => {
  assert.throws(() => validateSections([], sources), /章节数量/);
  assert.throws(
    () =>
      validateSections(
        Array.from({ length: 37 }, (_, i) => ({ id: `s${i}`, title: `t${i}`, items: [] })),
        sources
      ),
    /章节数量/
  );
  assert.throws(
    () => validateSections([{ id: 's1', title: 't', items: [] }], sources),
    /每章至少/
  );
  assert.throws(
    () =>
      validateSections(
        [
          { id: 'dup', title: 'a', items: [{ id: 'i1', text: 'x', sourceIds: ['m1'], evidence: [] }] },
          { id: 'dup', title: 'b', items: [{ id: 'i2', text: 'y', sourceIds: ['m1'], evidence: [] }] },
        ],
        sources
      ),
    /重复/
  );
  assert.throws(
    () =>
      validateSections(
        [
          {
            id: 's1',
            title: 'a',
            items: [
              { id: 'same', text: 'x', sourceIds: ['m1'], evidence: [] },
              { id: 'same', text: 'y', sourceIds: ['m1'], evidence: [] },
            ],
          },
        ],
        sources
      ),
    /重复/
  );
});

test('validateSections：evidence 引用未在 sourceIds 中的 sourceId 抛错', () => {
  assert.throws(
    () =>
      validateSections(
        [
          {
            id: 's1',
            title: 't',
            items: [{ id: 'i1', text: 'x', sourceIds: ['m1'], evidence: [{ sourceId: 'm2', quote: 'q' }] }],
          },
        ],
        sources
      ),
    /原文依据无效/
  );
});

test('validateSections：合法 origin（local/ai/manual）原样保留', () => {
  const out = validateSections(
    [
      {
        id: 's1',
        title: 't',
        items: [
          { id: 'i1', text: 'a', sourceIds: ['m1'], origin: 'ai', evidence: [] },
          { id: 'i2', text: 'b', sourceIds: ['m1'], origin: 'local', evidence: [] },
        ],
      },
    ],
    sources
  );
  assert.equal(out[0].items[0].origin, 'ai');
  assert.equal(out[0].items[1].origin, 'local');
});

test('validateSections：sourceIds 超过 50 个抛错', () => {
  const many = Array.from({ length: 51 }, () => 'm1');
  assert.throws(
    () =>
      validateSections(
        [{ id: 's1', title: 't', items: [{ id: 'i1', text: 'x', sourceIds: many, evidence: [] }] }],
        sources
      ),
    /不在本次所选材料中/
  );
});

test('validateSections：evidence 超过 50 条抛错', () => {
  const ev = Array.from({ length: 51 }, () => ({ sourceId: 'm1', quote: 'q' }));
  assert.throws(
    () =>
      validateSections(
        [{ id: 's1', title: 't', items: [{ id: 'i1', text: 'x', sourceIds: ['m1'], evidence: ev }] }],
        sources
      ),
    /原文依据无效/
  );
});

test('validateSections：总条目超过 LIMITS.items(300) 抛 422', () => {
  const items = Array.from({ length: 301 }, (_, i) => ({
    id: `i${i}`,
    text: `t${i}`,
    sourceIds: ['m1'],
    evidence: [],
  }));
  assert.throws(
    () => validateSections([{ id: 's1', title: 't', items }], sources),
    (err: unknown) => err instanceof AppError && err.status === 422 && /条目过多/.test(err.message)
  );
});

// ---------- createDraft / validSources ----------

test('createDraft：月度标题为 `${year}年${month}月管理会汇报`；sourceVersions 只带 id+version', () => {
  const state: MaterialState = {
    materials: [mat('m1', '综合部', '2026-10', '2026-10-01T00:00:00Z'), mat('m2', '生产部', '2026-10', '2026-10-02T00:00:00Z')],
  };
  const sel = selection({ kind: 'monthly', department: '全部部门', year: 2026, month: 10 });
  const sections = localSections(state.materials, sel);
  const draft = createDraft(state, sel, state.materials, 'local', sections);
  assert.equal(draft.title, '2026年10月管理会汇报');
  assert.deepEqual(draft.sourceVersions, [
    { id: 'm1', version: 1 },
    { id: 'm2', version: 1 },
  ]);
  assert.equal(draft.confirmedVersion, null);
});

test('createDraft：年度标题仅在存在缺月时含“资料不完整”', () => {
  const sparse: MaterialState = { materials: [mat('a', '综合部', '2026-01', '2026-01-01T00:00:00Z')] };
  const sel = selection({ kind: 'annual', department: '全部部门', year: 2026, throughMonth: 3 });
  const d1 = createDraft(sparse, sel, sparse.materials, 'local', []);
  assert.ok(d1.title.includes('资料不完整'));

  const full: MaterialState = {
    materials: [
      mat('a', '综合部', '2026-01', '2026-01-01T00:00:00Z'),
      mat('b', '综合部', '2026-02', '2026-02-01T00:00:00Z'),
      mat('c', '综合部', '2026-03', '2026-03-01T00:00:00Z'),
    ],
  };
  const d2 = createDraft(full, sel, full.materials, 'local', []);
  assert.ok(!d2.title.includes('资料不完整'));
  assert.ok(d2.title.includes('年度汇总（截至3月'));
});

test('validSources：版本匹配为 true；缺失/版本不符/空集合为 false', () => {
  const state: MaterialState = { materials: [mat('m1', '综合部', '2026-10', '2026-10-01T00:00:00Z')] };
  assert.equal(validSources(state, { sourceVersions: [{ id: 'm1', version: 1 }] }), true);
  assert.equal(validSources(state, { sourceVersions: [{ id: 'm1', version: 2 }] }), false);
  assert.equal(validSources(state, { sourceVersions: [{ id: 'nope', version: 1 }] }), false);
  assert.equal(validSources(state, { sourceVersions: [] }), false);
});

// ---------- wrap ----------

test('wrap：ASCII 与中文混排按权重折行（ASCII 0.6，中文 1）', () => {
  assert.deepEqual(wrap('中文ab', 3), ['中文a', 'b']);
});

test('wrap：换行符强制断行', () => {
  assert.deepEqual(wrap('第一行\n第二行', 100), ['第一行', '第二行']);
});

test('wrap：Tab 计 2 单位', () => {
  assert.deepEqual(wrap('a\tb', 2), ['a', '\t', 'b']);
});

test('wrap：代理对（emoji）不会被截成两半', () => {
  const out = wrap('a😀b😄c', 1);
  const flat = out.join('');
  for (let i = 0; i < flat.length; i++) {
    const code = flat.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      assert.ok(i + 1 < flat.length, '高代理后缺少低代理，代理对被截断');
      const next = flat.charCodeAt(i + 1);
      assert.ok(next >= 0xdc00 && next <= 0xdfff, '高代理未配对低代理');
      i++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      assert.fail('出现孤立低代理半字符');
    }
  }
  assert.ok(out.includes('😀'));
  assert.ok(out.includes('😄'));
});
