<template>
  <PlaceholderPanel
    title="模板库 /templates"
    subtitle="主表 template_cards（内置 user_id=NULL 只读 + 个人元数据卡）"
    :items="[
      'GET /templates?scene= 卡片列表；页型 / 要点数 / 场景标签展示',
      'POST /templates/match 规则打分（页型 + 要点数 + 标签）返回 Top3，可手动替换',
      'POST /templates 仅建元数据卡（名称/场景/要点数/主色），不存真实母版文件',
      'B 层真实母版填充不在本期承诺，Spike-S3 仅评估',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
