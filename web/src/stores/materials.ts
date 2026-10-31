import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface MaterialItem {
  id: string;
  title: string;
  materialType: string;
  period: string | null;
}

export interface MaterialFilters {
  materialType: string;
  tag: string;
  period: string;
  keyword: string;
}

// 材料库：列表、组合筛选、分页与 CRUD
export const useMaterialsStore = defineStore('materials', () => {
  const list = ref<MaterialItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const selected = ref<MaterialItem | null>(null);
  const filters = ref<MaterialFilters>({
    materialType: '',
    tag: '',
    period: '',
    keyword: '',
  });

  // TODO(W2): 接入 GET /api/materials（组合筛选+分页）、POST/PUT/DELETE
  async function fetchList() {
    /* W2 填充：带 filters 拉列表与 total */
  }
  async function create(_payload: Partial<MaterialItem>) {
    /* W2 填充：409 重复冲突处理 */
  }
  async function update(_id: string, _payload: Partial<MaterialItem>) {
    /* W2 填充 */
  }
  async function remove(_id: string) {
    /* W2 填充：联动草稿失效提示 */
  }

  return { list, total, loading, selected, filters, fetchList, create, update, remove };
});
