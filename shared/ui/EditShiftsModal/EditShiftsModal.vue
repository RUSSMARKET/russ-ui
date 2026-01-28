<template>
  <BaseModal
    :model-value="visible"
    title="Редактирование запланированных смен"
    :width="1400"
    :maxWidth="1400"
    @update:modelValue="(val: boolean) => { if (!val) $emit('close'); }"
  >
    <div>
      <FiltersBar
        :filters="filterConfigs"
        :model-value="filterValues"
        :show-mobile-button="false"
        @update:model-value="handleFiltersUpdate"
        @filter-change="handleFilterChange"
        @reset="handleReset"
      />
    </div>

    <div class="table-controls-section">
      <div class="controls-row">
        <div class="shift-settings-compact">
          <span class="shift-settings-label">
            <i class="pi pi-clock"></i>
            Интервал:
          </span>
          <div class="interval-select-group">
            <BaseSelect
              :model-value="selectedIntervalId"
              :options="plannedShiftIntervals.map((i) => ({
                id: i.id,
                name: formatIntervalFullLabel(i),
              }))"
              placeholder="Выберите интервал"
              :searchable="false"
              :useFixedPosition="true"
              @update:model-value="handleIntervalSelect"
            />
            <button
              type="button"
              class="interval-settings-btn"
              @click.stop="$emit('open-custom-interval')"
              title="Создать новый интервал"
            >
              <i class="pi pi-cog"></i>
            </button>
          </div>
        </div>

        <div v-if="filteredPlannedShiftsStaffList.length" class="pagination-compact">
          <button
            class="pagination-btn"
            :disabled="editModePage <= 1"
            @click="$emit('page-change', editModePage - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          <span class="pagination-info"
            >{{ editModePage }} / {{ editModeLastPage }}</span
          >
          <button
            class="pagination-btn"
            :disabled="editModePage >= editModeLastPage"
            @click="$emit('page-change', editModePage + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
          <select
            :model-value="editModePerPage"
            class="pagination-select"
            @change="$emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option
              v-for="option in editModePerPageOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-container-edit">
      <div class="table-responsive-edit">
        <table class="staff-table-edit">
          <thead>
            <tr>
              <th class="sticky-col-edit left-col-edit wide-col-edit">
                ФИО
              </th>
              <th class="wide-col-edit">Телефон</th>
              <th
                v-for="date in editModalMonthDates"
                :key="date"
                :class="{ 'weekend-header-edit': isWeekend(date) }"
              >
                <div class="date-number-edit">
                  {{ date.slice(-2) }}
                </div>
                <div class="weekday-name-edit">
                  {{ getWeekdayName(date) }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="staff in paginatedEditStaffList"
              :key="staff.id"
            >
              <td class="sticky-col-edit left-col-edit wide-col-edit">
                <div class="staff-name-edit">
                  {{ staff.surname }} {{ staff.name }}
                  <span v-if="staff.patronymic">{{
                    staff.patronymic
                  }}</span>
                </div>
                <div v-if="staff.code" class="staff-code-edit">
                  Код: {{ staff.code }}
                </div>
              </td>
              <td class="wide-col-edit">{{ staff.phone }}</td>
              <td
                v-for="date in editModalMonthDates"
                :key="date"
                :class="[
                  'shift-checkbox-cell',
                  {
                    'has-pending': isPendingShiftSelection(
                      staff.id,
                      date
                    ),
                  },
                ]"
              >
                <span
                  v-if="hasShiftOnDate(staff.id, date) || isPendingShiftSelection(staff.id, date)"
                  class="shift-timezone-badge"
                >
                  {{ getShiftTimezoneLabel(staff.id, date) }}
                </span>
                <label
                  class="shift-checkbox-wrapper"
                  :class="{
                    'pending-shift': isPendingShiftSelection(
                      staff.id,
                      date
                    ),
                    'disabled-past-date': isPastDate(date),
                  }"
                >
                  <input
                    type="checkbox"
                    :checked="
                      hasShiftOnDate(staff.id, date) ||
                      isPendingShiftSelection(staff.id, date)
                    "
                    :disabled="isPastDate(date)"
                    @change="
                      $emit('toggle-shift', staff.id, date, $event)
                    "
                    class="shift-checkbox"
                    :class="{
                      'pending-checkbox': isPendingShiftSelection(
                        staff.id,
                        date
                      ),
                    }"
                    :title="getShiftTooltip(staff.id, date)"
                  />
                  <span
                    class="checkbox-custom"
                    :class="{
                      'pending-custom': isPendingShiftSelection(
                        staff.id,
                        date
                      ),
                    }"
                  ></span>
                  <span
                    v-if="hasShiftOnDate(staff.id, date)"
                    class="shift-time-display"
                  >
                    {{ getShiftDisplayTime(staff.id, date) }}
                  </span>
                  <span
                    v-else-if="
                      isPendingShiftSelection(staff.id, date)
                    "
                    class="shift-time-display pending"
                  >
                    {{ getPendingShiftDisplayTime(staff.id, date) }}
                  </span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="loading"
        class="table-loading-overlay"
      >
        <div class="table-loading-content">
          <span class="spinner"></span>
          <span class="table-loading-text">Обновляем данные…</span>
        </div>
      </div>
      <div
        v-if="
          !loading && filteredPlannedShiftsStaffList.length === 0
        "
        class="empty-shifts-message"
      >
        Нет сотрудников для отображения
      </div>
    </div>
    <template #footer>
      <button
        class="btn-primary"
        :disabled="!canSubmitPendingBatch"
        @click="$emit('submit')"
      >
        {{ isBatchSubmitting ? "Сохраняем…" : "Сохранить" }}
      </button>
      <button class="btn-cancel-modern" @click="$emit('close')">
        Закрыть
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FilterConfig } from '../FiltersBar/FiltersBar.vue';
import { FiltersBar } from '../FiltersBar';
import { BaseModal } from '../BaseModal';
import { BaseSelect } from '@/shared/ui';
import type { Staff, PlannedShiftInterval } from './types';

interface Props {
  visible: boolean;
  loading: boolean;
  search: string;
  projectFilter: string | number;
  pointFilter: string | number;
  month: number;
  year: number;
  projects: Array<{ id: number | string; name: string }>;
  points: Array<{ id: number | string; name: string }>;
  monthNames: string[];
  yearOptions: Array<{ id: number; name: string }>;
  plannedShiftIntervals: PlannedShiftInterval[];
  selectedIntervalId?: number | string | undefined;
  editModePage: number;
  editModeLastPage: number;
  editModePerPage: number;
  editModePerPageOptions: number[];
  filteredPlannedShiftsStaffList: Staff[];
  paginatedEditStaffList: Staff[];
  editModalMonthDates: string[];
  canSubmitPendingBatch: boolean;
  isBatchSubmitting: boolean;
  // Methods
  formatIntervalFullLabel: (interval: PlannedShiftInterval) => string;
  getWeekdayName: (date: string) => string;
  isWeekend: (date: string) => boolean;
  isPendingShiftSelection: (userId: number, date: string) => boolean;
  hasShiftOnDate: (userId: number, date: string) => boolean;
  getShiftTimezoneLabel: (userId: number, date: string) => string;
  getShiftDisplayTime: (userId: number, date: string) => string;
  getPendingShiftDisplayTime: (userId: number, date: string) => string;
  isPastDate: (date: string) => boolean;
  getShiftTooltip: (userId: number, date: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'close': [];
  'submit': [];
  'open-custom-interval': [];
  'page-change': [page: number];
  'per-page-change': [perPage: number];
  'search-change': [value: string];
  'search-submit': [];
  'project-filter-change': [value: string | number];
  'point-filter-change': [value: string | number];
  'month-change': [value: number];
  'year-change': [value: number];
  'interval-select': [value: number | string | undefined];
  'toggle-shift': [userId: number, date: string, event: Event];
  'reset-filters': [];
}>();

const filterConfigs = computed<FilterConfig[]>(() => [
  {
    key: 'search',
    type: 'search',
    label: 'Поиск',
    placeholder: 'Поиск по ФИО',
    onChange: () => emit('search-submit'),
  },
  {
    key: 'project',
    type: 'select',
    label: 'Проект',
    placeholder: 'Все проекты',
    options: [
      { id: '', name: 'Все' },
      ...props.projects.map((p) => ({ id: p.id, name: p.name })),
    ],
    searchable: false,
    onChange: (value) => emit('project-filter-change', value),
  },
  {
    key: 'point',
    type: 'select',
    label: 'Точка',
    placeholder: 'Все точки',
    options: [
      { id: '', name: 'Все' },
      ...props.points.map((p) => ({ id: p.id, name: p.name })),
    ],
    searchable: true,
    onChange: (value) => emit('point-filter-change', value),
  },
  {
    key: 'month',
    type: 'select',
    label: 'Месяц',
    placeholder: 'Месяц',
    options: props.monthNames.map((name, idx) => ({ id: idx + 1, name })),
    searchable: false,
    onChange: (value) => emit('month-change', value),
  },
  {
    key: 'year',
    type: 'select',
    label: 'Год',
    placeholder: 'Год',
    options: props.yearOptions,
    searchable: false,
    onChange: (value) => emit('year-change', value),
  },
]);

const filterValues = computed(() => ({
  search: props.search,
  project: props.projectFilter,
  point: props.pointFilter,
  month: props.month,
  year: props.year,
}));

const handleFiltersUpdate = (values: Record<string, any>) => {
  if (values.search !== undefined && values.search !== props.search) {
    emit('search-change', values.search);
  }
  if (values.project !== undefined && values.project !== props.projectFilter) {
    emit('project-filter-change', values.project);
  }
  if (values.point !== undefined && values.point !== props.pointFilter) {
    emit('point-filter-change', values.point);
  }
  if (values.month !== undefined && values.month !== props.month) {
    emit('month-change', values.month);
  }
  if (values.year !== undefined && values.year !== props.year) {
    emit('year-change', values.year);
  }
};

const handleFilterChange = (key: string, value: any) => {
  if (key === 'search') {
    emit('search-change', value);
  } else if (key === 'project') {
    emit('project-filter-change', value);
  } else if (key === 'point') {
    emit('point-filter-change', value);
  } else if (key === 'month') {
    emit('month-change', value);
  } else if (key === 'year') {
    emit('year-change', value);
  }
};

const handleReset = () => {
  emit('reset-filters');
};

const handleIntervalSelect = (value: number | string | undefined) => {
  emit('interval-select', value);
};
</script>

<style scoped>
.modal-section-modern.filters-section {
  padding: 20px;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  margin-bottom: 20px;
}

.table-controls-section {
  margin-bottom: 12px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  width: 100%;
  box-sizing: border-box;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid var(--russ-border);
}

@media (max-width: 768px) {
  .controls-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .shift-settings-compact {
    width: 100%;
    max-width: 100%;
    order: 1;
  }

  .pagination-compact {
    width: 100%;
    order: 2;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--russ-border);
    padding-top: 12px;
    justify-content: center;
  }

  .shift-settings-label {
    font-size: 11px;
  }

  .interval-select-group {
    min-width: 0;
  }
}

.shift-settings-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  max-width: 350px;
}

.shift-settings-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--russ-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shift-settings-label i {
  color: var(--russ-primary);
  font-size: 13px;
}

.interval-select-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  position: relative;
}

.interval-select-group :deep(.base-select-wrapper) {
  flex: 1;
}

.interval-select-group :deep(.base-select-combo) {
  height: 36px;
  min-height: 36px;
  padding: 8px 14px;
  font-size: 13px;
  border: none;
  background: var(--russ-bg-secondary);
  border-radius: 6px;
  transition: all 0.2s;
}

.interval-select-group :deep(.base-select-combo:hover) {
  background: var(--russ-bg-tertiary);
}

.interval-select-group :deep(.base-select-combo:focus) {
  background: white;
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.1);
}

.interval-select-group :deep(.base-select-arrow) {
  right: 12px;
}

.interval-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--russ-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.interval-settings-btn:hover {
  background: var(--russ-bg-tertiary);
  color: var(--russ-primary);
}

.interval-settings-btn i {
  font-size: 15px;
}

.pagination-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-left: 16px;
  border-left: 1px solid var(--russ-border);
}

.pagination-compact .pagination-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--russ-text-muted);
  border-radius: 6px;
}

.pagination-compact .pagination-btn:hover:not(:disabled) {
  background: var(--russ-bg-tertiary);
  color: var(--russ-primary);
}

.pagination-compact .pagination-info {
  font-size: 12px;
  padding: 0 8px;
  min-width: 45px;
  text-align: center;
  color: var(--russ-text-muted);
  font-weight: 500;
}

.pagination-compact .pagination-select {
  padding: 6px 10px;
  border: none;
  background: var(--russ-bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--russ-text-primary);
  cursor: pointer;
  height: 32px;
  min-height: 32px;
  transition: all 0.2s;
}

.pagination-compact .pagination-select:hover {
  background: var(--russ-bg-tertiary);
}

.pagination-compact .pagination-select:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 12px;
  color: var(--russ-text-muted);
  font-weight: 500;
}

.pagination-select {
  padding: 6px 10px;
  border: none;
  background: var(--russ-bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--russ-text-primary);
  cursor: pointer;
  height: 32px;
  min-height: 32px;
  transition: all 0.2s;
}


.table-container-edit {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.05),
    0 1.5px 4px rgba(0, 0, 0, 0.03);
  border: 1.5px solid var(--russ-border);
  margin-top: 16px;
  position: relative;
  padding-bottom: 12px;
}

.table-responsive-edit {
  flex: 1;
  max-height: min(65vh, 620px);
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.staff-table-edit {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: visible;
  box-shadow: 0 1px 4px rgba(33, 62, 137, 0.06);
}

.staff-table-edit th,
.staff-table-edit td {
  text-align: center;
  border-bottom: 1px solid var(--russ-bg-tertiary);
  border-right: 1px solid var(--russ-bg-tertiary);
  height: 45px;
  padding: 4px;
}

.staff-table-edit th:last-child,
.staff-table-edit td:last-child {
  border-right: none;
}

.staff-table-edit th {
  background: var(--russ-bg-blue-light);
  font-weight: 700;
  color: var(--russ-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 12px;
}

.weekend-header-edit {
  background: var(--russ-bg-disabled) !important;
  color: var(--russ-text-quaternary) !important;
}

.weekend-header-edit .date-number-edit {
  color: var(--russ-text-quaternary) !important;
  font-weight: 700;
}

.weekend-header-edit .weekday-name-edit {
  color: var(--russ-text-quaternary) !important;
  font-weight: 600;
}

.date-number-edit {
  font-size: 12px;
  font-weight: 700;
  color: var(--russ-primary);
  margin-bottom: 1px;
}

.weekday-name-edit {
  font-size: 9px;
  font-weight: 500;
  color: var(--russ-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.staff-table-edit tr:last-child td {
  border-bottom: none;
}

.staff-table-edit tr:nth-child(even) td {
  background: var(--russ-bg-quaternary);
}

.staff-table-edit tr:hover td {
  background: var(--russ-info-light);
}

.sticky-col-edit.left-col-edit {
  position: sticky;
  left: 0;
  background: var(--russ-bg-blue-light);
  z-index: 100;
}

.left-col-edit {
  left: 0;
  z-index: 30;
  text-align: left;
  padding-left: 12px;
}

.staff-table-edit thead th.left-col-edit {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 120;
  background: var(--russ-bg-blue-light);
}

.wide-col-edit {
  min-width: 90px !important;
  max-width: 140px;
  width: 200px;
  font-size: 12px;
  background: var(--russ-bg-blue-light);
  font-weight: 600;
  z-index: 5;
}

.staff-name-edit {
  font-weight: 600;
  padding: 5px;
  color: var(--russ-text-primary);
}

.staff-code-edit {
  font-size: 10px;
  color: var(--russ-text-tertiary);
  font-weight: 500;
}

.shift-checkbox-cell {
  padding: 4px !important;
  text-align: center;
  position: relative;
}

.shift-checkbox-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  min-height: 40px;
}

.shift-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--russ-border-dark);
  border-radius: 4px;
  background: white;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.shift-checkbox:checked ~ .checkbox-custom {
  background: var(--russ-primary);
  border-color: var(--russ-primary);
}

.shift-checkbox:checked ~ .checkbox-custom::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.shift-checkbox-wrapper:hover .checkbox-custom {
  border-color: var(--russ-primary);
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.1);
}

.shift-time-display {
  font-size: 9px;
  color: var(--russ-primary);
  font-weight: 600;
  white-space: nowrap;
  margin-top: 2px;
}

.shift-time-display.pending {
  color: var(--russ-accent-dark);
  font-weight: 700;
  background: var(--russ-info-light);
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid var(--russ-info-border);
}

.shift-timezone-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 7px;
  color: var(--russ-text-muted);
  font-weight: 600;
  background: var(--russ-bg-tertiary);
  padding: 1px 3px;
  border-radius: 3px;
  line-height: 1;
  border: 1px solid var(--russ-border-light);
  z-index: 5;
}

.shift-checkbox-cell.has-pending {
  background: var(--russ-info-light) !important;
  border: 1px solid var(--russ-info-border) !important;
  position: relative;
}

.shift-checkbox-cell.has-pending::before {
  content: "";
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: var(--russ-accent-light);
  border-radius: 50%;
  animation: pulse-pending 2s ease-in-out infinite;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

@keyframes pulse-pending {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.shift-checkbox-wrapper.pending-shift {
  position: relative;
}

.checkbox-custom.pending-custom {
  border-color: var(--russ-accent-light) !important;
  background: var(--russ-info-light) !important;
  border-width: 2.5px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 8px rgba(59, 130, 246, 0.3);
  animation: checkbox-pulse 2s ease-in-out infinite;
}

@keyframes checkbox-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2),
      0 0 8px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3),
      0 0 12px rgba(59, 130, 246, 0.5);
  }
}

.shift-checkbox.pending-checkbox:checked ~ .checkbox-custom.pending-custom {
  background: var(--russ-accent-light) !important;
  border-color: var(--russ-accent) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3),
    0 0 10px rgba(59, 130, 246, 0.4);
}

.shift-checkbox-wrapper.pending-shift:hover .checkbox-custom.pending-custom {
  border-color: var(--russ-accent) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3),
    0 0 12px rgba(59, 130, 246, 0.5);
}

.shift-checkbox-wrapper.disabled-past-date {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.shift-checkbox-wrapper.disabled-past-date .checkbox-custom {
  background: var(--russ-bg-disabled);
  border-color: var(--russ-border-dark);
  cursor: not-allowed;
}

.shift-checkbox:disabled ~ .checkbox-custom {
  background: var(--russ-bg-disabled);
  border-color: var(--russ-border-dark);
  cursor: not-allowed;
}

.shift-checkbox:disabled ~ .checkbox-custom::after {
  display: none;
}

.shift-checkbox-wrapper.disabled-past-date:hover .checkbox-custom {
  border-color: #d1d5db;
  box-shadow: none;
}

.table-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.table-loading-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--russ-border-dark);
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-primary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--russ-border-light);
  border-top-color: var(--russ-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-loading-text {
  font-size: 13px;
}

.empty-shifts-message {
  padding: 40px;
  text-align: center;
  color: var(--russ-text-muted);
  font-size: 14px;
}

.btn-primary {
  padding: 10px 24px;
  background: var(--russ-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--russ-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel-modern {
  padding: 10px 24px;
  background: white;
  color: var(--russ-text-muted);
  border: 1px solid var(--russ-border-light);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-modern:hover {
  background: var(--russ-bg-secondary);
  border-color: var(--russ-border-dark);
}
</style>
