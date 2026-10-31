<template>
  <PlaceholderPanel
    title="工作台 /"
    subtitle="默认主视图 · 数据来源 drafts、materials"
    :items="[
      'GET /me（守卫前置）；GET /drafts?kind=drafting 最近草稿列表；GET /materials/summary 摘要统计',
      '两张任务卡：新建月度汇报 / 年度汇总；新建草稿弹窗 NewDraftModal → POST /drafts 后跳 /editor/:draftId',
      '右侧待办提示与本月统计；空 / 加载 / 错误三态预留',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
