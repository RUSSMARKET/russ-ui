<template>
  <div class="search-wrapper">
    <span class="search-icon"><i class="pi pi-search"></i></span>
    <input v-model="searchQuery" class="search-input" type="text" :placeholder="placeholder" @input="handleSearch" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  placeholder?: string;
  modelValue?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск',
  modelValue: ''
});

const emit = defineEmits<Emits>();

const searchQuery = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue;
});

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleSearch = () => {
  emit('search', searchQuery.value);
};
</script>

<style scoped>
.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  height: 48px;
  background: var(--russ-bg-blue-tint);
  border-radius: 12px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.search-wrapper:focus-within {
  background: var(--russ-bg-blue-tint);
  box-shadow: 0 0 0 2px var(--russ-accent-tint-12);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  color: var(--russ-text-tertiary);
  transition: color 0.2s ease;
}

.search-wrapper:focus-within .search-icon {
  color: var(--russ-text-quaternary);
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  background: var(--russ-accent-tint-12);
  border: 2px solid var(--russ-accent-tint-12);
  border-radius: 13px;
  min-height: 48px;
  height: 100%;
  padding: 0 25px 0 40px !important;
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  color: var(--russ-text-tertiary);
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--russ-accent-tint-40);
  background: var(--russ-accent-tint-18);
}

.search-input::placeholder {
  color: var(--russ-text-tertiary);
  opacity: 1;
  transition: color 0.2s ease;
  font-weight: 500;
}

.search-input:focus::placeholder {
  color: var(--russ-text-quaternary);
}

.search-wrapper:hover {
  background: var(--russ-bg-blue-tint);
}

.search-wrapper:hover .search-icon {
  color: var(--russ-text-quaternary);
}
</style>
