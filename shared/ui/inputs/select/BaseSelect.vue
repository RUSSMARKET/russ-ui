<template>
  <div class="base-select-wrapper" ref="wrapperRef">
    <label v-if="label" :for="id" class="base-select-label">{{ label }}</label>
    <div class="base-select-container" ref="containerRef" :class="{ 'has-error': error }">
      <template v-if="props.searchable">
        <input :id="id" v-model="inputValue" :placeholder="placeholder" :disabled="disabled || loading"
          :required="required" class="base-select-combo" @focus="handleFocus" @click="handleFocus" @input="onInput"
          @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="selectHighlighted" @keydown.esc="closeDropdown" autocomplete="off"
          :style="{ width: props.width, height: props.height, minHeight: props.height }" />
      </template>
      <template v-else>
        <div class="base-select-combo base-select-combo--readonly"
          :style="{ width: props.width, height: props.height, minHeight: props.height, cursor: (disabled || loading) ? 'not-allowed' : 'pointer' }"
          @click="!(disabled || loading) && toggleDropdown()">
          <span class="base-select-text">{{ inputValue || placeholder || 'Выберите...' }}</span>
        </div>
      </template>
      <span class="base-select-arrow" :class="{ 'active': dropdownOpen }" @click.stop="toggleDropdown"></span>
      <Teleport to="body">
        <ul v-if="dropdownOpen" ref="dropdownRef" class="base-select-dropdown" :class="{ 'dropdown-upward': openUpward }"
          :style="dropdownStyles">
          <li v-if="filteredOptions.length > 0" v-for="(option, idx) in filteredOptions" :key="getOptionValue(option)"
            :class="{ highlighted: idx === highlightedIndex }" @mousedown.prevent="selectOption(option)">
            {{ getOptionLabel(option) }}
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
const props = defineProps({
  modelValue: [String, Number],
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
    default: '',
  },
  searchable: {
    type: Boolean,
    default: false,
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
const emit = defineEmits(['update:modelValue']);
const inputValue = ref('');
const dropdownOpen = ref(false);
const highlightedIndex = ref(-1);
const wrapperRef = ref(null);
const containerRef = ref(null);
const dropdownRef = ref(null);
const openUpward = ref(false);
const dropdownStyles = ref({});
let lastSelectedLabel = '';

function getOptionLabel(option) {
  return typeof option === 'object' ? option[props.optionLabel] : option;
}
function getOptionValue(option) {
  return typeof option === 'object' ? option[props.optionValue] : option;
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
    const q = inputValue.value.trim().toLowerCase();
    if (!q) {
      return allOption ? [allOption, ...restOptions] : restOptions;
    } else {
      // Ищем и по label, и по value (ID)
      const filtered = restOptions.filter(opt => {
        const label = String(getOptionLabel(opt)).toLowerCase();
        const value = String(getOptionValue(opt)).toLowerCase();
        return label.includes(q) || value.includes(q);
      });
      // Если есть совпадения с "Все", включаем его в начало
      const allMatches = allOption && String(getOptionLabel(allOption)).toLowerCase().includes(q);
      return allMatches && allOption ? [allOption, ...filtered] : filtered;
    }
  }
  
  // Если поиск не включен, возвращаем все опции
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

  // Используем fixed позиционирование для отображения поверх модалок
  const baseZIndex = 1001; // Выше модалки (1000)
  
  if (openUpward.value) {
    dropdownStyles.value = {
      position: 'fixed',
      top: 'auto',
      bottom: `${viewportHeight - containerRect.top + 8}px`,
      left: `${containerRect.left}px`,
      right: 'auto',
      width: `${containerRect.width}px`,
      zIndex: baseZIndex,
      maxHeight: `${Math.min(spaceAbove - 8, 265)}px`
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
      maxHeight: `${Math.min(spaceBelow - 8, 265)}px`
    };
  }
}

function handleFocus() {
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
  dropdownOpen.value = false;
  highlightedIndex.value = -1;
  if (lastSelectedLabel) inputValue.value = lastSelectedLabel;
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
    dropdownOpen.value = false;
  }
}
function onInput(e) {
  highlightedIndex.value = -1;
  openDropdown();
}
function selectOption(option) {
  inputValue.value = getOptionLabel(option);
  lastSelectedLabel = getOptionLabel(option);
  emit('update:modelValue', getOptionValue(option));
  closeDropdown();
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
    // Небольшая задержка для корректного расчета после изменения viewport
    // Используем requestAnimationFrame для более плавного обновления
    requestAnimationFrame(() => {
      setTimeout(() => {
        calculateDropdownPosition();
      }, 50);
    });
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('mouseup', handleClickOutside);
  document.addEventListener('focusin', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
  // Обработчик для виртуальной клавиатуры на мобильных устройствах
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
  }
  const selected = props.options.find(opt => getOptionValue(opt) == props.modelValue);
  if (selected) {
    inputValue.value = getOptionLabel(selected);
    lastSelectedLabel = getOptionLabel(selected);
  }
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('mouseup', handleClickOutside);
  document.removeEventListener('focusin', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
    window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
  }
});
watch(() => props.modelValue, (val) => {
  const selected = props.options.find(opt => getOptionValue(opt) === val);
  if (selected) {
    inputValue.value = getOptionLabel(selected);
    lastSelectedLabel = getOptionLabel(selected);
  } else inputValue.value = '';
});
watch(() => props.options, (newOptions) => {
  const selected = newOptions.find(opt => getOptionValue(opt) === props.modelValue);
  if (!selected) {
    inputValue.value = '';
    lastSelectedLabel = '';
  }
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
  overflow: visible;
  isolation: isolate;
}

.base-select-combo {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 14px 50px 14px 16px;
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  font-size: clamp(13px,
      calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))),
      15px);
  background: var(--russ-bg-quaternary);
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
  border-color: var(--russ-secondary);
  box-shadow: 0 0 0 3px var(--russ-shadow-secondary);
  background: var(--russ-input-bg);
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
  background-image: url('/arrow-down.svg');
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
  z-index: 999;
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
  padding: 10px 16px;
  cursor: pointer;
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-text-primary);
  transition: background 0.18s;
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
  background: var(--russ-bg-quaternary);
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  font-size: clamp(13px,
      calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))),
      15px);
  color: var(--russ-text-primary);
  padding: 14px 50px 14px 16px;
  min-height: 20px;
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
</style>