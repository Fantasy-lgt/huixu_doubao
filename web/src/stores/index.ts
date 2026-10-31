// 业务 store 统一导出；按业务边界拆分，组件内按需 import 具体 store
export { useAuthStore } from './auth';
export { useMaterialsStore } from './materials';
export { useDraftStore } from './draft';
export { useTemplateStore } from './template';
export { useSettingsStore } from './settings';

export type { CurrentUser } from './auth';
export type { MaterialItem, MaterialFilters } from './materials';
export type { DraftSection } from './draft';
export type { TemplateCardItem } from './template';
export type { ModelKeyItem } from './settings';
