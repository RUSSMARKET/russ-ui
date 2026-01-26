<template>
  <div class="filter-item-wrapper" :class="filterItemClass">
    <label v-if="filter.label" class="filter-label">{{ filter.label }}</label>
    
    <!-- Select -->
    <BaseSelect
      v-if="filter.type === 'select'"
      :model-value="modelValue"
      :options="filter.options || []"
      :option-label="filter.optionLabel || 'name'"
      :option-value="filter.optionValue || 'id'"
      :placeholder="filter.placeholder"
      :searchable="filter.searchable !== false"
      :disabled="filter.disabled"
      :loading="filter.loading"
      :width="filter.width"
      @update:model-value="handleChange"
    />

    <!-- Input -->
    <InputText
      v-else-if="filter.type === 'input'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      variant="off"
      @update:model-value="handleChange"
    />

    <!-- Date -->
    <DatePicker
      v-else-if="filter.type === 'date'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      @update:model-value="handleChange"
    />

    <!-- Date Range -->
    <DateRangePicker
      v-else-if="filter.type === 'date-range'"
      :model-value="modelValue"
      :placeholder="filter.placeholder"
      :disabled="filter.disabled"
      @update:model-value="handleChange"
    />

    <!-- Search -->
    <div v-else-if="filter.type === 'search'" class="filter-search-wrapper">
      <input
        :value="modelValue"
        class="search-input-modern"
        :placeholder="filter.placeholder"
        @input="handleSearchInput"
        @keyup.enter="handleSearchEnter"
      />
      <button class="search-submit-btn" type="button" @click="handleSearchEnter" title="Найти">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Custom component -->
    <component
      v-else-if="filter.type === 'custom' && filter.component"
      :is="filter.component"
      :model-value="modelValue"
      v-bind="filter.props || {}"
      @update:model-value="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FilterConfig } from '../FiltersBar/FiltersBar.vue';
import { DatePicker } from '../DatePicker';
import { DateRangePicker } from '../DateRangePicker';
import { BaseSelect, InputText } from '@/shared/ui';

interface Props {
  filter: FilterConfig;
  modelValue: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

const filterItemClass = computed(() => {
  return {
    'filter-item--disabled': props.filter.disabled,
  };
});

const handleChange = (value: any) => {
  emit('update:modelValue', value);
};

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleSearchEnter = () => {
  if (props.filter.onChange) {
    props.filter.onChange(props.modelValue);
  }
};
</script>

<style scoped>
.filter-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  height: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
}


.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.04);
  height: 36px;
}

.filter-search-wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  background: #fff;
}

.search-input-modern {
  flex: 1;
  padding: 8px 0px 8px 12px;
  border: none;
  border-radius: 0;
  font-size: 15px;
  background: transparent;
  color: #1e293b;
  transition: all 0.2s ease;
  height: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.search-input-modern:focus {
  outline: none;
}

.search-input-modern::placeholder {
  color: #9ca3af;
}

.search-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
  height: 100%;
  flex-shrink: 0;
}

.search-submit-btn:hover {
  color: #6366f1;
}

.filter-item-wrapper :deep(.base-select-wrapper) {
  width: 100%;
}

.filter-item-wrapper :deep(.base-select-combo) {
  padding: 8px 16px 8px 12px;
  font-size: 15px;
  height: 36px;
  min-height: 36px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.04);
  color: #1e293b;
}

.filter-item-wrapper :deep(.base-select-combo:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  background: #fff;
}

.filter-item-wrapper :deep(.base-select-combo--readonly) {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.04);
  padding: 8px 16px 8px 12px;
  font-size: 15px;
  height: 36px;
  min-height: 36px;
  color: #1e293b;
}

.filter-item-wrapper :deep(.base-select-arrow) {
  right: 8px;
  width: 18px;
  height: 18px;
  background-size: 18px;
}

.filter-item-wrapper :deep(.input-wrapper) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  align-self: flex-end;
}

.filter-item-wrapper :deep(.custom-input) {
  height: 36px;
  min-height: 36px;
  box-sizing: border-box;
  font-size: 15px;
}

.filter-item-wrapper :deep(.date-picker-input) {
  font-size: 15px;
}

.filter-item-wrapper :deep(.date-display) {
  font-size: 15px;
}

.filter-item-wrapper :deep(.date-range-picker-input) {
  font-size: 15px;
}

.filter-item--disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
