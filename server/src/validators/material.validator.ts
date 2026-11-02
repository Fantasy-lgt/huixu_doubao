// 材料入参校验（PRD-02 §2、§6；服务端为最终权威）
// period 允许空（null/undefined/'' → null），仅非空时走 domain.period() 的 YYYY-MM 校验。
import { AppError, fail } from '../domain/errors.js';
import { LIMITS, period, str } from '../domain/validation.js';

// domain.str 抛通用 INVALID_INPUT；材料入参对外统一归 400 VALIDATION_FAILED
function checked(value: unknown, label: string, max: number): string {
  try {
    return str(value, label, max);
  } catch (e) {
    if (e instanceof AppError) fail(`${label}不合法、过长或含不支持的控制字符`, 400, 'VALIDATION_FAILED');
    throw e;
  }
}

export const MATERIAL_TYPES = [
  'work_report',
  'project_progress',
  'meeting_minutes',
  'hr_admin',
  'customer_business',
  'contract_deal',
  'regulation',
  'other',
] as const;

export const OCCASIONS = [
  '月度管理会',
  '部门例会',
  '项目复盘',
  '年度总结',
  '述职竞聘',
  '专项汇报',
  '其他',
] as const;

export type MaterialTypeCode = (typeof MATERIAL_TYPES)[number];
export type OccasionCode = (typeof OCCASIONS)[number];

export interface MaterialPayload {
  title: string;
  materialType: MaterialTypeCode;
  tags: string[];
  period: string | null;
  occasion: OccasionCode | null;
  body: string;
  sourceName: string;
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

export function validateMaterialPayload(body: unknown): MaterialPayload {
  const b = asRecord(body);

  const title = checked(
    typeof b.title === 'string' ? b.title.trim() : b.title,
    '材料标题',
    100
  );

  const materialType = typeof b.materialType === 'string' ? b.materialType : '';
  if (!MATERIAL_TYPES.includes(materialType as MaterialTypeCode)) {
    fail('材料类型取值无效', 400, 'VALIDATION_FAILED');
  }

  const rawTags = Array.isArray(b.tags) ? b.tags : [];
  const tags = [
    ...new Set(
      rawTags.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
    ),
  ];
  if (tags.length > 8) fail('标签最多 8 个', 400, 'VALIDATION_FAILED');
  if (tags.some((t) => t.length > 12)) fail('单个标签长度不超过 12 字', 400, 'VALIDATION_FAILED');

  let periodValue: string | null = null;
  if (b.period !== undefined && b.period !== null && b.period !== '') {
    try {
      periodValue = period(b.period);
    } catch (e) {
      if (e instanceof AppError) fail('期间月份须为 2000–2100 年的合法 YYYY-MM', 400, 'VALIDATION_FAILED');
      throw e;
    }
  }

  let occasion: OccasionCode | null = null;
  if (typeof b.occasion === 'string' && b.occasion.trim()) {
    const trimmed = b.occasion.trim();
    if (!OCCASIONS.includes(trimmed as OccasionCode)) {
      fail('汇报场合取值无效', 400, 'VALIDATION_FAILED');
    }
    occasion = trimmed as OccasionCode;
  }

  const bodyText = checked(b.body, '材料正文', LIMITS.body);

  const sourceRaw = typeof b.sourceName === 'string' ? b.sourceName.trim() : '';
  const sourceName = sourceRaw || '手工录入';
  if (sourceName.length > 180) fail('来源名称过长，最长 180 字', 400, 'VALIDATION_FAILED');

  return {
    title,
    materialType: materialType as MaterialTypeCode,
    tags,
    period: periodValue,
    occasion,
    body: bodyText,
    sourceName,
  };
}
