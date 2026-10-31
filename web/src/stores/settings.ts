import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ModelKeyItem {
  id: string;
  provider: string;
  label: string | null;
  maskedKey: string;
}

// 设置：模型 Key（掩码）、连通状态、本地规则模式
export const useSettingsStore = defineStore('settings', () => {
  const modelKeys = ref<ModelKeyItem[]>([]);
  const testing = ref(false);
  const providerConnected = ref(false);
  const localMode = ref(true);

  // TODO(W4): 接入 GET/POST/DELETE /api/model-keys（服务端加密存储、掩码返回）、连通测试
  async function fetchKeys() {
    /* W4 填充：只拿掩码列表 */
  }
  async function saveKey(_provider: string, _key: string, _label: string) {
    /* W4 填充：明文仅本次提交，落库加密 */
  }
  async function testKey(_id: string) {
    /* W4 填充：服务端代发连通测试 */
  }
  async function removeKey(_id: string) {
    /* W4 填充 */
  }

  return {
    modelKeys,
    testing,
    providerConnected,
    localMode,
    fetchKeys,
    saveKey,
    testKey,
    removeKey,
  };
});
