import { defineStore } from 'pinia';
import { ref } from 'vue';
import { materialApi, type Material, type MaterialUpsertPayload } from '@/api/materials';

export type MaterialItem = Material;

export interface MaterialFilters {
  materialType: string;
  tag: string;
  period: string;
  keyword: string;
}

const EMPTY_FILTERS: MaterialFilters = { materialType: '', tag: '', period: '', keyword: '' };

// 材料库：列表、组合筛选与 CRUD；本期无分页，列表长度即总量
export const useMaterialsStore = defineStore('materials', () => {
  const list = ref<MaterialItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selected = ref<MaterialItem | null>(null);
  const filters = ref<MaterialFilters>({ ...EMPTY_FILTERS });

  async function fetchList(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      list.value = await materialApi.list({
        materialType: filters.value.materialType || undefined,
        period: filters.value.period || undefined,
        tag: filters.value.tag || undefined,
        keyword: filters.value.keyword || undefined,
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : '列表加载失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function create(payload: MaterialUpsertPayload): Promise<MaterialItem> {
    const row = await materialApi.create(payload);
    await fetchList();
    return row;
  }

  async function getById(id: string): Promise<MaterialItem> {
    selected.value = await materialApi.getById(id);
    return selected.value;
  }

  async function update(id: string, payload: MaterialUpsertPayload): Promise<MaterialItem> {
    const row = await materialApi.update(id, payload);
    await fetchList();
    return row;
  }

  async function remove(id: string): Promise<void> {
    await materialApi.remove(id);
    await fetchList();
  }

  function resetFilters(): void {
    filters.value = { ...EMPTY_FILTERS };
  }

  return { list, loading, error, selected, filters, fetchList, create, getById, update, remove, resetFilters };
});
