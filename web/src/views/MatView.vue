<template>
  <PlaceholderPanel
    title="材料库 /materials"
    subtitle="主表 materials · W2 实现"
    :items="[
      'GET /materials?type=&tag=&period=&keyword= 组合筛选（类型色标 / 标签 / 月份 / 关键词）',
      'POST /materials 粘贴或上传 txt/md；期间 + 正文指纹去重，重复返回 409 MATERIAL_DUPLICATE',
      'GET /materials/:id 详情；PUT 更新元信息（body 原文只读、版本自增）；DELETE 二次确认并联动草稿失效提示',
      '四态：data / empty（去新建入口）/ loading 骨架 / error 重试',
    ]"
  />
</template>

<script setup lang="ts">
import PlaceholderPanel from '@/components/PlaceholderPanel.vue';
</script>
