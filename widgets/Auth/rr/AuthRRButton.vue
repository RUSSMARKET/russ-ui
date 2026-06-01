<template>
  <button
    class="auth-rr-button"
    :class="[
      `auth-rr-button--${variant}`,
      { 'auth-rr-button--top-spacing': topSpacing },
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import './auth-rr-button.css';

withDefaults(
  defineProps<{
    label?: string;
    variant?: 'brand-primary' | 'brand-secondary';
    disabled?: boolean;
    topSpacing?: boolean;
  }>(),
  {
    label: '',
    variant: 'brand-primary',
    disabled: false,
    topSpacing: false,
  },
);
</script>
