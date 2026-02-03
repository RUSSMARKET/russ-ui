<template>
  <div :class="['p-card', 'card', $attrs.class]">
    <div v-if="$slots.title" class="p-card-title"><slot name="title" /></div>
    <div v-if="$slots.content || $slots.default" class="p-card-content">
      <slot name="content"><slot /></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.p-card {
  background: var(--russ-bg);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--russ-shadow-color);
  padding: 1.25rem;
}
.p-card-title {
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
  color: var(--russ-text-primary);
}
.p-card-content {
  color: var(--russ-text-secondary);
}
</style>
