<template>
  <div class="filters-bar-wrapper">
    <!-- Mobile filters button -->
    <div v-if="showMobileButton" class="mobile-filters-btn-wrapper">
      <button
        type="button"
        class="reporting-header-action reporting-header-action--filters"
        title="Фильтры"
        @click="toggleMobileFilters"
      >
        <span class="reporting-header-action-icon" aria-hidden="true">
          <i class="pi pi-filter"></i>
        </span>
        <span class="reporting-header-action-label reporting-header-action-label--single">Фильтры</span>
        <span v-if="hasActiveFilters" class="filter-indicator"></span>
      </button>
    </div>

    <!-- Mobile filters modal -->
    <div v-if="showMobileFilters" class="mobile-filters-overlay" @click="closeMobileFilters">
      <div class="mobile-filters-modal" @click.stop>
        <div class="mobile-filters-header">
          <h3>Фильтры</h3>
          <button class="close-button" @click="closeMobileFilters">×</button>
        </div>
        <div class="mobile-filters-content">
          <div class="filters-grid-mobile">
            <FilterItem v-for="(filter, index) in filters" :key="filterItemKey(filter, index)" :filter="filter"
              :model-value="getFilterValue(filter.key)" @update:model-value="handleFilterChange(filter.key, $event)" />
            <slot name="actions"></slot>
            <div v-if="showResetButton" class="filter-item filter-item--reset">
              <button class="reset-filters-btn" @click="handleReset" title="Сбросить все фильтры">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>Сбросить</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop filters -->
    <div class="filters-container desktop-filters" :class="{ 'always-visible': !showMobileButton && isInsideModal }"
      ref="wrapperRef">
      <div class="filters-grid">
        <FilterItem v-for="(filter, index) in filters" :key="filterItemKey(filter, index)" :filter="filter"
          :model-value="getFilterValue(filter.key)" @update:model-value="handleFilterChange(filter.key, $event)" />
        <slot name="actions"></slot>
        <div v-if="showResetButton" class="filter-item filter-item--reset">
          <button class="reset-filters-btn" @click="handleReset" title="Сбросить все фильтры">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
              <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>Сбросить</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../../styles/reporting-header-actions.css';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { FilterItem } from '../FilterItem';

export interface FilterConfig {
  key: string;
  type: 'select' | 'input' | 'date' | 'date-range' | 'search' | 'custom';
  label?: string;
  placeholder?: string;
  options?: Array<{ id: any; name: string }>;
  optionLabel?: string;
  optionValue?: string;
  searchable?: boolean;
  disabled?: boolean;
  /** Только для type: input — поле только для чтения (например, пока не выбран соседний фильтр). */
  readonly?: boolean;
  /** Только для type: input — нативный focus на поле ввода. */
  onInputFocus?: (e: FocusEvent) => void;
  loading?: boolean;
  width?: string;
  component?: any; // For custom components
  props?: Record<string, any>; // Additional props for the component
  onChange?: (value: any) => void;
}

interface Props {
  filters: FilterConfig[];
  modelValue: Record<string, any>;
  showResetButton?: boolean;
  showMobileButton?: boolean;
  mobileBreakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showResetButton: true,
  showMobileButton: true,
  mobileBreakpoint: 1024,
});

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>];
  'filter-change': [key: string, value: any];
  'reset': [];
}>();

const showMobileFilters = ref(false);
const isMobile = ref(false);
const isInsideModal = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

// Проверяем, находится ли компонент внутри модального окна
const checkIfInsideModal = () => {
  if (!wrapperRef.value) return;
  const modal = wrapperRef.value.closest(
    '.base-modal, .modal-overlay, .planned-shifts-page, .edit-shifts-embedded, [class*="modal"], [class*="Modal"], .staff-results-base-modal, .effectiveness-base-modal',
  );
  isInsideModal.value = !!modal;
};

const getFilterValue = (key: string) => {
  return props.modelValue[key];
};

/** Стабильный ключ: при подгрузке options у select пересоздаём строку, чтобы BaseSelect подхватил новый список. */
function filterItemKey(filter: FilterConfig, index: number) {
  const optLen =
    filter.type === 'select' && Array.isArray(filter.options) ? filter.options.length : 0;
  return `${filter.key}-${index}-${optLen}`;
}

const handleFilterChange = (key: string, value: any) => {
  const newValue = { ...props.modelValue, [key]: value };
  emit('update:modelValue', newValue);
  emit('filter-change', key, value);

  const filter = props.filters.find(f => f.key === key);
  if (filter?.onChange) {
    filter.onChange(value);
  }
};

const handleReset = () => {
  const resetValue: Record<string, any> = {};
  props.filters.forEach(filter => {
    if (filter.type === 'select') {
      resetValue[filter.key] = undefined;
    } else if (filter.type === 'date') {
      resetValue[filter.key] = null;
    } else if (filter.type === 'date-range') {
      resetValue[filter.key] = { from: null, to: null };
    } else if (filter.type === 'custom') {
      resetValue[filter.key] = null;
    } else {
      resetValue[filter.key] = '';
    }
  });
  emit('update:modelValue', resetValue);
  emit('reset');
  closeMobileFilters();
};

const hasActiveFilters = computed(() => {
  return Object.values(props.modelValue).some(value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
});

const toggleMobileFilters = () => {
  showMobileFilters.value = !showMobileFilters.value;
};

const openMobileFilters = () => {
  showMobileFilters.value = true;
};

const closeMobileFilters = () => {
  showMobileFilters.value = false;
};

// Expose methods for parent component
defineExpose({
  openMobileFilters,
  closeMobileFilters,
  toggleMobileFilters
});

const checkMobile = () => {
  isMobile.value = window.innerWidth < props.mobileBreakpoint;
};

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

onMounted(() => {
  nextTick(() => {
    checkIfInsideModal();
    setTimeout(checkIfInsideModal, 100);
  });
});
</script>

<style scoped>
.filters-bar-wrapper {
  /* Единая «компактная» высота контролов внутри панели фильтров.
     Глобальный :root --ui-control-height (48px) иначе переопределяет BaseSelect/InputText до первого var(). */
  --filters-bar-inner-height: var(--filters-bar-control-height, var(--filter-control-height-md, 40px));
  --filter-control-height-sm: 36px;
  --filter-control-height-md: 40px;
  --filter-control-height-lg: 48px;
  --filter-control-height: var(--filters-bar-inner-height);
  --ui-control-height: var(--filters-bar-inner-height);
  --base-select-height: var(--filters-bar-inner-height);
  --filter-control-radius: 10px;
  --filter-control-gap: 12px;
  --filter-control-padding-x: 12px;
  --filter-control-font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  --filter-control-font-size-sm: 13px;
  --filter-control-font-size-md: 14px;
  --filter-control-font-size-lg: 16px;
  --filter-control-font-size: var(--filter-control-font-size-md);
  --filter-control-font-weight: 500;
  --filter-control-line-height: 1.2;
  --filter-control-placeholder-color: var(--russ-text-quaternary);
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-filters-btn-wrapper {
  display: none;
  margin-bottom: 0;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
}

.mobile-filters-btn-wrapper .reporting-header-action.reporting-header-action--filters {
  width: 100%;
}

.filters-container {
  display: flex;
  align-items: flex-end;
  background: linear-gradient(135deg, var(--russ-bg) 0%, var(--russ-bg-secondary) 100%);
  border: 1px solid var(--russ-border-light);
  border-radius: 16px;
  box-shadow: 0 4px 20px var(--russ-shadow-primary-light);
  padding: 15px 20px;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--filter-control-gap);
  flex: 1 1 auto;
  align-items: end;
  width: 100%;
}

.filters-grid-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: auto;
}

.filter-item--reset {
  min-height: auto;
}

.filter-item--actions {
  min-height: auto;
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.reset-filters-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--filter-control-padding-x);
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: var(--filter-control-radius);
  color: #6b7280;
  font-family: var(--filter-control-font-family);
  font-size: var(--filter-control-font-size);
  font-weight: var(--filter-control-font-weight);
  line-height: var(--filter-control-line-height);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: var(--filter-control-height);
  min-height: var(--filter-control-height);
  justify-content: center;
}

.reset-filters-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #374151;
}

.reset-filters-btn:active {
  background: #d1d5db;
  transform: translateY(1px);
}

.reset-filters-btn svg {
  flex-shrink: 0;
}

/* Mobile filters modal */
.mobile-filters-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--russ-overlay);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mobile-filters-modal {
  background: white;
  width: 100%;
  max-width: 100%;
  max-height: 80vh;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.mobile-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.mobile-filters-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #213e89;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.mobile-filters-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-bar-wrapper {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .mobile-filters-btn-wrapper {
    display: flex;
    margin-left: 0;
    justify-content: stretch;
  }

  /* Скрываем desktop-фильтры на мобильных устройствах */
  .desktop-filters {
    display: none;
  }

  /* Если кнопка мобильных фильтров скрыта (showMobileButton=false), показываем desktop-фильтры */
  /* Это работает только в модальных окнах, где showMobileButton=false */
  /* Проверяем, что мы внутри модального окна */
  .base-modal .desktop-filters.always-visible,
  .modal-overlay .desktop-filters.always-visible,
  .planned-shifts-page .desktop-filters.always-visible,
  .edit-shifts-embedded .desktop-filters.always-visible,
  [class*="modal"] .desktop-filters.always-visible,
  [class*="Modal"] .desktop-filters.always-visible {
    display: flex !important;
  }
}

@media (min-width: 1025px) {
  .mobile-filters-btn-wrapper {
    display: none;
  }

  .desktop-filters {
    display: flex !important;
  }
}

@media (max-width: 900px) {
  .filters-container {
    padding: 14px 18px 10px 18px;
  }

  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px 14px;
  }
}

@media (max-width: 600px) {
  .filters-container {
    padding: 12px 16px 8px 16px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px 0;
  }

  .reset-filters-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 15px;
  }
}
</style>
