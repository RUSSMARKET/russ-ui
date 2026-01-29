<template>
  <div class="date-picker-wrapper" ref="wrapperRef">
    <div
      class="date-picker-input"
      :class="{ 'is-focused': isOpen, 'is-disabled': disabled }"
      @click="!disabled && toggleCalendar()"
    >
      <span class="date-display" :class="{ 'placeholder': !displayValue }">
        {{ displayValue || placeholder }}
      </span>
      <span class="calendar-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="calendar-dropdown"
        :style="dropdownStyles"
        ref="dropdownRef"
        @click.stop
      >
        <div class="calendar-header">
          <button class="calendar-nav-btn" @click="previousMonth" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="calendar-month-year">
            {{ monthYearLabel }}
          </div>
          <button class="calendar-nav-btn" @click="nextMonth" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="calendar-weekdays">
          <div v-for="day in weekdays" :key="day" class="calendar-weekday">{{ day }}</div>
        </div>

        <div class="calendar-days">
          <div
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            :class="{
              'is-other-month': day.isOtherMonth,
              'is-today': day.isToday,
              'is-selected': day.isSelected,
              'is-disabled': day.isDisabled
            }"
            @click="!day.isDisabled && selectDate(day.date)"
          >
            {{ day.day }}
          </div>
        </div>

        <div class="calendar-footer">
          <button class="calendar-today-btn" @click="selectToday" type="button">Сегодня</button>
          <button class="calendar-clear-btn" @click="clearDate" type="button">Очистить</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Teleport } from 'vue';

const props = defineProps({
  modelValue: [Date, String, null],
  placeholder: {
    type: String,
    default: 'Выберите дату'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  dateFormat: {
    type: String,
    default: 'yy-mm-dd'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const wrapperRef = ref(null);
const dropdownRef = ref(null);
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const dropdownStyles = ref({});

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const date = props.modelValue instanceof Date ? props.modelValue : new Date(props.modelValue);
  if (isNaN(date.getTime())) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
});

const monthYearLabel = computed(() => {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDate = props.modelValue
    ? (props.modelValue instanceof Date
        ? new Date(props.modelValue)
        : new Date(props.modelValue))
    : null;
  if (selectedDate) {
    selectedDate.setHours(0, 0, 0, 0);
  }
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const isOtherMonth = date.getMonth() !== currentMonth.value;
    const isToday = date.getTime() === today.getTime();
    const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
    
    days.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      day: date.getDate(),
      date: new Date(date),
      isOtherMonth,
      isToday,
      isSelected,
      isDisabled: false
    });
  }
  
  return days;
});

const toggleCalendar = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      calculatePosition();
    });
  }
};

const selectDate = (date) => {
  emit('update:modelValue', date);
  isOpen.value = false;
};

const selectToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectDate(today);
};

const clearDate = () => {
  emit('update:modelValue', null);
  isOpen.value = false;
};

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const calculatePosition = () => {
  if (!wrapperRef.value) return;
  
  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const estimatedHeight = 350;
  
  const openUpward = spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;
  
  dropdownStyles.value = {
    position: 'fixed',
    top: openUpward ? 'auto' : `${rect.bottom + 8}px`,
    bottom: openUpward ? `${viewportHeight - rect.top + 8}px` : 'auto',
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 1001
  };
};

const handleClickOutside = (event) => {
  if (
    isOpen.value &&
    wrapperRef.value &&
    !wrapperRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    isOpen.value = false;
  }
};

const handleResize = () => {
  if (isOpen.value) {
    calculatePosition();
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const date = newVal instanceof Date ? newVal : new Date(newVal);
    if (!isNaN(date.getTime())) {
      currentMonth.value = date.getMonth();
      currentYear.value = date.getFullYear();
    }
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
});
</script>

<style scoped>
.date-picker-wrapper {
  position: relative;
  width: 100%;
}

.date-picker-input {
  width: 100%;
  padding: 8px 16px 8px 12px;
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  font-size: 13px;
  height: 36px;
  min-height: 36px;
  background: var(--russ-bg-quaternary);
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  color: var(--russ-text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.date-picker-input:hover:not(.is-disabled) {
  border-color: var(--russ-border-light);
}

.date-picker-input.is-focused {
  border-color: var(--russ-secondary);
  box-shadow: 0 0 0 3px var(--russ-shadow-secondary);
  background: var(--russ-input-bg);
}

.date-picker-input.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--russ-input-bg-disabled);
}

.date-display {
  flex: 1;
  text-align: left;
  color: var(--russ-text-primary);
}

.date-display.placeholder {
  color: var(--russ-text-quaternary);
}

.calendar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-text-tertiary);
  flex-shrink: 0;
  margin-left: 8px;
}

.date-picker-input.is-focused .calendar-icon {
  color: var(--russ-secondary);
}

.calendar-dropdown {
  background: var(--russ-input-bg);
  border: 1.5px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--russ-shadow-color);
  padding: 16px;
  min-width: 280px;
  max-width: 320px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.calendar-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.calendar-nav-btn:hover {
  background: #e5e7eb;
  color: #213e89;
}

.calendar-month-year {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 8px 4px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  min-height: 36px;
}

.calendar-day:hover:not(.is-disabled):not(.is-other-month) {
  background: #f3f4f6;
}

.calendar-day.is-other-month {
  color: #d1d5db;
}

.calendar-day.is-today {
  background: #e0e7ff;
  color: #213e89;
  font-weight: 600;
}

.calendar-day.is-selected {
  background: #6366f1;
  color: #fff;
  font-weight: 600;
}

.calendar-day.is-selected.is-today {
  background: #6366f1;
  color: #fff;
}

.calendar-day.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.calendar-today-btn,
.calendar-clear-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-today-btn:hover {
  background: #f9fafb;
  border-color: #6366f1;
  color: #6366f1;
}

.calendar-clear-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}
</style>
