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
</style>
