<template>
  <PlaceholderPanel
    title="年度回顾 /year（P1 子集）"
    subtitle="materials 确定性聚合 + entities 人确认入库"
    :items="[
      'GET /year/overview?year= 12 月覆盖热力 + 类型统计；缺月显式标待补，不主观推断',
      'GET /entities?kind= 候选列表；POST /entities/:id/confirm 人确认后才落库',
      'POST /year/compose 生成名单 + 时间线 + 来源引用；LLM 仅措辞连贯化，失败退化为纯文本清单',
      '不自动算绩效结论；跨月同一事项不重复计新增',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
