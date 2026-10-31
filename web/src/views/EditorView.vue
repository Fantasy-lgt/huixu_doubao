<template>
  <PlaceholderPanel
    title="草稿编辑 /editor/:draftId?（五步状态机，不拆 URL）"
    subtitle="主表 drafts · 关联 materials、template_cards"
    :items="[
      'step 状态：①准备材料 → ②大纲确认 → ③逐页核对 → ④模板匹配 → ⑤导出；上一步可回退，主按钮随前置条件禁用',
      '① GET /materials 圈选子集 + PUT /drafts/:id；② POST /drafts/generate（local 优先，ai 可选）',
      '③ PUT /drafts/:id 条目编辑/排序/来源跳转；材料失效则 confirmedVersion 清空待重核',
      '④ POST /templates/match 返回 Top3；⑤ POST /exports/pptx（W3 接 pptxgenjs，本期占位）',
      '失败保护：AI 报错回退本地规则稿，保留版本，不自动重试收费调用',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
