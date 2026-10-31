import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface DraftSection {
  id: string;
  title: string;
}

// 草稿与五步编辑器：当前草稿、step 状态机（1-5）、章节与来源
export const useDraftStore = defineStore('draft', () => {
  const draftId = ref<string | null>(null);
  const step = ref<number>(1);
  const sections = ref<DraftSection[]>([]);
  const sourceRefs = ref<string[]>([]);
  const saving = ref(false);

  // TODO(W3/W6): 接入草稿生成、逐节编辑、确认、导出；五步不拆 URL，仅内部 step
  async function generateDraft(_kind: string) {
    /* W3 填充：本地规则生成草稿 */
  }
  function setStep(next: number) {
    if (next >= 1 && next <= 5) step.value = next;
  }
  async function updateSection(_section: DraftSection) {
    /* W6 填充：编辑后标记待重核 */
  }
  async function confirmStep() {
    /* W6 填充：确认当前步、推进下一步 */
  }
  function reset() {
    draftId.value = null;
    step.value = 1;
    sections.value = [];
    sourceRefs.value = [];
  }

  return {
    draftId,
    step,
    sections,
    sourceRefs,
    saving,
    generateDraft,
    setStep,
    updateSection,
    confirmStep,
    reset,
  };
});
