<template>
  <div class="status-select-wrapper" ref="wrapperRef">
    <label v-if="label" :for="id" class="status-select-label">{{ label }}</label>

    <div class="status-select-container" :class="{ 'has-error': error, 'disabled': disabled, 'multiple': multiple }">
      <div class="status-select-trigger" :class="{ 'open': dropdownOpen, 'has-value': hasValue }"
        @click="toggleDropdown">
        <div class="status-select-content">
          <!-- Мультивыбор: показываем теги -->
          <template v-if="multiple">
            <div v-if="selectedOptions.length > 0" class="status-select-tags">
              <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="status-tag"
                @click.stop="removeOption(option)">
                <span v-if="option.color" class="status-color-dot" :style="{ backgroundColor: option.color }"></span>
                <span class="tag-text">{{ getOptionLabel(option) }}</span>
                <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
            </div>
            <span v-else class="status-select-placeholder">{{ placeholder }}</span>
          </template>

          <!-- Одиночный выбор -->
          <template v-else>
            <div v-if="modelValue && selectedOption" class="status-select-selected">
              <span v-if="selectedOption.color" class="status-color-dot"
                :style="{ backgroundColor: selectedOption.color }"></span>
              <span class="status-text">{{ getOptionLabel(selectedOption) }}</span>
            </div>
            <span v-else class="status-select-placeholder">{{ placeholder }}</span>
          </template>
        </div>

        <div class="status-select-arrow" :class="{ 'rotated': dropdownOpen }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="dropdownOpen" ref="dropdownRef" class="status-select-dropdown"
          :class="{ 'dropdown-upward': openUpward }" :style="dropdownStyles">
          <div class="status-select-search" v-if="searchable">
            <div class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Поиск статуса..." class="search-input"
              @focus="onSearchFocus" @input="onSearchInput" />
          </div>

          <div class="status-select-options">
            <div v-for="(option, index) in filteredOptions" :key="getOptionValue(option)" class="status-select-option"
              :class="{
                'selected': isOptionSelected(option),
                'highlighted': index === highlightedIndex
              }" @click="selectOption(option)" @mouseenter="highlightedIndex = index">
              <span v-if="option.color" class="status-color-dot" :style="{ backgroundColor: option.color }"></span>
              <span class="option-text">{{ getOptionLabel(option) }}</span>
              <div v-if="isOptionSelected(option)" class="check-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
            </div>

            <div v-if="filteredOptions.length === 0" class="no-options">
              <div class="no-options-icon">🔍</div>
              <span>Статусы не найдены</span>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <div v-if="error" class="status-select-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';

const props = defineProps({
  modelValue: [String, Number, Array],
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  label: String,
  placeholder: {
    type: String,
    default: 'Выберите статус'
  },
  error: String,
  disabled: Boolean,
  required: Boolean,
  id: String,
  optionLabel: {
    type: String,
    default: 'name'
  },
  optionValue: {
    type: String,
    default: 'id'
  },
  searchable: {
    type: Boolean,
    default: true
  },
  disableAutoPosition: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const wrapperRef = ref(null);
const searchInput = ref(null);
const dropdownRef = ref(null);
const dropdownOpen = ref(false);
const highlightedIndex = ref(-1);
const searchQuery = ref('');
const openUpward = ref(false);
const dropdownStyles = ref({});

const selectedValues = computed(() => {
  if (!props.modelValue) return [];
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return [props.modelValue];
});

const selectedOption = computed(() => {
  if (!props.modelValue || props.multiple) return null;
  return props.options.find(opt => getOptionValue(opt) == props.modelValue);
});

const selectedOptions = computed(() => {
  if (!props.multiple || !props.modelValue) return [];
  const values = Array.isArray(props.modelValue) ? props.modelValue : [];
  return props.options.filter(opt => values.includes(getOptionValue(opt)));
});

const hasValue = computed(() => {
  if (props.multiple) {
    return selectedOptions.value.length > 0;
  }
  return !!props.modelValue;
});

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options;
  }

  const query = searchQuery.value.toLowerCase();
  return props.options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(query);
  });
});

function getOptionLabel(option) {
  if (!option) return '';
  return typeof option === 'object' ? option[props.optionLabel] : option;
}

function getOptionValue(option) {
  if (!option) return '';
  return typeof option === 'object' ? String(option[props.optionValue]) : String(option);
}

function isOptionSelected(option) {
  const value = getOptionValue(option);
  if (props.multiple) {
    return selectedValues.value.includes(value);
  }
  return value == props.modelValue;
}

function calculateDropdownPosition() {
  if (!wrapperRef.value) return;

  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 768;
  
  // На мобильных используем больше доступного пространства
  const maxDropdownHeight = isMobile ? Math.min(viewportHeight * 0.6, 400) : 300;
  const dropdownHeight = Math.min(maxDropdownHeight, props.options.length * 50 + 100);
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  const minSpace = 50;
  // Если disableAutoPosition = true, всегда открываем вниз
  if (props.disableAutoPosition) {
    openUpward.value = false;
  } else {
    openUpward.value = spaceBelow < dropdownHeight + minSpace && spaceAbove > dropdownHeight + minSpace;
  }

  // Используем fixed позиционирование для отображения поверх модалок
  const baseZIndex = 1001; // Выше модалки (1000)
  
  if (openUpward.value) {
    dropdownStyles.value = {
      position: 'fixed',
      top: 'auto',
      bottom: `${viewportHeight - rect.top + 8}px`,
      left: `${rect.left}px`,
      right: 'auto',
      width: `${rect.width}px`,
      zIndex: baseZIndex,
      maxHeight: `${Math.min(spaceAbove - 8, maxDropdownHeight)}px`
    };
  } else {
    dropdownStyles.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      bottom: 'auto',
      left: `${rect.left}px`,
      right: 'auto',
      width: `${rect.width}px`,
      zIndex: baseZIndex,
      maxHeight: `${Math.min(spaceBelow - 8, maxDropdownHeight)}px`
    };
  }
}

function toggleDropdown() {
  if (props.disabled) return;

  if (dropdownOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  calculateDropdownPosition();
  dropdownOpen.value = true;
  highlightedIndex.value = -1;
  searchQuery.value = '';

  nextTick(() => {
    if (props.searchable && searchInput.value) {
      if (searchInput.value.focus) {
        try {
          searchInput.value.focus({ preventScroll: true });
        } catch (e) {
          searchInput.value.focus();
        }
      }
    }
  });
}

function closeDropdown() {
  dropdownOpen.value = false;
  highlightedIndex.value = -1;
  searchQuery.value = '';
}

function selectOption(option) {
  const value = getOptionValue(option);

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.indexOf(value);

    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }

    emit('update:modelValue', currentValues);
    emit('change', currentValues);
    highlightedIndex.value = -1;
  } else {
    emit('update:modelValue', value);
    emit('change', value);
    closeDropdown();
  }
}

function removeOption(option) {
  if (props.disabled || !props.multiple) return;

  const value = getOptionValue(option);
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const index = currentValues.indexOf(value);

  if (index > -1) {
    currentValues.splice(index, 1);
    emit('update:modelValue', currentValues);
    emit('change', currentValues);
  }
}

function onSearchFocus() {
  if (!dropdownOpen.value) {
    openDropdown();
  }
}

function onSearchInput() {
  highlightedIndex.value = -1;
}

function handleClickOutside(event) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target) &&
      dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
}

function handleKeydown(event) {
  if (!dropdownOpen.value) return;

  switch (event.key) {
    case 'Escape':
      closeDropdown();
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (highlightedIndex.value < filteredOptions.value.length - 1) {
        highlightedIndex.value++;
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        selectOption(filteredOptions.value[highlightedIndex.value]);
      }
      break;
  }
}

function handleResize() {
  if (dropdownOpen.value) {
    calculateDropdownPosition();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize);
});

watch(() => props.modelValue, () => {
});

watch(() => props.options, () => {
});
</script>

<style scoped>
.status-select-wrapper {
  position: relative;
  width: 100%;
  font-family: 'Onest', sans-serif;
  overflow: visible;
}

.status-select-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  line-height: 1.4;
}

.status-select-container {
  position: relative;
  width: 100%;
  overflow: visible;
  isolation: isolate;
}

.status-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px var(--russ-shadow-color);
}

.status-select-container.multiple .status-select-trigger {
  align-items: flex-start;
  padding-top: 10px;
  padding-bottom: 10px;
}

.status-select-trigger:hover:not(.disabled) {
  border-color: var(--russ-accent);
  box-shadow: 0 4px 12px var(--russ-shadow-accent-light);
}

.status-select-trigger.open {
  border-color: var(--russ-accent);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.status-select-trigger.has-value {
  border-color: var(--russ-accent);
}

.status-select-trigger.disabled {
  background: var(--russ-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.status-select-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
  height: 100%;
}

.status-select-container.multiple .status-select-content {
  gap: 8px;
}

.status-select-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
  transition: all 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.status-tag:hover {
  background: var(--russ-info-light);
  border-color: var(--russ-info-border);
}

.status-tag .status-color-dot {
  width: 10px;
  height: 10px;
  box-shadow: none;
}

.tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.tag-remove {
  width: 14px;
  height: 14px;
  color: var(--russ-text-muted);
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.status-tag:hover .tag-remove {
  color: var(--russ-error);
}

.status-select-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--russ-text-primary);
  font-weight: 500;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.status-select-placeholder {
  color: var(--russ-text-quaternary);
  font-weight: 400;
}

.status-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.status-select-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--russ-text-tertiary);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.status-select-arrow.rotated {
  transform: rotate(180deg);
  color: #1d4cd2;
}

.status-select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--russ-bg);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  z-index: 999;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  will-change: transform;
  contain: layout style paint;
}

.status-select-dropdown.dropdown-upward {
  /* Позиционирование управляется через inline стили */
  animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-select-search {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--russ-text-quaternary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 25px;
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--russ-text-secondary);
  background: #f9fafb;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--russ-accent);
  background: var(--russ-bg);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.status-select-options {
  max-height: 215px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.status-select-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.status-select-option:hover {
  background: #f8fafc;
}

.status-select-option.highlighted {
  background: #eff6ff;
}

.status-select-option.selected {
  background: #dbeafe;
  color: #1e40af;
}

.option-text {
  flex: 1;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #1d4cd2;
  flex-shrink: 0;
}

.no-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--russ-text-quaternary);
  font-size: 14px;
}

.no-options-icon {
  font-size: 24px;
  opacity: 0.6;
}

.status-select-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--russ-error);
  font-weight: 500;
}

/* Кастомный скроллбар */
.status-select-options::-webkit-scrollbar {
  width: 6px;
}

.status-select-options::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.status-select-options::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.status-select-options::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Адаптивность */
@media (max-width: 768px) {
  .status-select-trigger {
    min-height: 44px;
    padding: 10px 14px;
  }

  .status-select-dropdown {
    max-height: calc(100vh - 100px);
  }

  .status-select-options {
    max-height: calc(100vh - 200px);
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .status-select-search {
    padding: 12px;
    flex-shrink: 0;
  }
}

/* Анимации для hover эффектов */
.status-select-trigger,
.status-select-option {
  will-change: transform;
}

/* Фокус для accessibility */
.status-select-trigger:focus-visible {
  outline: none;
  border-color: var(--russ-accent);
  box-shadow: 0 0 0 3px var(--russ-shadow-accent-light);
}

.search-input:focus-visible {
  outline: none;
}
</style>