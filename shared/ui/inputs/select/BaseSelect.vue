<template>
  <div class="base-select-wrapper" ref="wrapperRef">
    <label v-if="label" :for="id" class="base-select-label">{{ label }}</label>
    <div class="base-select-container" ref="containerRef" :class="{ 'has-error': error, 'is-multiple': multiple }">
      <template v-if="props.searchable">
        <div v-if="multiple" class="base-select-combo base-select-combo--multiple" :style="comboMultipleStyle"
          @click="handleMultipleComboClick">
          <div v-if="selectedOptions.length > 0" class="base-select-tags">
            <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="base-select-tag"
              @click.stop="removeOption(option)">
              <span class="tag-text">{{ getOptionLabel(option) }}</span>
              <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <input :id="id" v-model="inputValue" :placeholder="multiplePlaceholder" :disabled="disabled || loading"
            :required="required && selectedOptions.length === 0" class="base-select-search-input"
            @focus="isMobile ? null : handleFocus" @click.stop="handleFocus" @input="onInput"
            @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev"
            @keydown.enter.prevent="selectHighlighted" @keydown.esc="closeDropdown" autocomplete="off"
            :inputmode="isMobile ? 'none' : undefined" :readonly="isMobile && !dropdownOpen" />
        </div>
        <input v-else :id="id" v-model="inputValue" :placeholder="placeholder" :disabled="disabled || loading"
          :required="required" class="base-select-combo" @focus="isMobile ? null : handleFocus" @click="handleFocus"
          @input="onInput" @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="selectHighlighted" @keydown.esc="closeDropdown" autocomplete="off"
          :inputmode="isMobile ? 'none' : undefined" :readonly="isMobile && !dropdownOpen" :style="comboStyle" />
      </template>
      <template v-else>
        <div v-if="multiple" class="base-select-combo base-select-combo--readonly base-select-combo--multiple"
          :style="comboReadonlyStyle" @click="!(disabled || loading) && toggleDropdown()">
          <div v-if="selectedOptions.length > 0" class="base-select-tags">
            <div v-for="option in selectedOptions" :key="getOptionValue(option)" class="base-select-tag"
              @click.stop="removeOption(option)">
              <span class="tag-text">{{ getOptionLabel(option) }}</span>
              <svg class="tag-remove" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <span v-else class="base-select-text base-select-placeholder">{{ placeholder || 'Выберите...' }}</span>
        </div>
        <div v-else class="base-select-combo base-select-combo--readonly" :style="comboReadonlyStyle"
          @click="!(disabled || loading) && toggleDropdown()">
          <span class="base-select-text">{{ inputValue || placeholder || 'Выберите...' }}</span>
        </div>
      </template>
      <span class="base-select-arrow" :class="{ 'active': dropdownOpen }" @click.stop="toggleDropdown"></span>
      <Teleport to="body">
        <ul v-if="dropdownOpen" ref="dropdownRef" class="base-select-dropdown" :class="{ 'dropdown-upward': openUpward }"
          :style="dropdownStyles">
          <li v-if="filteredOptions.length > 0" v-for="(option, idx) in filteredOptions" :key="getOptionValue(option)"
            :class="{ highlighted: idx === highlightedIndex, selected: isOptionSelected(option) }"
            @mousedown.prevent="selectOption(option)">
            <span class="option-label">{{ getOptionLabel(option) }}</span>
            <span v-if="multiple && isOptionSelected(option)" class="option-check" aria-hidden="true">✓</span>
          </li>
          <li v-else class="no-options">Нет совпадений</li>
        </ul>
      </Teleport>
    </div>
    <div v-if="error" class="base-select-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';
import { strictFuzzyMatch } from '../../../utils/levenshtein';
const props = defineProps({
  modelValue: [String, Number, Array],
  options: {
    type: Array,
    required: true,
  },
  label: String,
  placeholder: String,
  error: String,
  disabled: Boolean,
  required: Boolean,
  id: String,
  optionLabel: {
    type: String,
    default: 'name',
  },
  optionValue: {
    type: String,
    default: 'id',
  },
  width: {
    type: String,
    default: '',
  },
  height: {
    type: String,
    default: 'var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px))))',
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  max: {
    type: Number,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  useFixedPosition: {
    type: Boolean,
    default: false,
  },
  forceOpenUpward: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue', 'dropdown-close', 'max-reached']);

const comboStyle = computed(() => {
  const s = {};
  if (props.width) s.width = props.width;
  if (props.height) {
    s.height = props.height;
    s.minHeight = props.height;
  }
  return s;
});

const comboReadonlyStyle = computed(() => ({
  ...comboStyle.value,
  cursor: (props.disabled || props.loading) ? 'not-allowed' : 'pointer',
}));

const comboMultipleStyle = computed(() => {
  const s = { ...comboStyle.value };
  if (props.multiple) {
    s.height = 'auto';
    s.minHeight = props.height || comboStyle.value.minHeight;
  }
  return s;
});

const selectedValues = computed(() => {
  if (!props.multiple) return [];
  if (!props.modelValue) return [];
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

const selectedOptions = computed(() => {
  if (!props.multiple) return [];
  return props.options.filter((opt) =>
    selectedValues.value.some((selected) => isSameValue(selected, getOptionValue(opt)))
  );
});

const multiplePlaceholder = computed(() => {
  if (selectedOptions.value.length > 0) return '';
  return props.placeholder || 'Выберите...';
});

const inputValue = ref('');
const dropdownOpen = ref(false);
const highlightedIndex = ref(-1);
const wrapperRef = ref(null);
const containerRef = ref(null);
const dropdownRef = ref(null);
const openUpward = ref(false);
const dropdownStyles = ref({});
let lastSelectedLabel = '';

function normalizeSearchValue(value) {
  return String(value ?? '').toLowerCase().replace(/ё/g, 'е').trim();
}

function exactSearchMatch(value, query) {
  const normalizedValue = normalizeSearchValue(value);
  const normalizedQuery = normalizeSearchValue(query);
  return !!normalizedQuery && normalizedValue.includes(normalizedQuery);
}

// Определяем мобильное устройство
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
});

function getOptionLabel(option) {
  return typeof option === 'object' ? option[props.optionLabel] : option;
}
function getOptionValue(option) {
  return typeof option === 'object' ? option[props.optionValue] : option;
}

function isSameValue(a, b) {
  return String(a) === String(b);
}

function isOptionSelected(option) {
  const value = getOptionValue(option);
  if (props.multiple) {
    return selectedValues.value.some((selected) => isSameValue(selected, value));
  }
  return isSameValue(value, props.modelValue);
}

const filteredOptions = computed(() => {
  const allOption = props.options.find(opt => {
    const label = String(getOptionLabel(opt)).toLowerCase();
    const value = getOptionValue(opt);
    return label === 'все' || value === '' || value === 'all' || value === undefined || value === null;
  });
  const restOptions = props.options.filter(opt => opt !== allOption);
  
  // Если включен поиск, всегда фильтруем по поисковому запросу
  if (props.searchable) {
    const q = inputValue.value.trim();
    if (!q) {
      return allOption ? [allOption, ...restOptions] : restOptions;
    } else {
      // Ищем и по label, и по value (ID) с использованием расстояния Левенштейна
      const filtered = restOptions.filter(opt => {
        const label = String(getOptionLabel(opt));
        const value = getOptionValue(opt);
        return strictFuzzyMatch(label, q) || exactSearchMatch(value, q);
      });
      // Если есть совпадения с "Все", включаем его в начало
      const allMatches = allOption && strictFuzzyMatch(String(getOptionLabel(allOption)), q);
      return allMatches && allOption ? [allOption, ...filtered] : filtered;
    }
  }
  
  // Если поиск не включен, возвращаем все опции
  if (props.multiple) {
    return allOption ? [allOption, ...restOptions] : restOptions;
  }
  const selected = props.options.find(opt => getOptionValue(opt) === props.modelValue);
  if (selected) {
    const selLabel = String(getOptionLabel(selected)).toLowerCase();
    const selValue = getOptionValue(selected);
    if (selLabel === 'все' || selValue === '' || selValue === 'all' || selValue === undefined || selValue === null) {
      return allOption ? [allOption, ...restOptions] : props.options;
    }
  }
  return allOption ? [allOption, ...restOptions] : restOptions;
});

function calculateDropdownPosition() {
  if (!containerRef.value) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  // Используем ИСХОДНУЮ высоту viewport БЕЗ учета клавиатуры для стабильности расчетов
  // Это предотвращает изменение логики при открытии клавиатуры
  const viewportHeight = window.innerHeight; // Всегда используем полную высоту экрана
  const viewportWidth = window.innerWidth;

  // Ищем родительское модальное окно для учета его границ
  let modalContainer = containerRef.value.closest('.mobile-filters-modal');
  let modalRect = null;
  let availableHeight = viewportHeight;
  
  if (modalContainer) {
    modalRect = modalContainer.getBoundingClientRect();
    // Используем границы модального окна вместо viewport
    availableHeight = modalRect.height;
  }

  const optionsCount = filteredOptions.value.length || props.options.length;
  const estimatedDropdownHeight = Math.min(265, optionsCount * 40 + 20);
  
  let dropdownHeight = estimatedDropdownHeight;
  if (dropdownRef.value) {
    // Временно показываем dropdown для измерения высоты
    const wasVisible = dropdownRef.value.style.display !== 'none';
    if (!wasVisible) {
      dropdownRef.value.style.visibility = 'hidden';
      dropdownRef.value.style.display = 'block';
      dropdownRef.value.style.position = 'fixed';
      dropdownRef.value.style.top = '0';
      dropdownRef.value.style.left = '0';
    }
    dropdownHeight = dropdownRef.value.scrollHeight || dropdownRef.value.offsetHeight || estimatedDropdownHeight;
    if (!wasVisible) {
      dropdownRef.value.style.visibility = '';
      dropdownRef.value.style.display = '';
      dropdownRef.value.style.position = '';
      dropdownRef.value.style.top = '';
      dropdownRef.value.style.left = '';
    }
  }
  
  // Рассчитываем доступное пространство относительно модального окна или viewport
  let spaceBelow, spaceAbove;
  
  if (modalRect) {
    // Если есть модальное окно, рассчитываем относительно его границ
    const containerTopInModal = containerRect.top - modalRect.top;
    const containerBottomInModal = containerRect.bottom - modalRect.top;
    
    // Учитываем скролл внутри модального окна
    const modalContent = modalContainer.querySelector('.mobile-filters-content');
    let scrollTop = 0;
    if (modalContent) {
      scrollTop = modalContent.scrollTop || 0;
    }
    
    // Рассчитываем видимое пространство с учетом скролла
    const visibleTop = containerTopInModal - scrollTop;
    const visibleBottom = containerBottomInModal - scrollTop;
    
    spaceBelow = availableHeight - visibleBottom;
    spaceAbove = visibleTop;
  } else {
    // Иначе используем viewport
    spaceBelow = viewportHeight - containerRect.bottom;
    spaceAbove = containerRect.top;
  }
  
  // Увеличиваем минимальное пространство для мобильных устройств
  const minSpace = window.innerWidth <= 768 ? 120 : 50;
  
  // Если forceOpenUpward установлен, принудительно открываем вверх
  if (props.forceOpenUpward) {
    openUpward.value = true;
  } else {
    // Улучшенная логика: открываем вверх, если:
    // 1. Не хватает места внизу И есть достаточно места вверху
    // 2. Или места внизу меньше, чем вверху (приоритет отдаем большему пространству)
    // 3. Или селект находится в нижней части модального окна
    const needsUpward = spaceBelow < dropdownHeight + minSpace;
    const canFitUpward = spaceAbove >= dropdownHeight + minSpace;
    
    // Дополнительная проверка: если селект в нижней части модального окна
    let isInLowerPart = false;
    let isLastElement = false;
    
    if (modalRect) {
      const containerBottomInModal = containerRect.bottom - modalRect.top;
      // Если нижняя граница селекта находится в нижних 50% модального окна - считаем его в нижней части
      isInLowerPart = containerBottomInModal > (availableHeight * 0.5);
      
      // Проверяем, является ли этот селект последним в списке фильтров
      const filterItems = modalContainer.querySelectorAll('.filter-item-wrapper');
      if (filterItems.length > 0) {
        const lastItem = filterItems[filterItems.length - 1];
        const currentWrapper = containerRef.value.closest('.filter-item-wrapper');
        // Проверяем разными способами для надежности
        isLastElement = lastItem === currentWrapper || 
                       lastItem.contains(containerRef.value) ||
                       (currentWrapper && lastItem.contains(currentWrapper));
      }
    }
    
    // Для мобильных устройств в модальном окне - более агрессивная логика
    const isMobile = window.innerWidth <= 768;
    
    // Приоритет 1: Если это последний элемент в модальном окне на мобильном - ВСЕГДА открываем вверх (если есть хотя бы 150px вверху)
    if (isLastElement && modalRect && isMobile && spaceAbove >= 150) {
      openUpward.value = true;
    }
    // Приоритет 2: Если это последний элемент в модальном окне и есть место вверху - открываем вверх
    else if (isLastElement && canFitUpward && modalRect) {
      openUpward.value = true;
    }
    // Приоритет 2.5: Если это последний элемент в модальном окне (даже без достаточного места) - пробуем открыть вверх
    else if (isLastElement && modalRect && spaceAbove > 50) {
      openUpward.value = true;
    }
    // Приоритет 3: Если селект в нижней части модального окна и есть место вверху - открываем вверх
    else if (isInLowerPart && canFitUpward) {
      openUpward.value = true;
    }
    // Приоритет 4: Если на мобильном устройстве в модальном окне и места внизу меньше 300px - открываем вверх
    else if (isMobile && modalRect && spaceBelow < 300 && canFitUpward) {
      openUpward.value = true;
    }
    // Приоритет 5: Если не хватает места внизу, но есть место вверху - открываем вверх
    else if (needsUpward && canFitUpward) {
      openUpward.value = true;
    }
    // Приоритет 6: Если места внизу меньше, чем вверху, и вверху достаточно места - открываем вверх
    else if (spaceBelow < spaceAbove && canFitUpward && spaceBelow < dropdownHeight + minSpace) {
      openUpward.value = true;
    }
    // Приоритет 7: Если в модальном окне и места внизу меньше 250px - открываем вверх
    else if (modalRect && spaceBelow < 250 && canFitUpward) {
      openUpward.value = true;
    }
    // В остальных случаях открываем вниз
    else {
      openUpward.value = false;
    }
  }

  // Поверх BaseModal (по умолчанию 10000) и вложенных модалок (например 12000+).
  // Согласовано с DatePicker / TimePicker в bibli (100000).
  const baseZIndex = 100000;
  const safeMaxHeight = (value) => `${Math.max(120, Math.min(value, 265))}px`;
  
  if (openUpward.value) {
    dropdownStyles.value = {
      position: 'fixed',
      top: 'auto',
      bottom: `${viewportHeight - containerRect.top + 8}px`,
      left: `${containerRect.left}px`,
      right: 'auto',
      width: `${containerRect.width}px`,
      zIndex: baseZIndex,
      maxHeight: safeMaxHeight(spaceAbove - 8)
    };
  } else {
    dropdownStyles.value = {
      position: 'fixed',
      top: `${containerRect.bottom + 8}px`,
      bottom: 'auto',
      left: `${containerRect.left}px`,
      right: 'auto',
      width: `${containerRect.width}px`,
      zIndex: baseZIndex,
      maxHeight: safeMaxHeight(spaceBelow - 8)
    };
  }
}

function handleMultipleComboClick(event) {
  if (props.disabled || props.loading) return;
  if (event.target?.classList?.contains('base-select-search-input')) return;
  toggleDropdown();
}

function handleFocus(event) {
  if (props.multiple) {
    openDropdown();
    if (isMobile.value && event && event.target) {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
        setTimeout(() => window.scrollTo(scrollX, scrollY), 100);
      });
    }
    return;
  }

  // На мобильных устройствах предотвращаем автоматическую прокрутку при фокусе
  if (isMobile.value && event && event.target) {
    // Сохраняем текущую позицию прокрутки
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Открываем dropdown
    if (inputValue.value && inputValue.value === lastSelectedLabel) {
      inputValue.value = '';
    }
    openDropdown();
    
    // Восстанавливаем позицию прокрутки после небольшой задержки
    // Это предотвращает автоматическую прокрутку браузера к input
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
      // Дополнительная проверка после открытия dropdown
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY);
      }, 100);
    });
    return;
  }
  
  // Если поле содержит выбранное значение (не пустое и не является поисковым запросом), очищаем его
  if (inputValue.value && inputValue.value === lastSelectedLabel) {
    inputValue.value = '';
  }
  openDropdown();
}

function openDropdown() {
  if (!props.loading) {
    if (!dropdownOpen.value) {
      dropdownOpen.value = true;
      highlightedIndex.value = -1;
    }
    nextTick(() => {
      calculateDropdownPosition();
      // Дополнительная проверка после рендера для более точного расчета
      if (dropdownRef.value) {
        // Используем несколько таймаутов для надежного расчета после всех обновлений DOM
        setTimeout(() => {
          calculateDropdownPosition();
        }, 0);
        setTimeout(() => {
          calculateDropdownPosition();
        }, 50);
      }
    });
  }
}
function closeDropdown() {
  const wasOpen = dropdownOpen.value;
  dropdownOpen.value = false;
  highlightedIndex.value = -1;
  if (props.multiple) {
    inputValue.value = '';
  } else if (lastSelectedLabel) {
    inputValue.value = lastSelectedLabel;
  }
  if (wasOpen) {
    emit('dropdown-close');
  }
}
function toggleDropdown() {
  if (props.loading) return;
  if (!dropdownOpen.value) {
    dropdownOpen.value = true;
    highlightedIndex.value = -1;
    nextTick(() => {
      calculateDropdownPosition();
      // Дополнительная проверка после рендера для более точного расчета
      if (dropdownRef.value) {
        setTimeout(() => {
          calculateDropdownPosition();
        }, 0);
        setTimeout(() => {
          calculateDropdownPosition();
        }, 50);
      }
    });
  } else {
    closeDropdown();
  }
}
function onInput(e) {
  highlightedIndex.value = -1;
  openDropdown();
}
function selectOption(option) {
  const value = getOptionValue(option);

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.findIndex((selected) => isSameValue(selected, value));

    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      if (props.max != null && currentValues.length >= props.max) {
        emit('max-reached');
        return;
      }
      currentValues.push(value);
    }

    inputValue.value = '';
    highlightedIndex.value = -1;
    emit('update:modelValue', currentValues);
    return;
  }

  inputValue.value = getOptionLabel(option);
  lastSelectedLabel = getOptionLabel(option);
  emit('update:modelValue', value);
  closeDropdown();
}

function removeOption(option) {
  if (props.disabled || !props.multiple) return;

  const value = getOptionValue(option);
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const index = currentValues.findIndex((selected) => isSameValue(selected, value));

  if (index > -1) {
    currentValues.splice(index, 1);
    emit('update:modelValue', currentValues);
  }
}
function highlightNext() {
  if (!dropdownOpen.value) openDropdown();
  if (filteredOptions.value.length === 0 && !props.loading) return;
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++;
  }
}
function highlightPrev() {
  if (!dropdownOpen.value) openDropdown();
  if (filteredOptions.value.length === 0 && !props.loading) return;
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}
function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value]);
  }
}
function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target) && 
      dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    closeDropdown();
  }
}
function handleResize() {
  if (dropdownOpen.value) {
    calculateDropdownPosition();
  }
}

function handleVisualViewportResize() {
  if (dropdownOpen.value) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        calculateDropdownPosition();
      }, 50);
    });
  }
}

function syncSingleSelectDisplay() {
  if (props.multiple) {
    inputValue.value = '';
    lastSelectedLabel = '';
    return;
  }
  const selected = props.options.find((opt) => isSameValue(getOptionValue(opt), props.modelValue));
  if (selected) {
    inputValue.value = getOptionLabel(selected);
    lastSelectedLabel = getOptionLabel(selected);
  } else {
    inputValue.value = '';
    lastSelectedLabel = '';
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
  }
  syncSingleSelectDisplay();
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
    window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
  }
});
watch(() => props.modelValue, () => {
  syncSingleSelectDisplay();
});
watch(() => props.options, () => {
  syncSingleSelectDisplay();
});

watch(() => props.loading, (isLoading) => {
  if (isLoading && dropdownOpen.value) {
    dropdownOpen.value = false;
  }
});
</script>

<style scoped>
.base-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  position: relative;
  overflow: visible;
}

.base-select-label {
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-input-text);
  font-weight: 500;
  margin-bottom: 2px;
}

.base-select-container {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)))));
  overflow: hidden;
  isolation: isolate;
}

.base-select-container.is-multiple {
  overflow: visible;
}

.base-select-combo {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: var(--base-select-padding, 0 44px 0 var(--filter-control-padding-x, 14px));
  border: var(--base-select-border, 1.5px solid var(--russ-border));
  border-radius: var(--base-select-radius, var(--filter-control-radius, 10px));
  font-family: var(--filter-control-font-family, 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif);
  font-size: var(--base-select-font-size, var(--filter-control-font-size, var(--filter-control-font-size-md, 14px)));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  background: var(--base-select-bg, var(--russ-bg-quaternary));
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  color: var(--russ-text-primary);
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-combo:focus {
  outline: none;
  border-color: var(--base-select-focus-border, var(--russ-input-border-focus));
  box-shadow: var(--base-select-focus-shadow, inset 0 0 0 1.5px var(--russ-shadow-accent-light));
  background: var(--base-select-focus-bg, var(--russ-input-bg));
}

.base-select-combo:disabled {
  background: var(--russ-input-bg-disabled);
  color: var(--russ-text-quaternary);
  cursor: not-allowed;
}

.base-select-arrow {
  pointer-events: auto;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease;
  opacity: 1;
  z-index: 1;
  flex-shrink: 0;
}

.base-select-arrow.active {
  transform: translateY(-50%) rotate(180deg);
}

.base-select-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 100000;
  background: var(--russ-input-bg);
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  margin-top: 2px;
  max-height: 265px;
  overflow-y: auto;
  box-shadow: 0 4px 16px var(--russ-shadow-accent-light);
  list-style: none;
  padding: 0;
  will-change: transform;
  contain: layout style paint;
}

.base-select-dropdown.dropdown-upward {
  /* Позиционирование управляется через inline стили */
  margin-top: 0;
  margin-bottom: 0;
  box-shadow: 0 -4px 16px var(--russ-shadow-accent-light);
}

.base-select-dropdown li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-text-primary);
  transition: background 0.18s;
}

.base-select-dropdown li .option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-dropdown li .option-check {
  flex-shrink: 0;
  color: var(--russ-accent-dark, var(--russ-secondary-dark));
  font-weight: 700;
}

.base-select-dropdown li.selected {
  background: var(--russ-info-light);
}

.base-select-dropdown li.highlighted,
.base-select-dropdown li:hover {
  background: var(--russ-info-light);
}

.has-error .base-select-combo {
  border-color: var(--russ-input-error);
  background: var(--russ-error-light);
}

.base-select-error {
  color: var(--russ-input-error);
  font-size: clamp(10px,
      calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
      12px);
  margin-top: 2px;
}

.base-select-dropdown .no-options {
  padding: 12px 16px;
  color: var(--russ-text-quaternary);
  font-size: clamp(13px,
      calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))),
      15px);
  text-align: center;
  cursor: default;
}


.base-select-combo--readonly {
  position: relative;
  background: var(--base-select-bg, var(--russ-bg-quaternary));
  border: var(--base-select-border, 1.5px solid var(--russ-border));
  border-radius: var(--base-select-radius, var(--filter-control-radius, 10px));
  font-family: var(--filter-control-font-family, 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif);
  font-size: var(--base-select-font-size, var(--filter-control-font-size, var(--filter-control-font-size-md, 14px)));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  color: var(--russ-text-primary);
  padding: var(--base-select-padding, 0 44px 0 var(--filter-control-padding-x, 14px));
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)))));
  display: flex;
  align-items: center;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 100px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}



.base-select-text {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-combo--readonly:disabled {
  background: var(--russ-input-bg-disabled);
  color: var(--russ-text-quaternary);
  cursor: not-allowed;
}

.base-select-combo--multiple {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 44px 6px 10px;
  min-height: var(--base-select-min-height, var(--base-select-height, var(--ui-control-height, 40px)));
  height: auto;
  white-space: normal;
  overflow: visible;
  cursor: text;
}

.base-select-combo--multiple:focus-within {
  outline: none;
  border-color: var(--base-select-focus-border, var(--russ-input-border-focus));
  box-shadow: var(--base-select-focus-shadow, inset 0 0 0 1.5px var(--russ-shadow-accent-light));
  background: var(--base-select-focus-bg, var(--russ-input-bg));
}

.base-select-container.is-multiple .base-select-arrow {
  top: 14px;
  transform: none;
}

.base-select-container.is-multiple .base-select-arrow.active {
  transform: rotate(180deg);
}

.base-select-combo--readonly.base-select-combo--multiple {
  cursor: pointer;
}

.base-select-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.base-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border, var(--russ-border));
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--russ-info-text, var(--russ-text-primary));
  cursor: pointer;
  flex-shrink: 0;
  max-width: 100%;
}

.base-select-tag:hover .tag-remove {
  color: var(--russ-error);
}

.base-select-tag .tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.base-select-tag .tag-remove {
  flex-shrink: 0;
  color: var(--russ-text-muted, var(--russ-text-tertiary));
}

.base-select-search-input {
  flex: 1 1 80px;
  min-width: 60px;
  border: none;
  outline: none;
  background: transparent;
  padding: 4px 2px;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  color: var(--russ-text-primary);
  box-shadow: none;
}

.base-select-search-input::placeholder {
  color: var(--russ-text-quaternary);
}

.base-select-search-input:disabled {
  cursor: not-allowed;
}

.base-select-placeholder {
  color: var(--russ-text-quaternary);
  font-weight: 400;
}
</style>
