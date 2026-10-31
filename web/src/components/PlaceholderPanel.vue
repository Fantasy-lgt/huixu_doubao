<template>
  <div class="ph">
    <h3>{{ title }}</h3>
    <p v-if="subtitle" class="sub">{{ subtitle }}</p>
    <ul v-if="items && items.length">
      <li v-for="(it, i) in items" :key="i">{{ it }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  items?: string[];
}>();
</script>

<style scoped>
.ph {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 18px 20px;
}
h3 {
  font-size: 15px;
  margin-bottom: 6px;
}
.sub {
  font-size: 12px;
  color: var(--ink-3);
  margin-bottom: 10px;
}
ul {
  padding-left: 18px;
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.9;
}
</style>
