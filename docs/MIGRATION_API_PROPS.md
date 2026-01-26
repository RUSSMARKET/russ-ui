# Миграция: Удаление прямых импортов API из компонентов

## Обзор

Компоненты библиотеки больше не импортируют API функции напрямую из приложения. Вместо этого они принимают функции API через props (dependency injection).

## Измененные компоненты

### 1. MagnetSearchModal

**Было:**
```vue
import { http } from '@/shared/api/http'
// Использование: http.defaults.baseURL
```

**Стало:**
```vue
<MagnetSearchModal
  :visible="visible"
  :search-results="results"
  :is-loading="loading"
  base-url="https://server.rusaifin.ru"
/>
```

**Props:**
- `baseURL` (required, string) - базовый URL для формирования ссылок на документы

---

### 2. RolePagesModal

**Было:**
```vue
import { FetchRolePages, RemovePageFromRole, UpdateRolePagePositions } from '@/pages/admin/api/index'
```

**Стало:**
```vue
<RolePagesModal
  :visible="visible"
  :roles="roles"
  :fetch-role-pages="fetchRolePages"
  :remove-page-from-role="removePageFromRole"
  :update-role-page-positions="updateRolePagePositions"
  @pages-updated="handlePagesUpdated"
/>
```

**Props:**
- `fetchRolePages` (required, function) - `(roleId: number) => Promise<{ pages: Page[] }>`
- `removePageFromRole` (required, function) - `(roleId: number, pageId: number) => Promise<void>`
- `updateRolePagePositions` (required, function) - `(roleId: number, pageIds: number[]) => Promise<void>`

**Пример использования:**
```typescript
import { FetchRolePages, RemovePageFromRole, UpdateRolePagePositions } from '@/pages/admin/api/index'

<RolePagesModal
  :visible="isModalVisible"
  :roles="roles"
  :fetch-role-pages="FetchRolePages"
  :remove-page-from-role="RemovePageFromRole"
  :update-role-page-positions="UpdateRolePagePositions"
/>
```

---

### 3. AddPagesModal

**Было:**
```vue
import { FetchRolePages, FetchAllPages, AddPageToRole } from '@/pages/admin/api/index'
```

**Стало:**
```vue
<AddPagesModal
  :visible="visible"
  :roles="roles"
  :fetch-role-pages="fetchRolePages"
  :fetch-all-pages="fetchAllPages"
  :add-page-to-role="addPageToRole"
  @pages-updated="handlePagesUpdated"
/>
```

**Props:**
- `fetchRolePages` (required, function) - `(roleId: number) => Promise<{ pages: Page[] }>`
- `fetchAllPages` (required, function) - `() => Promise<{ pages: Page[]; hidden?: Page[] }>`
- `addPageToRole` (required, function) - `(roleId: number, pageId: number) => Promise<void>`

**Пример использования:**
```typescript
import { FetchRolePages, FetchAllPages, AddPageToRole } from '@/pages/admin/api/index'

<AddPagesModal
  :visible="isModalVisible"
  :roles="roles"
  :fetch-role-pages="FetchRolePages"
  :fetch-all-pages="FetchAllPages"
  :add-page-to-role="AddPageToRole"
/>
```

---

### 4. StaffResultsModal

**Было:**
```vue
import { fetchStaffResultsTotal, exportStaffResultsTotal, fetchPlanReports } from '@/pages/reporting/api/index'
```

**Стало:**
```vue
<StaffResultsModal
  :visible="visible"
  :date-only="dateOnly"
  :fetch-staff-results-total="fetchStaffResultsTotal"
  :export-staff-results-total="exportStaffResultsTotal"
  :fetch-plan-reports="fetchPlanReports"
  @close="handleClose"
/>
```

**Props:**
- `fetchStaffResultsTotal` (required, function) - `(params: { date_from?: string; date_to?: string; project?: number; point?: number; user?: number; }) => Promise<StaffResultTotalResponse>`
- `exportStaffResultsTotal` (required, function) - `(params: { date_from?: string; date_to?: string; project?: number; point?: number; user?: number; export?: number; }) => Promise<Blob>`
- `fetchPlanReports` (required, function) - `(params: { date_from?: string; date_to?: string; }) => Promise<PlanReportResponse>`

**Пример использования:**
```typescript
import { fetchStaffResultsTotal, exportStaffResultsTotal, fetchPlanReports } from '@/pages/reporting/api/index'
import { http } from '@/shared/api/http'

<StaffResultsModal
  :visible="isModalVisible"
  :fetch-staff-results-total="fetchStaffResultsTotal"
  :export-staff-results-total="exportStaffResultsTotal"
  :fetch-plan-reports="fetchPlanReports"
/>
```

---

### 5. EffectivenessModal

**Было:**
```vue
import { exportEffectivenessReport, fetchShiftReportFieldsByProjects } from '@/pages/reporting/api/index'
```

**Стало:**
```vue
<EffectivenessModal
  :visible="visible"
  :export-effectiveness-report="exportEffectivenessReport"
  :fetch-shift-report-fields-by-projects="fetchShiftReportFieldsByProjects"
  @close="handleClose"
/>
```

**Props:**
- `exportEffectivenessReport` (required, function) - `(params: { date_from?: string; date_to?: string; project: number; point?: number; user_id?: number; options?: string; sort_by?: string; }) => Promise<Blob>`
- `fetchShiftReportFieldsByProjects` (required, function) - `() => Promise<ShiftReportFieldsByProjectsResponse>`

**Пример использования:**
```typescript
import { exportEffectivenessReport, fetchShiftReportFieldsByProjects } from '@/pages/reporting/api/index'

<EffectivenessModal
  :visible="isModalVisible"
  :export-effectiveness-report="exportEffectivenessReport"
  :fetch-shift-report-fields-by-projects="fetchShiftReportFieldsByProjects"
/>
```

---

### 6. EditShiftsModal

**Было:**
```vue
import type { Staff, PlannedShiftInterval } from '@/pages/reporting/api'
```

**Стало:**
```vue
import type { Staff, PlannedShiftInterval } from '@bibli/shared/ui'
```

Типы теперь экспортируются из библиотеки. Компонент не требует изменений в использовании, только обновите импорты типов.

**Экспортируемые типы:**
- `Staff`
- `PlannedShiftInterval`
- `Point`
- `ShiftDay`

---

## Экспортируемые типы

Все необходимые типы теперь экспортируются из библиотеки:

```typescript
import type { 
  Page, // из RolePagesModal
  Staff, 
  PlannedShiftInterval,
  Point,
  ShiftDay, // из EditShiftsModal
  ShiftReportField // из EffectivenessModal
} from '@bibli/shared/ui'
```

---

## Преимущества

1. **Разделение ответственности**: Библиотека не зависит от конкретной реализации API приложения
2. **Переиспользование**: Компоненты можно использовать в разных проектах с разными API
3. **Тестирование**: Легче тестировать компоненты, передавая моки функций API
4. **Гибкость**: Можно легко заменить реализацию API без изменения компонентов библиотеки

---

## Миграция существующего кода

Для миграции существующего кода:

1. Найдите все использования компонентов из списка выше
2. Добавьте необходимые props с функциями API
3. Обновите импорты типов (если используются)
4. Убедитесь, что функции API имеют правильные сигнатуры

Пример полной миграции:

**До:**
```vue
<template>
  <RolePagesModal
    v-model:visible="isVisible"
    :roles="roles"
    @pages-updated="handleUpdate"
  />
</template>
```

**После:**
```vue
<template>
  <RolePagesModal
    v-model:visible="isVisible"
    :roles="roles"
    :fetch-role-pages="FetchRolePages"
    :remove-page-from-role="RemovePageFromRole"
    :update-role-page-positions="UpdateRolePagePositions"
    @pages-updated="handleUpdate"
  />
</template>

<script setup>
import { FetchRolePages, RemovePageFromRole, UpdateRolePagePositions } from '@/pages/admin/api/index'
</script>
```
