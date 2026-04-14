<!--
  RuchnikBlockRequests - Компонент для управления ручниками на странице requests
  Для клиентов: только поиск и просмотр (без правой колонки)
  Для менеджеров: полный функционал
-->

<template>
  <div class="ruchnik-block" :class="{ 'ruchnik-block--modal-embed': embedInModal }">
    <div class="ruchnik-container" :class="{ 'ruchnik-container-client': !canManage }">
      <div class="ruchnik-list-column" :class="{ 'ruchnik-list-column-full': !canManage }">
        <h4 v-if="!embedInModal" class="ruchnik-section-title">Заявки агентов</h4>
        <div ref="filtersContainerRef" class="ruchnik-filters-container">
          <div v-if="singleRuchnikType" class="ruchnik-filter-type-chip-row">
            <span class="ruchnik-filter-type-label">Тип ручника</span>
            <span class="ruchnik-chip-static">
              <Chip :label="singleRuchnikTypeDisplay" selected />
            </span>
          </div>
          <FiltersBar
            :filters="ruchnikFilters"
            :model-value="filterModelSnapshot"
            :show-reset-button="hasActiveFilters"
            :show-mobile-button="false"
            @update:model-value="applyFilterModel"
          />
        </div>

        <div class="ruchnik-content">
          <div
            class="ruchnik-list-area"
            :class="{ 'ruchnik-list-area--busy': loading && items.length > 0 }"
          >
            <div v-if="loading && !items.length" class="ruchnik-loading">
              <span class="loader"></span>
              <span>Загрузка заявок...</span>
            </div>

            <template v-else>
          <div v-if="items.length > 0" class="ruchnik-list">
            <div v-for="item in items" :key="item.id" class="ruchnik-card">
              <div class="ruchnik-card-content">
                <div class="ruchnik-info">
                  <div>
                    <div class="ruchnik-code">{{ item.code }}</div>

                    <div class="ruchnik-user">
                      <template v-if="item.user && item.report && item.report.fio">
                        {{ formatUser(item.user) }} / {{ formatFio(item.report.fio) }}
                      </template>
                      <template v-else-if="item.user">
                        {{ formatUser(item.user) }}
                      </template>
                      <template v-else-if="item.report && item.report.fio">
                        {{ formatFio(item.report.fio) }}
                      </template>
                      <template v-else>
                        —
                      </template>
                    </div>
                    <div class="ruchnik-status">
                      <span class="status-indicator" :class="{
                        'status-confirmed': getStatus(item) === 'confirmed',
                        'status-pending': getStatus(item) === 'pending',
                        'status-not-confirmed': getStatus(item) === 'rejected'
                      }">
                        {{ getStatusText(item) }}
                      </span>
                      <span v-if="item.report && (item.report.type !== undefined && item.report.type !== null)"
                        class="status-meta status-type">
                        {{ item.report.type === '' ? 'Пустая' : item.report.type }}
                      </span>
                      <span v-if="item.report && item.report.date" class="status-meta status-date">
                        {{ formatReportDate(item.report.date) }}
                      </span>
                    </div>
                  </div>

                  <div v-if="showReportDetails && item.report" class="ruchnik-report">
                    <div class="report-row">
                      <i class="pi pi-user"></i>
                      <span>{{ formatFio(item.report.fio) }}</span>
                    </div>
                    <div class="report-row">
                      <i class="pi pi-tag"></i>
                      <span>{{ item.report.type === '' ? 'Пустая' : (item.report.type || '—') }}</span>
                    </div>
                    <div class="report-row">
                      <i class="pi pi-calendar"></i>
                      <span>{{ formatReportDate(item.report.date) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="canManage" class="ruchnik-actions">
                <button
                  class="ruchnik-edit-btn"
                  title="Редактировать"
                  type="button"
                  :disabled="loading"
                  @click="handleEdit(item)"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="ruchnik-remove-btn"
                  title="Удалить ручник"
                  type="button"
                  :disabled="loading"
                  @click="handleRemove(item)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="ruchnik-empty">
            <div class="ruchnik-empty-text">Нет заявок</div>
            <div class="ruchnik-empty-subtext">Заявки агентов не найдены</div>
          </div>

              <div
                v-if="loading && items.length"
                class="ruchnik-loading-overlay"
                role="status"
                aria-live="polite"
              >
                <span class="loader"></span>
                <span>Обновление списка…</span>
              </div>
            </template>
          </div>

          <!-- Пагинация: внутри .ruchnik-content, чтобы flex оставлял её внизу, список скроллился выше -->
          <div v-if="showPagination" class="ruchnik-pagination">
            <div class="pagination-compact">
              <div class="pagination-info-compact">
                <span class="page-info-text">{{ currentPage }} / {{ totalPages }}</span>
                <span class="total-info-text">{{ total }} шт.</span>
              </div>
              <div class="pagination-controls-compact">
                <select
                  v-model.number="localPerPage"
                  class="pagination-select-compact"
                  :disabled="loading"
                  @change="handlePerPageChange"
                >
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
                <button
                  type="button"
                  class="page-btn-compact"
                  :disabled="loading || currentPage <= 1"
                  aria-label="Предыдущая страница"
                  @click="handlePageChange(currentPage - 1)"
                >
                  <i class="pi pi-angle-left" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  class="page-btn-compact"
                  :disabled="loading || currentPage >= totalPages"
                  aria-label="Следующая страница"
                  @click="handlePageChange(currentPage + 1)"
                >
                  <i class="pi pi-angle-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="canManage" class="ruchnik-add-column">
        <h4 v-if="!isEditing" class="ruchnik-section-title">Добавить ручник</h4>

        <div class="ruchnik-add-form">
          <div v-if="isEditing" class="ruchnik-edit-mode">
            <div class="edit-header">
              <div class="edit-header-main">
                <div class="edit-header-icon" aria-hidden="true">
                  <i class="pi pi-pencil"></i>
                </div>
                <div class="edit-header-text">
                  <span class="edit-header-title">Редактирование</span>
                  <span class="edit-header-code">{{ editingRuchnik?.code }}</span>
                </div>
              </div>
              <div class="edit-header-actions">
                <button type="button" class="ruchnik-cancel-btn ruchnik-cancel-btn--toolbar" :disabled="editLoading" @click="cancelEdit">
                  Отмена
                </button>
                <button
                  type="button"
                  class="ruchnik-save-btn ruchnik-save-btn--toolbar"
                  :disabled="!editCode.trim() || editLoading"
                  @click="saveEdit"
                >
                  <span v-if="editLoading" class="loader"></span>
                  <i v-else class="pi pi-check"></i>
                  {{ editLoading ? 'Сохранение...' : 'Сохранить' }}
                </button>
              </div>
            </div>

            <div ref="editFormFiltersContainerRef" class="ruchnik-filters-container ruchnik-edit-filters">
              <div v-if="singleRuchnikType" class="ruchnik-filter-type-chip-row">
                <span class="ruchnik-filter-type-label">Тип ручника</span>
                <span class="ruchnik-chip-static">
                  <Chip :label="singleRuchnikTypeDisplay" selected />
                </span>
              </div>
              <FiltersBar
                :filters="editRuchnikFilters"
                :model-value="editFormModelSnapshot"
                :show-reset-button="false"
                :show-mobile-button="false"
                @update:model-value="applyEditFormModel"
              />
            </div>
          </div>

          <div v-if="!isEditing" ref="addFormFiltersContainerRef" class="ruchnik-filters-container">
            <div v-if="singleRuchnikType" class="ruchnik-filter-type-chip-row">
              <span class="ruchnik-filter-type-label">Тип ручника</span>
              <span class="ruchnik-chip-static">
                <Chip :label="singleRuchnikTypeDisplay" selected />
              </span>
            </div>
            <FiltersBar
              :filters="addRuchnikFilters"
              :model-value="addFormModelSnapshot"
              :show-reset-button="false"
              :show-mobile-button="false"
              @update:model-value="applyAddFormModel"
            />
          </div>

          <button v-if="!isEditing" class="ruchnik-add-btn"
            :disabled="!newRuchnikCode.trim() || addLoading" @click="handleAdd">
            <span v-if="addLoading" class="loader"></span>
            <i v-else class="pi pi-plus"></i>
            <span v-if="addLoading">
              {{ editingRuchnik ? 'Обновление...' : 'Добавление...' }}
            </span>
            <span v-else>
              {{ editingRuchnik ? 'Обновить ручник' : 'Добавить ручник' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useToast } from "bibli/shared/ui";
import { FiltersBar, Chip, type FilterConfig } from "@/shared/ui";

/** Тип ручника (передаётся со страницы или из shared api). */
export interface RuchnikType {
  id: number;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

interface Ruchnik {
  id: number;
  code: string;
  user_id?: number;
  date_match: boolean;
  created_at: string;
  updated_at: string;
  ruchnik_type?: RuchnikType | null;
  report?: {
    id: number;
    code: string;
    fio: string;
    type: string;
    date: string;
  } | null;
  user?: {
    id: number;
    name: string;
    surname: string;
    patronymic: string | null;
  };
}

interface Agent {
  id: number;
  name: string;
  surname: string;
  patronymic: string | null;
  email: string | null;
  phone: string;
  role_id: number;
  is_attached: boolean;
}

/** Функции API ручников — передаются со страницы (requests), чтобы bibli не зависел от @/pages. */
export type GetAgentsFn = () => Promise<Agent[]>;
export type UpdateRuchnikFn = (
  id: number,
  code: string,
  userId?: number,
  _pointId?: unknown,
  typeSlug?: string
) => Promise<void>;

interface Props {
  items: Ruchnik[];
  /** Загрузка списка агентов — передаётся со страницы (например из pages/requests/api или shared/api/ruchnik). */
  getAgents: GetAgentsFn;
  /** Обновление ручника — передаётся со страницы. */
  updateRuchnik: UpdateRuchnikFn;
  loading?: boolean;
  canManage?: boolean;
  searchQuery?: string;
  addLoading?: boolean;
  showReportDetails?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  perPage?: number;
  ruchnikTypes?: RuchnikType[];
  selectedType?: string | null;
  typesLoading?: boolean;
  selectedUserId?: number | null;
  /** Заголовок «Заявки агентов» снаружи (например в шапке BaseModal) — не дублировать внутри блока. */
  embedInModal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canManage: false,
  searchQuery: "",
  addLoading: false,
  showReportDetails: false,
  showPagination: false,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10,
  ruchnikTypes: () => [],
  selectedType: null,
  typesLoading: false,
  selectedUserId: null,
  embedInModal: false
});

const emit = defineEmits([
  "add",
  "remove",
  "edit",
  "search",
  "update",
  "page-change",
  "per-page-change",
  "type-change",
  "user-change"
]);

const newRuchnikCode = ref("");
const editingRuchnik = ref<Ruchnik | null>(null);
const localSearchQuery = ref(props.searchQuery || "");
const localSelectedType = ref<string | null>(props.selectedType || null);
const localSelectedUserId = ref<number | null>(props.selectedUserId || null);
const agents = ref<Agent[]>([]);
const agentsLoading = ref(false);
const editCode = ref("");
const editUserId = ref<number | null>(null);
const newUserId = ref<number | null>(null);
const editRuchnikTypeSlug = ref<string | null>(null);
const newRuchnikTypeSlug = ref<string | null>(props.selectedType || null);
const isEditing = ref(false);
const editLoading = ref(false);
const toast = useToast();

const localPerPage = ref(props.perPage);
const typeOptions = computed(() => props.ruchnikTypes || []);
/** Несколько типов — показываем выпадающий список; один — только подпись без выбора. */
const showTypeFilterSelect = computed(() => typeOptions.value.length !== 1);
const singleRuchnikType = computed(() =>
  typeOptions.value.length === 1 ? typeOptions.value[0] : null
);
const singleRuchnikTypeDisplay = computed(() => {
  const t = singleRuchnikType.value;
  if (!t) return "";
  const name = t.name && String(t.name).trim();
  return name || String(t.slug ?? "");
});

/** Пока не выбран тип в фильтре (несколько типов) — поле кода поиска только для чтения. */
const searchRequiresTypeChoice = computed(
  () => showTypeFilterSelect.value && !localSelectedType.value
);

const newCodeInputAllowed = computed(() => {
  const types = typeOptions.value;
  if (types.length === 0) return false;
  if (types.length === 1) return true;
  return !!newRuchnikTypeSlug.value;
});

const editCodeInputAllowed = computed(() => {
  const types = typeOptions.value;
  if (types.length === 0) return false;
  if (types.length === 1) return true;
  return !!editRuchnikTypeSlug.value;
});

const filtersContainerRef = ref<HTMLElement | null>(null);
const addFormFiltersContainerRef = ref<HTMLElement | null>(null);
const editFormFiltersContainerRef = ref<HTMLElement | null>(null);

/** Только цифры, макс. 11 для OTP. */
const sanitizeRuchnikDigits = (value: string, maxLen = 11) =>
  String(value || "").replace(/\D/g, "").slice(0, maxLen);

/** OTP: XXXXXX-X-XX..XXXX (6 цифр, дефис, 1 цифра, дефис, 2–4 цифры). */
const formatOtpCode = (digits: string): string => {
  const limited = sanitizeRuchnikDigits(digits, 11);
  const part1 = limited.slice(0, 6);
  const part2 = limited.slice(6, 7);
  const part3 = limited.slice(7, 11);
  let formatted = part1;
  if (part2) formatted += `-${part2}`;
  if (part3) formatted += `-${part3}`;
  return formatted;
};

/** Форматирование по типу: alfa — 7 цифр, otp — маска XXXXXX-X-XX..XXXX, иначе только [0-9-]. */
const formatCodeByType = (raw: string, typeSlug: string | null): string => {
  const slug = (typeSlug || "").toLowerCase();
  if (slug.includes("alfa")) {
    return sanitizeRuchnikDigits(raw, 7);
  }
  if (slug.includes("otp")) {
    return formatOtpCode(raw);
  }
  return String(raw || "").replace(/[^0-9-]/g, "");
};

const sanitizeRuchnikValue = (value: string) => value.replace(/[^0-9-]/g, "");

function focusFilterTypeSelect() {
  if (!showTypeFilterSelect.value) return;
  nextTick(() => {
    const root = filtersContainerRef.value;
    const combo = root?.querySelector(
      ".filters-grid .filter-item-wrapper:first-child .base-select-combo"
    ) as HTMLElement | undefined;
    combo?.focus?.();
    combo?.click?.();
  });
}

function focusNewRuchnikTypeSelect() {
  if (!showTypeFilterSelect.value) return;
  nextTick(() => {
    const root = addFormFiltersContainerRef.value;
    const combo = root?.querySelector(
      ".filters-grid .filter-item-wrapper:first-child .base-select-combo"
    ) as HTMLElement | undefined;
    combo?.focus?.();
    combo?.click?.();
  });
}

function focusEditRuchnikTypeSelect() {
  if (!showTypeFilterSelect.value) return;
  nextTick(() => {
    const root = editFormFiltersContainerRef.value;
    const combo = root?.querySelector(
      ".filters-grid .filter-item-wrapper:first-child .base-select-combo"
    ) as HTMLElement | undefined;
    combo?.focus?.();
    combo?.click?.();
  });
}

function onSearchFilterInputFocus(e: FocusEvent) {
  if (!searchRequiresTypeChoice.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
  focusFilterTypeSelect();
}

function onNewCodeFocus(e: FocusEvent) {
  if (newCodeInputAllowed.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
  focusNewRuchnikTypeSelect();
}

function onEditCodeFocus(e: FocusEvent) {
  if (editCodeInputAllowed.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
  focusEditRuchnikTypeSelect();
}

const getStatus = (item: Ruchnik): 'confirmed' | 'pending' | 'rejected' => {
  const hasReport = !!item.report;
  if (hasReport) return 'confirmed';
  if (item.date_match === true) return 'pending';
  return 'rejected';
};

const getStatusText = (item: Ruchnik): string => {
  const s = getStatus(item);
  if (s === 'confirmed') return 'Подтверждено';
  if (s === 'pending') return 'Ожидает';
  return 'Не подтверждено';
};

const formatReportDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString();
};

const formatFio = (fio: string) => {
  if (!fio || typeof fio !== 'string') return '—';
  const parts = fio
    .split(' ')
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '—';
  const surname = parts[0];
  const nameInitial = parts[1] ? parts[1].charAt(0) + '.' : '';
  const patronymicInitial = parts[2] ? parts[2].charAt(0) + '.' : '';
  return `${surname} ${nameInitial}${patronymicInitial}`.trim();
};

const formatUser = (user: { surname: string; name: string; patronymic?: string | null }) => {
  if (!user) return '—';
  const surname = user.surname || '';
  const nameInitial = user.name ? user.name.charAt(0) + '.' : '';
  const patronymicInitial = user.patronymic ? user.patronymic.charAt(0) + '.' : '';
  return `${surname} ${nameInitial}${patronymicInitial}`.trim();
};

const agentOptions = computed(() => {
  return agents.value.map(agent => {
    const surname = agent.surname || '';
    const name = agent.name || '';
    const patronymic = agent.patronymic || '';

    const fullName = [surname, name, patronymic].filter(Boolean).join(' ');

    return {
      ...agent,
      name: fullName || `Агент #${agent.id}`,
      displayName: fullName || `Агент #${agent.id}`
    };
  });
});

const ruchnikFilters = computed<FilterConfig[]>(() => {
  const items: FilterConfig[] = [];
  if (showTypeFilterSelect.value) {
    items.push({
      key: "typeSlug",
      type: "select",
      label: "Тип ручника",
      placeholder: "Все типы",
      options: typeOptions.value.map((t) => ({
        id: t.slug,
        name: (t.name && String(t.name).trim()) || String(t.slug ?? ""),
      })),
      optionLabel: "name",
      optionValue: "id",
      searchable: true,
      disabled: props.typesLoading,
    });
  }
  items.push({
    key: "search",
    type: "input",
    label: "Поиск по коду",
    placeholder: searchRequiresTypeChoice.value
      ? "Сначала выберите тип ручника"
      : "Введите код ручника...",
    readonly: searchRequiresTypeChoice.value,
    onInputFocus: onSearchFilterInputFocus,
  });
  if (props.canManage) {
    items.push({
      key: "agentId",
      type: "select",
      label: "Агент / РГ",
      placeholder: "Все агенты и РГ",
      options: agentOptions.value.map((a) => ({
        id: a.id,
        name: a.name,
      })),
      optionLabel: "name",
      optionValue: "id",
      searchable: true,
      disabled: agentsLoading.value,
      loading: agentsLoading.value,
    });
  }
  return items;
});

const filterModelSnapshot = computed(() => {
  const m: Record<string, unknown> = {
    search: localSearchQuery.value,
  };
  if (showTypeFilterSelect.value) {
    m.typeSlug = localSelectedType.value ?? undefined;
  }
  if (props.canManage) {
    m.agentId = localSelectedUserId.value ?? undefined;
  }
  return m;
});

function applyFilterModel(v: Record<string, unknown>) {
  const slugForFormat = showTypeFilterSelect.value
    ? ((v.typeSlug as string | undefined) ?? null)
    : localSelectedType.value;
  const rawSearch = String(v.search ?? "");
  const formattedSearch = slugForFormat
    ? formatCodeByType(rawSearch, slugForFormat)
    : sanitizeRuchnikValue(rawSearch);

  if (formattedSearch !== localSearchQuery.value) {
    localSearchQuery.value = formattedSearch;
    emit("search", formattedSearch);
    emit("page-change", 1);
  }

  if (showTypeFilterSelect.value) {
    const raw = v.typeSlug;
    const normalized =
      raw === undefined || raw === null || raw === ""
        ? null
        : String(raw);
    if (normalized !== localSelectedType.value) {
      localSelectedType.value = normalized;
      emit("type-change", normalized);
      emit("page-change", 1);
    }
  }

  if (props.canManage) {
    const raw = v.agentId;
    const aid =
      raw === undefined || raw === null || raw === ""
        ? null
        : Number(raw);
    const aidNorm = aid === null || Number.isNaN(aid) ? null : aid;
    if (aidNorm !== localSelectedUserId.value) {
      localSelectedUserId.value = aidNorm;
      emit("user-change", aidNorm);
      emit("page-change", 1);
    }
  }
}

const addRuchnikFilters = computed<FilterConfig[]>(() => {
  const items: FilterConfig[] = [];
  if (showTypeFilterSelect.value) {
    items.push({
      key: "typeSlug",
      type: "select",
      label: "Тип ручника",
      placeholder: "Все типы",
      options: typeOptions.value.map((t) => ({
        id: t.slug,
        name: (t.name && String(t.name).trim()) || String(t.slug ?? ""),
      })),
      optionLabel: "name",
      optionValue: "id",
      searchable: true,
      disabled: props.typesLoading,
    });
  }
  items.push({
    key: "code",
    type: "input",
    label: "Введите код",
    placeholder: !newCodeInputAllowed.value
      ? "Сначала выберите тип ручника"
      : "Введите код ручника...",
    readonly: !newCodeInputAllowed.value,
    onInputFocus: onNewCodeFocus,
  });
  items.push({
    key: "agentId",
    type: "select",
    label: "Агент / РГ",
    placeholder: "Все агенты и РГ",
    options: agentOptions.value.map((a) => ({
      id: a.id,
      name: a.name,
    })),
    optionLabel: "name",
    optionValue: "id",
    searchable: true,
    disabled: agentsLoading.value,
    loading: agentsLoading.value,
  });
  return items;
});

const addFormModelSnapshot = computed(() => {
  const m: Record<string, unknown> = {
    code: newRuchnikCode.value,
    agentId: newUserId.value ?? undefined,
  };
  if (showTypeFilterSelect.value) {
    m.typeSlug = newRuchnikTypeSlug.value ?? undefined;
  }
  return m;
});

function applyAddFormModel(v: Record<string, unknown>) {
  let slugForFormat: string | null = null;

  if (showTypeFilterSelect.value) {
    const raw = v.typeSlug;
    const normalized =
      raw === undefined || raw === null || raw === ""
        ? null
        : String(raw);
    if (normalized !== newRuchnikTypeSlug.value) {
      newRuchnikTypeSlug.value = normalized;
    }
    slugForFormat = newRuchnikTypeSlug.value || props.selectedType || null;
  } else if (singleRuchnikType.value?.slug) {
    slugForFormat = String(singleRuchnikType.value.slug);
  } else {
    slugForFormat = props.selectedType ? String(props.selectedType) : null;
  }

  const rawCode = String(v.code ?? "");
  const formattedCode = slugForFormat
    ? formatCodeByType(rawCode, slugForFormat)
    : sanitizeRuchnikValue(rawCode);

  if (formattedCode !== newRuchnikCode.value) {
    newRuchnikCode.value = formattedCode;
  }

  const rawAgent = v.agentId;
  const aid =
    rawAgent === undefined || rawAgent === null || rawAgent === ""
      ? null
      : Number(rawAgent);
  const aidNorm = aid === null || Number.isNaN(aid) ? null : aid;
  if (aidNorm !== newUserId.value) {
    newUserId.value = aidNorm;
  }
}

const editRuchnikFilters = computed<FilterConfig[]>(() => {
  const items: FilterConfig[] = [];
  if (showTypeFilterSelect.value) {
    items.push({
      key: "typeSlug",
      type: "select",
      label: "Тип ручника",
      placeholder: "Все типы",
      options: typeOptions.value.map((t) => ({
        id: t.slug,
        name: (t.name && String(t.name).trim()) || String(t.slug ?? ""),
      })),
      optionLabel: "name",
      optionValue: "id",
      searchable: true,
      disabled: props.typesLoading,
    });
  }
  items.push({
    key: "code",
    type: "input",
    label: "Введите код",
    placeholder: !editCodeInputAllowed.value
      ? "Сначала выберите тип ручника"
      : "Введите код ручника...",
    readonly: !editCodeInputAllowed.value,
    onInputFocus: onEditCodeFocus,
  });
  items.push({
    key: "agentId",
    type: "select",
    label: "Агент / РГ",
    placeholder: "Все агенты и РГ",
    options: agentOptions.value.map((a) => ({
      id: a.id,
      name: a.name,
    })),
    optionLabel: "name",
    optionValue: "id",
    searchable: true,
    disabled: agentsLoading.value,
    loading: agentsLoading.value,
  });
  return items;
});

const editFormModelSnapshot = computed(() => {
  const m: Record<string, unknown> = {
    code: editCode.value,
    agentId: editUserId.value ?? undefined,
  };
  if (showTypeFilterSelect.value) {
    m.typeSlug = editRuchnikTypeSlug.value ?? undefined;
  }
  return m;
});

function applyEditFormModel(v: Record<string, unknown>) {
  let slugForFormat: string | null = null;

  if (showTypeFilterSelect.value) {
    const raw = v.typeSlug;
    const normalized =
      raw === undefined || raw === null || raw === ""
        ? null
        : String(raw);
    if (normalized !== editRuchnikTypeSlug.value) {
      editRuchnikTypeSlug.value = normalized;
    }
    slugForFormat = editRuchnikTypeSlug.value || props.selectedType || null;
  } else if (singleRuchnikType.value?.slug) {
    slugForFormat = String(singleRuchnikType.value.slug);
  } else {
    slugForFormat = props.selectedType ? String(props.selectedType) : null;
  }

  const rawCode = String(v.code ?? "");
  const formattedCode = slugForFormat
    ? formatCodeByType(rawCode, slugForFormat)
    : sanitizeRuchnikValue(rawCode);

  if (formattedCode !== editCode.value) {
    editCode.value = formattedCode;
  }

  const rawAgent = v.agentId;
  const aid =
    rawAgent === undefined || rawAgent === null || rawAgent === ""
      ? null
      : Number(rawAgent);
  const aidNorm = aid === null || Number.isNaN(aid) ? null : aid;
  if (aidNorm !== editUserId.value) {
    editUserId.value = aidNorm;
  }
}

const handleAdd = () => {
  if (newRuchnikCode.value.trim()) {
    emit("add", {
      code: newRuchnikCode.value.trim(),
      userId: newUserId.value || undefined,
      ruchnikTypeSlug: newRuchnikTypeSlug.value || undefined,
      editingRuchnik: editingRuchnik.value || undefined
    });
    newRuchnikCode.value = "";
    newUserId.value = null;
    newRuchnikTypeSlug.value = props.selectedType || null;
  }
};

const handleRemove = (ruchnik: Ruchnik) => {
  emit("remove", ruchnik.id);
};

const handleEdit = (ruchnik: Ruchnik) => {
  editingRuchnik.value = ruchnik;
  editCode.value = ruchnik.code;
  editUserId.value = ruchnik.user_id || null;
  editRuchnikTypeSlug.value = ruchnik.ruchnik_type?.slug || null;
  isEditing.value = true;
  loadAgents();
};

const loadAgents = async () => {
  if (agentsLoading.value) return;
  agentsLoading.value = true;
  try {
    const agentsData = await props.getAgents();
    agents.value = agentsData;
  } catch (error) {
    console.error('Ошибка загрузки агентов:', error);
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список агентов',
      life: 3000,
    });
  } finally {
    agentsLoading.value = false;
  }
};

const saveEdit = async () => {
  if (!editingRuchnik.value || !editCode.value.trim()) return;

  editLoading.value = true;
  try {
    await props.updateRuchnik(
      editingRuchnik.value.id,
      editCode.value,
      editUserId.value || undefined,
      undefined,
      editRuchnikTypeSlug.value || undefined
    );

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Ручник обновлен',
      life: 3000,
    });

    const updatedRuchnik = {
      ...editingRuchnik.value,
      code: editCode.value,
      user_id: editUserId.value || undefined,
      ruchnik_type: editRuchnikTypeSlug.value
        ? typeOptions.value.find(type => type.slug === editRuchnikTypeSlug.value) || null
        : null
    };
    emit("update", updatedRuchnik);

    cancelEdit();
  } catch (error) {
    console.error('Ошибка сохранения ручника:', error);
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сохранить ручник',
      life: 3000,
    });
  } finally {
    editLoading.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editingRuchnik.value = null;
  editCode.value = "";
  editUserId.value = null;
  newRuchnikCode.value = "";
  editRuchnikTypeSlug.value = null;
};

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit("page-change", page);
  }
};

const handlePerPageChange = () => {
  emit("per-page-change", localPerPage.value);
};

const hasActiveFilters = computed(() => {
  const search = !!localSearchQuery.value;
  const user = !!localSelectedUserId.value;
  const multiType = typeOptions.value.length > 1;
  const typeChosen = multiType && !!localSelectedType.value;
  return search || user || typeChosen;
});

watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue || "";
});

watch(() => props.perPage, (newValue) => {
  localPerPage.value = newValue;
});

watch(
  () => [props.ruchnikTypes, props.selectedType] as const,
  ([types, selected]) => {
    const opts = types || [];
    if (opts.length === 1) {
      const slug = opts[0]?.slug;
      if (slug != null && slug !== "") {
        if (localSelectedType.value !== slug) {
          localSelectedType.value = slug;
          emit("type-change", slug);
        }
        if (!newRuchnikTypeSlug.value) {
          newRuchnikTypeSlug.value = slug;
        }
      }
      return;
    }
    localSelectedType.value = selected || null;
    if (!newRuchnikTypeSlug.value) {
      newRuchnikTypeSlug.value = selected || null;
    }
  },
  { deep: true, immediate: true }
);

watch(() => props.selectedUserId, (newValue) => {
  localSelectedUserId.value = newValue || null;
});

watch(localSelectedType, (slug) => {
  const q = localSearchQuery.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) {
    localSearchQuery.value = next;
    emit("search", next);
  }
});

watch(newRuchnikTypeSlug, (slug) => {
  const q = newRuchnikCode.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) {
    newRuchnikCode.value = next;
  }
});

watch(editRuchnikTypeSlug, (slug) => {
  if (!isEditing.value) return;
  const q = editCode.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) {
    editCode.value = next;
  }
});

onMounted(() => {
  if (props.canManage) {
    loadAgents();
  }
});

// Загружаем агентов при монтировании, если нужен фильтр
watch(() => props.canManage, (canManage) => {
  if (canManage && agents.value.length === 0) {
    loadAgents();
  }
}, { immediate: true });
</script>

<style scoped>
.ruchnik-block {
  --ruchnik-list-viewport-min: 365px;
  width: 100%;
  max-height: 650px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ruchnik-block--modal-embed {
  /* flex-basis: 0 - fill modal, scroll inside list */
  flex: 1 1 0%;
  min-height: 0;
  max-height: none;
  overflow: hidden;
}

.ruchnik-block--modal-embed .ruchnik-add-form {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.ruchnik-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: minmax(0, 1fr);
  align-content: stretch;
  gap: 32px;
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-container-client {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr);
}

.ruchnik-list-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  flex: 1 1 0%;
  overflow: hidden;
}

.ruchnik-section-title {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--russ-border);
}

.ruchnik-content {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-list-area {
  position: relative;
  flex: 1 1 0%;
  min-height: var(--ruchnik-list-viewport-min);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ruchnik-list-area--busy .ruchnik-list {
  opacity: 0.55;
}

.ruchnik-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  background: color-mix(in srgb, var(--russ-bg) 92%, transparent);
  pointer-events: none;
}

.ruchnik-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: var(--russ-text-primary);
  justify-content: center;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  border: 1px dashed var(--russ-border-dark);
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.ruchnik-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 0%;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--russ-text-muted) 42%, transparent) transparent;
  max-height: 450px;
}

.ruchnik-list::-webkit-scrollbar {
  width: 5px;
}

.ruchnik-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 999px;
}

.ruchnik-list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--russ-text-muted) 38%, transparent);
  border-radius: 999px;
  border: 1px solid transparent;
  background-clip: padding-box;
}

.ruchnik-list::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--russ-text-muted) 58%, transparent);
}

.ruchnik-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--russ-border-light);
  gap: 10px;
}

.ruchnik-card:hover {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-dark);
}

.ruchnik-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.ruchnik-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #6b9eff;
  color: var(--russ-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.ruchnik-info {
  display: flex;
  gap: 20px;
}

.ruchnik-code {
  font-weight: 600;
  color: var(--russ-text-primary);
  font-size: 15px;
}

.ruchnik-user {
  color: var(--russ-text-muted);
  font-size: 13px;
}

.ruchnik-status {
  margin-top: 4px;
}

.status-meta {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  background: var(--russ-bg-light);
  border: 1px solid var(--russ-border-dark);
}

.status-type {
  color: var(--russ-text-dark);
}

.status-date {
  color: var(--russ-text-dark);
}

.ruchnik-report {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.report-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--russ-text-secondary);
  font-size: 13px;
}

.report-row i {
  color: var(--russ-text-tertiary);
  font-size: 13px;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-confirmed {
  background-color: var(--russ-success-light);
  color: var(--russ-success-text);
  border: 1px solid var(--russ-success-border);
}

.status-not-confirmed {
  background-color: var(--russ-error-light);
  color: var(--russ-error-text);
  border: 1px solid var(--russ-error-light);
}

.ruchnik-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ruchnik-edit-btn {
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--russ-info-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-edit-btn:hover:not(:disabled) {
  background: var(--russ-info-border);
  color: var(--russ-accent-dark);
}

.ruchnik-edit-btn:disabled,
.ruchnik-remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.ruchnik-remove-btn {
  background: var(--russ-error-light);
  border: 1px solid var(--russ-error-light);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--russ-error-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-remove-btn:hover:not(:disabled) {
  background: var(--russ-error-light);
  border-color: var(--russ-error);
  color: var(--russ-error-dark);
}

.ruchnik-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--russ-text-muted);
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ruchnik-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 8px;
}

.ruchnik-empty-subtext {
  font-size: 14px;
  color: var(--russ-text-tertiary);
}

.ruchnik-add-column {
  background: var(--russ-bg);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  flex: 1 1 0%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.ruchnik-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow: visible;
  min-height: 0;
}

.ruchnik-add-form .ruchnik-filters-container {
  margin-bottom: 0;
}

.ruchnik-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 16px;
  border: 1px solid var(--russ-border-light);
  background: var(--russ-bg-secondary);
  overflow: visible;
  margin-bottom: 0;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: var(--russ-bg-secondary);
  border-bottom: 1px solid var(--russ-border-light);    
  border-radius: 20px 20px 0 0;
}

.edit-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.edit-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.edit-header-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--russ-bg-blue-lighter);
  border: 1px solid var(--russ-info-border);
  color: var(--russ-accent);
  font-size: 18px;
}

.edit-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edit-header-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.edit-header-code {
  font-size: 15px;
  font-weight: 700;
  color: var(--russ-text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
  word-break: break-all;
}

.ruchnik-edit-filters {
  margin-bottom: 0;
  padding: 12px;
  box-sizing: border-box;
}

.ruchnik-cancel-edit-btn {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border-dark);
  color: var(--russ-text-secondary);
  cursor: pointer;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.ruchnik-cancel-edit-btn:hover {
  background: var(--russ-bg-tertiary);
}

.required {
  color: var(--russ-error);
  font-weight: 700;
}

.optional {
  color: var(--russ-text-tertiary);
  font-weight: 400;
  font-size: 12px;
}

.input-wrapper {
  position: relative;
}

.input-counter {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--russ-text-tertiary);
  font-weight: 500;
  background: var(--russ-overlay-light);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.ruchnik-select {
  width: 100%;
  position: relative;
  z-index: 1000;
  --base-select-height: 40px;
  --base-select-min-height: 40px;
  --base-select-padding: 0 14px;
  --base-select-border: 2px solid var(--russ-input-border);
  --base-select-radius: 10px;
  --base-select-font-size: 14px;
  --base-select-bg: var(--russ-bg);
  --base-select-focus-border: var(--russ-border-dark);
  --base-select-focus-shadow: none;
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--russ-text-tertiary);
  font-style: italic;
  margin-top: 4px;
}

.edit-hint i {
  color: var(--russ-accent);
  font-size: 12px;
}

.ruchnik-cancel-btn {
  padding: 12px 24px;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border-light);
  border-radius: 8px;
  color: var(--russ-text-tertiary);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.ruchnik-cancel-btn--toolbar {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: var(--russ-bg-secondary);
}

.ruchnik-cancel-btn:hover:not([disabled]) {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-dark);
  color: var(--russ-text-secondary);
}

.ruchnik-cancel-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.ruchnik-save-btn {
  padding: 12px 24px;
  background: var(--russ-success);
  border: 1px solid var(--russ-success-dark);
  color: var(--russ-text-inverse);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.ruchnik-save-btn--toolbar {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.ruchnik-save-btn[disabled] {
  background: var(--russ-neutral-light);
  border-color: var(--russ-border-dark);
  color: var(--russ-text-tertiary);
  cursor: not-allowed;
  opacity: 0.7;
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid var(--russ-text-muted);
  border-radius: 50%;
  opacity: 0.75;
}

.ruchnik-save-btn .loader,
.ruchnik-add-btn .loader {
  border-color: color-mix(in srgb, var(--russ-text-inverse) 70%, transparent);
  opacity: 0.95;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--russ-error);
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
  padding: 8px 12px;
  background: var(--russ-error-light);
  border: 1px solid var(--russ-error-light);
  border-radius: 8px;
}

.error-message i {
  font-size: 14px;
  color: var(--russ-error);
}

.ruchnik-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ruchnik-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.ruchnik-input {
  padding: 0 14px;
  border: 1px solid var(--russ-border-dark);
  border-radius: 8px;
  font-size: 14px;
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
}

.ruchnik-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
}

.ruchnik-input--needs-type,
.ruchnik-input[readonly] {
  background: var(--russ-input-bg-disabled, var(--russ-bg-quaternary));
  color: var(--russ-text-quaternary);
  cursor: pointer;
  opacity: 0.9;
}

.ruchnik-input--needs-type:focus,
.ruchnik-input[readonly]:focus {
  border-color: var(--russ-border-dark);
}

.ruchnik-input-error {
  border-color: var(--russ-error);
}

.ruchnik-error-message {
  color: var(--russ-error);
  font-size: 12px;
  font-weight: 500;
}

.ruchnik-add-btn {
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  border: 1px solid var(--russ-accent-dark);
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  height: 40px;
}

.ruchnik-add-btn:hover:not([disabled]) {
  background: var(--russ-accent-dark);
  border-color: var(--russ-accent-dark);
}

.ruchnik-add-btn[disabled] {
  background: var(--russ-neutral-light);
  border-color: var(--russ-border-dark);
  color: var(--russ-text-tertiary);
  cursor: not-allowed;
  opacity: 0.65;
}

.ruchnik-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.ruchnik-filters-container {
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

/* Только колонка списка: резерв под чип + FiltersBar + сброс */
.ruchnik-list-column > .ruchnik-filters-container {
  flex-shrink: 0;
}

.ruchnik-filters-container :deep(.filters-bar-wrapper) {
  width: 100%;
}

.ruchnik-filter-type-chip-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.ruchnik-filter-type-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--russ-text-secondary);
}

.ruchnik-chip-static {
  pointer-events: none;
}

/* Стили для пагинации */
.ruchnik-pagination {
  margin-top: 0;
  padding: 12px 16px;
  background: var(--russ-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--russ-border-light);
  flex-shrink: 0;
}

.pagination-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pagination-info-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--russ-text-secondary);
}

.page-info-text {
  color: var(--russ-accent);
  font-weight: 600;
  background: var(--russ-bg-blue-lighter);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.total-info-text {
  color: var(--russ-text-tertiary);
  font-size: 12px;
}

.pagination-controls-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-select-compact {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--russ-border-dark);
  background: var(--russ-bg);
  color: var(--russ-text-secondary);
  font-size: 12px;
  font-weight: 500;
  outline: none;
  min-width: 50px;
  height: 28px;
}

.pagination-select-compact:focus {
  border-color: var(--russ-accent);
}

.page-btn-compact {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border-dark);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--russ-text-secondary);
  font-weight: 500;
  cursor: pointer;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.page-btn-compact:hover:not([disabled]) {
  background: var(--russ-bg-blue-light);
  border-color: var(--russ-accent);
  color: var(--russ-accent);
}

.page-btn-compact[disabled] {
  background: var(--russ-bg-secondary);
  color: var(--russ-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .ruchnik-block {
    --ruchnik-list-viewport-min: 280px;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .ruchnik-block--modal-embed {
    overflow: hidden;
    flex: 1 1 0%;
    min-height: 0;
  }

  .ruchnik-container {
    grid-template-columns: 1fr;
    gap: 10px;
    overflow: visible;
  }

  .ruchnik-block--modal-embed .ruchnik-container {
    overflow: hidden;
    min-height: 0;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .ruchnik-block--modal-embed .ruchnik-add-column {
    min-height: 0;
    overflow: hidden;
  }

  .ruchnik-block--modal-embed .ruchnik-list-column {
    min-height: 0;
    overflow: hidden;
  }

  .ruchnik-content {
    overflow: visible;
  }

  .ruchnik-block--modal-embed .ruchnik-content {
    overflow: hidden;
  }

  .ruchnik-list-column > .ruchnik-filters-container {
    min-height: 160px;
  }

  .ruchnik-section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .ruchnik-card {
    padding: 12px;
  }

  .ruchnik-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .ruchnik-code {
    font-size: 14px;
  }

  .ruchnik-user {
    font-size: 12px;
  }

  .ruchnik-actions {
    gap: 6px;
  }

  .ruchnik-edit-btn,
  .ruchnik-remove-btn {
    min-width: 36px;
    height: 36px;
    padding: 6px 10px;
  }

  .ruchnik-add-btn {
    padding: 12px 16px;
    font-size: 14px;
  }

  .ruchnik-empty {
    padding: 30px 16px;
  }

  .ruchnik-empty-text {
    font-size: 14px;
  }

  .ruchnik-empty-subtext {
    font-size: 12px;
  }

  .ruchnik-info {
    flex-direction: column;
  }

  .ruchnik-pagination {
    margin-top: 0;
    padding: 10px 12px;
  }

  .pagination-compact {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .pagination-info-compact {
    justify-content: center;
    gap: 8px;
    font-size: 11px;
  }

  .pagination-controls-compact {
    justify-content: center;
    gap: 6px;
  }

  .page-btn-compact {
    min-width: 24px;
    height: 24px;
    font-size: 11px;
    padding: 2px 6px;
  }

  .pagination-select-compact {
    font-size: 11px;
    height: 24px;
    min-width: 45px;
  }

  .ruchnik-edit-mode {
    margin-bottom: 12px;
    border-radius: 12px;
    background: var(--russ-bg-secondary);
    border: 1px solid var(--russ-border-light);
  }

  .edit-header {
    padding: 10px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .edit-header-main {
    gap: 10px;
  }

  .edit-header-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .edit-header-title {
    font-size: 11px;
  }

  .edit-header-code {
    font-size: 14px;
  }

  .ruchnik-edit-filters {
    padding: 10px;
  }

  .edit-header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .edit-header-actions .ruchnik-cancel-btn--toolbar,
  .edit-header-actions .ruchnik-save-btn--toolbar {
    flex: 1;
    padding: 10px 12px;
    font-size: 13px;
  }

  .ruchnik-cancel-edit-btn {
    width: 32px;
    height: 32px;
    padding: 6px;
    font-size: 12px;
  }

  .ruchnik-input {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .input-counter {
    font-size: 10px;
    right: 8px;
  }

  .edit-hint {
    font-size: 10px;
    margin-top: 2px;
  }
}

/* Дополнительные стили для очень маленьких экранов */
@media (max-width: 480px) {
  .ruchnik-edit-mode {
    margin-bottom: 8px;
    border-radius: 8px;
  }

  .edit-header {
    padding: 8px 10px;
  }

  .edit-header-main {
    gap: 8px;
  }

  .edit-header-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .edit-header-title {
    font-size: 10px;
  }

  .edit-header-code {
    font-size: 13px;
  }

  .ruchnik-edit-filters {
    padding: 8px;
  }

  .edit-header-actions .ruchnik-cancel-btn--toolbar,
  .edit-header-actions .ruchnik-save-btn--toolbar {
    padding: 8px 10px;
    font-size: 12px;
  }

  .ruchnik-cancel-edit-btn {
    width: 28px;
    height: 28px;
    padding: 4px;
  }

  .ruchnik-input {
    padding: 6px 10px;
    font-size: 13px;
  }

  .input-counter {
    font-size: 9px;
    right: 6px;
  }

  .edit-hint {
    font-size: 9px;
  }
}
</style>
