<template>
  <PlaceholderPanel
    title="设置 /settings · 模型 Key"
    subtitle="users、model_keys；Key 服务端加密、前端掩码"
    :items="[
      'GET /me 账号信息（邮箱前缀展示）；GET /model-keys 列表',
      'POST /model-keys/test 最小非流式连通测试，错误分类 401/403、429、超时、坏 JSON、5xx',
      'POST /model-keys 保存加密 Key；DELETE /model-keys/:id 移除后立即切回本地规则模式',
      '备份 GET /backup/export、POST /backup/import 不含密钥；会员位仅 plan 字段预留，不接支付',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
