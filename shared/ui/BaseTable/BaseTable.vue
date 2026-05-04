<template>
  <div class="table-container">
    <div v-if="showFilters" class="table-filters">
      <div class="filters-row">
        <ColumnFilter v-for="column in filterableColumns" :key="column.key" :label="column.header"
          :placeholder="`Фильтр по ${column.header.toLowerCase()}`" v-model="columnFilters[column.key]"
          @filter="(value) => handleColumnFilter(column.key, value)" />
      </div>
    </div>
    <div class="table-scroll">
      <table class="base-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key"
              :class="[
                column.headerClass,
                columnColClass(column),
                { 'sortable': column.sortable !== false },
              ]"
              @click="column.sortable !== false ? handleSort(column.key) : null">
              <div class="header-content">
                <span>{{ column.header }}</span>
                <div v-if="column.sortable !== false" class="sort-indicators">
                  <i class="pi pi-sort-up sort-icon"
                    :class="{ 'active': sortColumn === column.key && sortDirection === 'asc' }"></i>
                  <i class="pi pi-sort-down sort-icon"
                    :class="{ 'active': sortColumn === column.key && sortDirection === 'desc' }"></i>
                </div>
              </div>
            </th>
            <th v-if="showActions" class="actions-header">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="table-meta-row">
            <td class="table-loader-cell" :colspan="tableColspan">
              <span class="loader"></span>
              <span>{{ loadingText }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in sortedItems" :key="item.id || index" class="table-row" :class="rowClass"
            @click="handleRowClick ? handleRowClick(item) : null">
            <td v-for="column in columns" :key="column.key"
              :class="[column.cellClass, columnColClass(column)]"
              :data-label="column.header">
              <slot :name="`cell-${column.key}`" :item="item" :column="column"
                :value="getNestedValue(item, column.key)">
                {{ getNestedValue(item, column.key) }}
              </slot>
            </td>
            <td v-if="showActions" class="actions-cell" data-label="Действия">
              <div class="actions-cell-inner">
                <slot name="actions" :item="item">
                </slot>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && sortedItems.length === 0" class="table-meta-row">
            <td :colspan="tableColspan" class="no-results">
              {{ noResultsText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ColumnFilter } from '../ColumnFilter'
import { fuzzyMatch } from '../../utils/levenshtein'

interface TableColumn {
  key: string
  header: string
  headerClass?: string
  cellClass?: string
  sortable?: boolean
  filterable?: boolean
  sortKey?: string
  /** Скрыть колонку на экранах уже 900px (планшет в портрете). */
  hideBelowTablet?: boolean
  /** Скрыть колонку на экранах уже 640px (телефон). */
  hideOnMobile?: boolean
}

interface Props {
  columns: TableColumn[]
  items: any[]
  loading?: boolean
  loadingText?: string
  noResultsText?: string
  showActions?: boolean
  showFilters?: boolean
  rowClass?: string
  handleRowClick?: (item: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Загрузка...',
  noResultsText: 'Ничего не найдено',
  showActions: false,
  showFilters: false,
  rowClass: '',
  handleRowClick: undefined
})

const sortColumn = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const columnFilters = ref<Record<string, string>>({})

const filterableColumns = computed(() => {
  return props.columns.filter(col => col.filterable !== false)
})

const tableColspan = computed(() => {
  const columnsCount = props.columns.length + (props.showActions ? 1 : 0)
  return Math.max(1, columnsCount)
})

const filteredItems = computed(() => {
  let filtered = props.items

  Object.entries(columnFilters.value).forEach(([columnKey, filterValue]) => {
    if (filterValue.trim()) {
      filtered = filtered.filter(item => {
        const value = getNestedValue(item, columnKey)
        return fuzzyMatch(String(value), filterValue, 0.3)
      })
    }
  })

  return filtered
})

const sortedItems = computed(() => {
  if (!sortColumn.value) return filteredItems.value

  const column = props.columns.find(c => c.key === sortColumn.value)
  const sortByKey = column?.sortKey ?? sortColumn.value

  return [...filteredItems.value].sort((a, b) => {
    const aValue = getNestedValue(a, sortByKey)
    const bValue = getNestedValue(b, sortByKey)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortDirection.value === 'asc' ? -1 : 1
    if (bValue == null) return sortDirection.value === 'asc' ? 1 : -1

    // Если оба значения можно привести к числу — сравниваем как числа
    const aNum = Number(aValue)
    const bNum = Number(bValue)

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      if (aNum < bNum) return sortDirection.value === 'asc' ? -1 : 1
      if (aNum > bNum) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    }

    // Иначе сравниваем как строки
    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()

    if (aStr < bStr) return sortDirection.value === 'asc' ? -1 : 1
    if (aStr > bStr) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

const handleSort = (columnKey: string) => {
  if (sortColumn.value === columnKey) {
    // Toggle direction if same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, start with ascending
    sortColumn.value = columnKey
    sortDirection.value = 'asc'
  }
}

const handleColumnFilter = (columnKey: string, value: string) => {
  columnFilters.value[columnKey] = value
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : ''
  }, obj)
}

const columnColClass = (column: TableColumn) => {
  return {
    'col--hide-tablet': column.hideBelowTablet === true,
    'col--hide-mobile': column.hideOnMobile === true,
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
  min-width: 0;
  min-inline-size: 100%;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border-radius: 12px;
}

.table-filters {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px 12px 0 0;
  padding: 16px;
  margin-bottom: 0;
}

.filters-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.table-scroll {
  height: 100%;
  width: 100%;
  min-inline-size: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.base-table {
  width: 100%;
  min-width: 0;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0 0 14px 14px;
  overflow: hidden;
}

.base-table th,
.base-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--russ-border);
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  color: var(--russ-text-secondary);
  background: var(--russ-bg);
  vertical-align: top;
}

.table-loader-cell {
  text-align: center;
  color: var(--russ-text-primary);
  padding: 18px !important;
}

.base-table td {
  color: var(--russ-text-primary);
}

.base-table th {
  background: var(--russ-bg-secondary);
  text-align: left;
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.base-table thead tr th:first-child {
  border-top-left-radius: 0;
}

.base-table thead tr th:last-child {
  border-top-right-radius: 0;
}

@media (min-width: 641px) {
  .base-table tbody tr:last-child td:first-child {
    border-bottom-left-radius: 0px;
  }

  .base-table tbody tr:last-child td:last-child {
    border-bottom-right-radius: 0px;
  }
}

.table-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.table-row:hover {
  background: #f9fafb;
}

.actions-cell {
  padding: 0 10px !important;
  height: auto;
  vertical-align: middle;
}

.actions-cell-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  min-height: 0;
  padding-left: 0;
}

.actions-header {
  text-align: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable:hover {
  background: #f0f0f0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sort-indicators {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sort-icon {
  font-size: 12px;
  color: #d1d5db;
  transition: color 0.2s ease;
}

.sort-icon.active {
  color: #4f46e5;
}

.sort-icon:not(.active):hover {
  color: #9ca3af;
}

.no-results {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Планшет: компактнее, без принудительной ширины; скрываем второстепенные колонки */
@media (max-width: 1024px) and (min-width: 641px) {
  .table-filters {
    padding: 12px;
  }

  .filters-row {
    gap: 12px;
  }

  .base-table th,
  .base-table td {
    padding: 10px 12px;
    font-size: 14px;
  }

  .base-table th:not(.actions-header),
  .base-table td:not(.actions-cell) {
    max-width: min(20rem, 42vw);
    overflow-wrap: anywhere;
  }
}

@media (max-width: 899px) and (min-width: 641px) {
  .base-table :is(th, td).col--hide-tablet {
    display: none !important;
  }
}

/* Телефон: та же таблица, горизонтальный скролл, плотнее ячейки */
@media (max-width: 640px) {
  .table-filters {
    padding: 10px;
  }

  .filters-row {
    gap: 10px;
  }

  .table-scroll {
    overflow-x: auto;
  }

  .base-table {
    min-width: min(100%, 560px);
  }

  .base-table :is(th, td).col--hide-tablet,
  .base-table :is(th, td).col--hide-mobile {
    display: none !important;
  }

  .base-table th,
  .base-table td {
    padding: 8px 10px;
    font-size: 13px;
  }

  .header-content {
    gap: 6px;
  }

  .sort-icon {
    font-size: 10px;
  }
}
</style>
