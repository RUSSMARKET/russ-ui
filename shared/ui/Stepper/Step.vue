<template>
  <div :class="['step', props.class]" @click="$emit('click')">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  class: { type: String, default: '' }
})

defineEmits(['click'])
</script>

<style scoped>
.step {
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.step:hover {
  background: var(--russ-bg-hover, #f3f4f6);
}
</style>
