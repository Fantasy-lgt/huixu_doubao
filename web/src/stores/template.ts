import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface TemplateCardItem {
  id: string;
  name: string;
  builtIn: boolean;
}

// 模板卡片：内置/个人卡、规则匹配 Top3
export const useTemplateStore = defineStore('template', () => {
  const cards = ref<TemplateCardItem[]>([]);
  const matchedTop3 = ref<TemplateCardItem[]>([]);
  const selectedCard = ref<TemplateCardItem | null>(null);
  const loading = ref(false);

  // TODO(W6): 接入 GET /api/template-cards、匹配打分、保存为新卡
  async function fetchCards() {
    /* W6 填充 */
  }
  async function match(_draftId: string) {
    /* W6 填充：按页型/要点数/场景打分 Top3 */
  }
  function selectCard(card: TemplateCardItem) {
    selectedCard.value = card;
  }

  return { cards, matchedTop3, selectedCard, loading, fetchCards, match, selectCard };
});
