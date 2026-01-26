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
              :class="[column.headerClass, { 'sortable': column.sortable !== false }]"
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
          <tr v-if="loading">
            <td class="table-loader-cell" :colspan="columns.length + (showActions ? 1 : 0)">
              <span class="loader"></span>
              <span>{{ loadingText }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in sortedItems" :key="item.id || index" class="table-row" :class="rowClass"
            @click="handleRowClick ? handleRowClick(item) : null">
            <td v-for="column in columns" :key="column.key" :class="column.cellClass">
              <slot :name="`cell-${column.key}`" :item="item" :column="column"
                :value="getNestedValue(item, column.key)">
                {{ getNestedValue(item, column.key) }}
              </slot>
            </td>
            <td v-if="showActions">
              <slot name="actions" :item="item">
                <!-- Default actions slot -->
              </slot>
            </td>
          </tr>
          <tr v-if="!loading && sortedItems.length === 0">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="no-results">
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

interface TableColumn {
  key: string
  header: string
  headerClass?: string
  cellClass?: string
  sortable?: boolean
  filterable?: boolean
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

const filteredItems = computed(() => {
  let filtered = props.items

  // Apply column filters
  Object.entries(columnFilters.value).forEach(([columnKey, filterValue]) => {
    if (filterValue.trim()) {
      filtered = filtered.filter(item => {
        const value = getNestedValue(item, columnKey)
        return String(value).toLowerCase().includes(filterValue.toLowerCase())
      })
    }
  })

  return filtered
})

const sortedItems = computed(() => {
  if (!sortColumn.value) return filteredItems.value

  return [...filteredItems.value].sort((a, b) => {
    const aValue = getNestedValue(a, sortColumn.value)
    const bValue = getNestedValue(b, sortColumn.value)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortDirection.value === 'asc' ? -1 : 1
    if (bValue == null) return sortDirection.value === 'asc' ? 1 : -1

    // Convert to strings for comparison
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
</script>

<style scoped>
.table-container {
  width: 100%;
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
}

.base-table {
  width: 100%;
  min-width: 800px;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 0 0 14px 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.base-table::-webkit-scrollbar {
  display: none;
}

.base-table th,
.base-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  color: #374151;
  background: #fff;
}

.table-loader-cell {
  text-align: center;
  color: #2D2D2D;
  padding: 18px !important;
}

.base-table td {
  color: #2D2D2D;
}

.base-table th {
  background: #f7f7f7;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
}

.base-table thead tr th:first-child {
  border-top-left-radius: 0;
}

.base-table thead tr th:last-child {
  border-top-right-radius: 0;
}

.base-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 14px;
}

.base-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 14px;
}

.projects-section tbody tr:last-child td:last-child {
  display: flex;
  gap: 10px;
}

.table-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.table-row:hover {
  background: #f9fafb;
}

.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
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

/* Responsive styles */
@media (max-width: 768px) {
  .table-filters {
    padding: 12px;
  }

  .filters-row {
    gap: 12px;
  }

  .base-table {
    min-width: 600px;
  }

  .base-table th,
  .base-table td {
    padding: 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .table-filters {
    padding: 8px;
  }

  .filters-row {
    gap: 8px;
  }

  .base-table {
    min-width: 400px;
  }

  .base-table th,
  .base-table td {
    padding: 8px;
    font-size: 12px;
  }
}
</style>
