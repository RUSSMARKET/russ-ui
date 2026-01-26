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
  height: 48px;
  background: #e8edff;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.search-wrapper:focus-within {
  background: #e8edff;
  box-shadow: 0 0 0 2px rgba(29, 76, 210, 0.05);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  color: #6b7280;
  transition: color 0.2s ease;
}

.search-wrapper:focus-within .search-icon {
  color: #9ca3af;
}

.search-input {
  width: 100%;
  background: #1d4cd212;
  border: 2px solid #1d4cd212;
  border-radius: 8px;
  min-height: 48px;
  height: 100%;
  padding: 0 25px 0 40px !important;
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  color: #6b7280;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #1d4cd240;
  background: #1d4cd218;
}

.search-input::placeholder {
  color: #6b7280;
  opacity: 1;
  transition: color 0.2s ease;
  font-weight: 500;
}

.search-input:focus::placeholder {
  color: #9ca3af;
}

.search-wrapper:hover {
  background: #e8edff;
}

.search-wrapper:hover .search-icon {
  color: #9ca3af;
}
</style>
