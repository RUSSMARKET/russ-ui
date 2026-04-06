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
            <div v-for="(item, index) in items" :key="item.id" class="ruchnik-card"
              :style="{ animationDelay: `${index * 0.1}s` }">
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
        </div>

        <!-- Пагинация -->
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
                @click="handlePageChange(currentPage - 1)"
              >
                ←
              </button>
              <button
                type="button"
                class="page-btn-compact"
                :disabled="loading || currentPage >= totalPages"
                @click="handlePageChange(currentPage + 1)"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="canManage" class="ruchnik-add-column">
        <h4 class="ruchnik-section-title">
          {{ isEditing ? 'Редактирование ручника' : 'Добавить ручник' }}
        </h4>

        <div class="ruchnik-add-form">
          <div v-if="isEditing" class="ruchnik-edit-mode">
            <div class="edit-header">
              <i class="pi pi-pencil"></i>
              <span>Редактирование ручника: {{ editingRuchnik?.code }}</span>
            </div>

            <div class="edit-form">
              <div class="edit-field">
                <label class="edit-label">
                  <i class="pi pi-hashtag"></i>
                  Код ручника
                </label>
                <input
                  ref="editCodeInputRef"
                  v-model="editCode"
                  type="text"
                  inputmode="tel"
                  pattern="[0-9-]*"
                  enterkeyhint="done"
                  class="ruchnik-input"
                  :class="{ 'ruchnik-input--needs-type': !editCodeInputAllowed }"
                  :readonly="!editCodeInputAllowed"
                  :placeholder="editCodeInputAllowed ? 'Введите код ручника...' : 'Сначала выберите тип ручника'"
                  @input="handleEditCodeInput"
                  @paste="handleEditPaste"
                  @focus="onEditCodeFocus"
                />
              </div>

              <div class="edit-field">
                <label class="edit-label">
                  <i class="pi pi-user"></i>
                  Назначить агенту
                </label>
                <BaseSelect
                  :options="agentOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Выберите агента..."
                  :searchable="true"
                  class="ruchnik-select"
                  :model-value="editUserId ?? undefined"
                  @update:model-value="(value: number | null) => editUserId = value ?? null"
                />
              </div>

              <div class="edit-field">
                <label class="edit-label">
                  <i class="pi pi-tags"></i>
                  Тип ручника
                </label>
                <BaseSelect
                  ref="editRuchnikTypeSelectRef"
                  :options="typeOptions"
                  optionLabel="name"
                  optionValue="slug"
                  placeholder="Выберите тип..."
                  :searchable="true"
                  :disabled="typesLoading || !typeOptions.length"
                  :model-value="editRuchnikTypeSlug ?? undefined"
                  @update:model-value="(value: string | null) => editRuchnikTypeSlug = value || null"
                  class="ruchnik-select"
                />
              </div>

              <div class="edit-actions">
                <button @click="cancelEdit" class="ruchnik-cancel-btn" :disabled="editLoading">
                  Отмена
                </button>
                <button @click="saveEdit" class="ruchnik-save-btn" :disabled="!editCode.trim() || editLoading">
                  <span v-if="editLoading" class="loader"></span>
                  <i v-else class="pi pi-check"></i>
                  {{ editLoading ? 'Сохранение...' : 'Сохранить' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!isEditing" class="ruchnik-input-group">
            <label class="ruchnik-label">
              <i class="pi pi-tags"></i>
              Тип ручника
            </label>
            <BaseSelect
              ref="newRuchnikTypeSelectRef"
              :options="typeOptions"
              optionLabel="name"
              optionValue="slug"
              placeholder="Выберите тип..."
              :searchable="true"
              :disabled="typesLoading || !typeOptions.length"
              :model-value="newRuchnikTypeSlug ?? undefined"
              @update:model-value="(value: string | null) => newRuchnikTypeSlug = value || null"
              class="ruchnik-select"
            />
          </div>

          <div v-if="!isEditing" class="ruchnik-input-group">
            <label class="ruchnik-label">Код ручника (цифры и «-»)</label>
            <input
              ref="newCodeInputRef"
              v-model="newRuchnikCode"
              type="text"
              inputmode="tel"
              pattern="[0-9-]*"
              enterkeyhint="done"
              class="ruchnik-input"
              :class="{ 'ruchnik-input--needs-type': !newCodeInputAllowed }"
              :readonly="!newCodeInputAllowed"
              :placeholder="newCodeInputAllowed ? 'Введите ID заявки...' : 'Сначала выберите тип ручника'"
              @input="handleInput"
              @paste="handlePaste"
              @focus="onNewCodeFocus"
            />
          </div>

          <div v-if="!isEditing" class="ruchnik-input-group">
            <label class="ruchnik-label">
              <i class="pi pi-user"></i>
              Назначить агенту
            </label>
            <BaseSelect
              :options="agentOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите агента..."
              :searchable="true"
              class="ruchnik-select"
              :model-value="newUserId ?? undefined"
              @update:model-value="(value: number | null) => newUserId = value ?? null"
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
import { BaseSelect, FiltersBar, Chip, type FilterConfig } from "@/shared/ui";

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

const newCodeInputRef = ref<HTMLInputElement | null>(null);
const editCodeInputRef = ref<HTMLInputElement | null>(null);
const filtersContainerRef = ref<HTMLElement | null>(null);
const newRuchnikTypeSelectRef = ref<{ $el?: HTMLElement } | null>(null);
const editRuchnikTypeSelectRef = ref<{ $el?: HTMLElement } | null>(null);

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

function clickBaseSelectByRef(el: { $el?: HTMLElement } | null | undefined) {
  nextTick(() => {
    const root = el?.$el as HTMLElement | undefined;
    const combo = root?.querySelector?.(".base-select-combo") as HTMLElement | undefined;
    combo?.focus?.();
    combo?.click?.();
  });
}

function focusNewRuchnikTypeSelect() {
  clickBaseSelectByRef(newRuchnikTypeSelectRef.value as { $el?: HTMLElement } | null);
}

function focusEditRuchnikTypeSelect() {
  clickBaseSelectByRef(editRuchnikTypeSelectRef.value as { $el?: HTMLElement } | null);
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

const handleInput = (event: Event) => {
  if (!newCodeInputAllowed.value) {
    event.preventDefault();
    return;
  }
  const target = event.target as HTMLInputElement;
  const typeSlug = newRuchnikTypeSlug.value || props.selectedType || null;
  const formatted = formatCodeByType(target.value, typeSlug);
  if (target.value !== formatted) {
    newRuchnikCode.value = formatted;
  }
};

const handlePaste = (event: ClipboardEvent) => {
  if (!newCodeInputAllowed.value) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  const pastedText = event.clipboardData?.getData("text") || "";
  const typeSlug = newRuchnikTypeSlug.value || props.selectedType || null;
  newRuchnikCode.value = formatCodeByType(pastedText, typeSlug);
};

const handleEditCodeInput = (event: Event) => {
  if (!editCodeInputAllowed.value) {
    event.preventDefault();
    return;
  }
  const target = event.target as HTMLInputElement;
  const formatted = formatCodeByType(target.value, editRuchnikTypeSlug.value);
  if (target.value !== formatted) {
    editCode.value = formatted;
  }
};

const handleEditPaste = (event: ClipboardEvent) => {
  if (!editCodeInputAllowed.value) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  const pastedText = event.clipboardData?.getData("text") || "";
  editCode.value = formatCodeByType(pastedText, editRuchnikTypeSlug.value);
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
      label: "Агент",
      placeholder: "Все агенты",
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
  width: 100%;
  max-height: 650px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ruchnik-block--modal-embed {
  /* flex-basis: 0 — иначе блок растёт по контенту и скроллится весь .base-modal-content */
  flex: 1 1 0%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
}

.ruchnik-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-container-client {
  grid-template-columns: 1fr;
}

.ruchnik-list-column {
  background: var(--russ-bg);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--russ-shadow-default);
  border: 1px solid var(--russ-border);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-list-column-full {
  width: 100%;
}

.ruchnik-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--russ-border);
}

.ruchnik-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-list-area {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  background: color-mix(in srgb, var(--russ-bg) 88%, transparent);
  backdrop-filter: blur(2px);
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
  flex: 1;
  min-height: 200px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.ruchnik-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  max-height: 365px;
}

.ruchnik-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--russ-border-light);
  transition: all 0.3s ease;
  gap: 10px;
  opacity: 1;
  transform: translateY(0);
}

.ruchnik-card:hover {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-dark);
  box-shadow: 0 4px 12px var(--russ-shadow-hover);
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
  box-shadow: 0 2px 8px var(--russ-shadow-gray);
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
  transition: all 0.2s ease;
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
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--russ-accent);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-edit-btn:hover {
  background: var(--russ-info-border);
  color: var(--russ-accent-dark);
  transform: scale(1.05);
}

.ruchnik-edit-btn:disabled,
.ruchnik-remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  pointer-events: none;
}

.ruchnik-remove-btn {
  background: var(--russ-error-light);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--russ-error);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-remove-btn:hover {
  background: var(--russ-error-light);
  color: var(--russ-error-dark);
  transform: scale(1.05);
}

.ruchnik-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--russ-text-muted);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  animation: fadeIn 0.3s ease-out;
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
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--russ-shadow-default);
  border: 1px solid var(--russ-border);
  display: flex;
  flex-direction: column;
  overflow: visible;
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

.ruchnik-edit-mode {
  background: var(--russ-bg-light);
  border-radius: 16px;
  padding: 0;
  margin-bottom: 20px;
  border: 1px solid var(--russ-border);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.edit-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.edit-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-text-inverse);
  font-size: 20px;
  backdrop-filter: blur(10px);
}

.edit-title h5 {
  margin: 0;
  color: var(--russ-text-inverse);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.edit-code {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  margin-top: 2px;
  display: block;
}

.ruchnik-cancel-edit-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--russ-text-inverse);
  cursor: pointer;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  backdrop-filter: blur(10px);
}

.ruchnik-cancel-edit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.edit-form {
  padding: 12px;
  background: white;
}

.edit-section {
  margin-bottom: 24px;
}

.edit-section:last-of-type {
  margin-bottom: 0;
}

.edit-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--russ-bg-tertiary);
  color: var(--russ-text-secondary);
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-section-header i {
  color: var(--russ-secondary);
  font-size: 16px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 5px;
}

.edit-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 4px;
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
  --base-select-focus-border: var(--russ-input-border-focus);
  --base-select-focus-shadow: inset 0 0 0 3px var(--russ-shadow-secondary);
}



/* Убеждаемся, что контейнер редактирования не обрезает выпадающий список */
.ruchnik-edit-mode {
  overflow: visible !important;
}

.edit-form {
  overflow: visible !important;
}

.edit-section {
  overflow: visible !important;
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
  color: #3b82f6;
  font-size: 12px;
}

.edit-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--russ-border);
}

.ruchnik-cancel-btn {
  padding: 12px 24px;
  background: var(--russ-bg-secondary);
  border: 2px solid var(--russ-border-light);
  border-radius: 12px;
  color: var(--russ-text-tertiary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ruchnik-cancel-btn:hover:not([disabled]) {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-dark);
  color: var(--russ-text-secondary);
  box-shadow: 0 4px 12px var(--russ-shadow-hover);
}

.ruchnik-cancel-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ruchnik-save-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--russ-success) 0%, var(--russ-success-dark) 100%);
  border: none;
  border-radius: 12px;
  color: var(--russ-text-inverse);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px var(--russ-shadow-success);
}

.ruchnik-save-btn:hover:not([disabled]) {
  background: linear-gradient(135deg, var(--russ-success-dark) 0%, var(--russ-success-dark) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--russ-shadow-success-light);
}

.ruchnik-save-btn[disabled] {
  background: var(--russ-neutral-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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
  border: 2px solid var(--russ-input-border);
  border-radius: 10px;
  font-size: 14px;
  background: var(--russ-bg);
  transition: all 0.2s ease;
  color: var(--russ-text-primary);
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
}

.ruchnik-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  box-shadow: inset 0 0 0 3px var(--russ-shadow-secondary);
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
  border-color: var(--russ-input-border);
  box-shadow: none;
}

.ruchnik-input-error {
  border-color: var(--russ-input-border-error);
  box-shadow: 0 0 0 3px var(--russ-shadow-error);
}

.ruchnik-error-message {
  color: var(--russ-error);
  font-size: 12px;
  font-weight: 500;
}

.ruchnik-add-btn {
  background: #6b9eff;
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  height: 40px;
}

.ruchnik-add-btn:hover:not([disabled]) {
  background: var(--russ-accent);
}

.ruchnik-add-btn[disabled] {
  background: var(--russ-neutral-light);
  color: var(--russ-text-tertiary);
  cursor: not-allowed;
  opacity: 0.7;
}

.ruchnik-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

/* Фильтры: FiltersBar + Chip */
.ruchnik-filters-container {
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
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
  margin-top: 16px;
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
  transition: border-color 0.2s;
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
  transition: all 0.2s ease;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.page-btn-compact:hover:not([disabled]) {
  background: var(--russ-bg-light);
  border-color: var(--russ-text-muted);
  color: var(--russ-text-dark);
}

.page-btn-compact[disabled] {
  background: var(--russ-bg-secondary);
  color: var(--russ-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .ruchnik-block {
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
  }

  .ruchnik-list-column,
  .ruchnik-add-column {
    padding: 10px;
    min-height: auto;
    overflow: visible;
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


  .ruchnik-block--modal-embed .ruchnik-list {
    overflow-y: auto;
    min-height: 0;
  }

  .ruchnik-block--modal-embed .ruchnik-list-area {
    min-height: 0;
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
    margin-top: 12px;
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
    padding: 8px 12px;
    background: var(--russ-bg-light);
    border-radius: 12px 12px 0 0;
  }

  .edit-header-content {
    gap: 8px;
  }

  .edit-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
    background: var(--russ-text-tertiary);
  }

  .edit-title h5 {
    font-size: 14px;
    font-weight: 600;
  }

  .edit-code {
    font-size: 12px;
    color: var(--russ-text-tertiary);
  }

  .ruchnik-cancel-edit-btn {
    width: 32px;
    height: 32px;
    padding: 6px;
    font-size: 12px;
  }

  .edit-form {
    padding: 12px;
  }

  .edit-section {
    margin-bottom: 12px;
  }

  .edit-section:last-of-type {
    margin-bottom: 8px;
  }

  .edit-section-header {
    font-size: 11px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    text-transform: none;
    letter-spacing: 0;
  }

  .edit-field {
    margin-bottom: 8px;
  }

  .edit-label {
    font-size: 12px;
    margin-bottom: 4px;
  }

  .ruchnik-input {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .edit-actions {
    flex-direction: row;
    gap: 8px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--russ-border-light);
  }

  .ruchnik-cancel-btn,
  .ruchnik-save-btn {
    flex: 1;
    padding: 10px 12px;
    font-size: 13px;
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
    padding: 6px 10px;
    border-radius: 8px 8px 0 0;
  }

  .edit-header-content {
    gap: 6px;
  }

  .edit-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .edit-title h5 {
    font-size: 13px;
  }

  .edit-code {
    font-size: 11px;
  }

  .ruchnik-cancel-edit-btn {
    width: 28px;
    height: 28px;
    padding: 4px;
  }

  .edit-form {
    padding: 10px;
  }

  .edit-section {
    margin-bottom: 10px;
  }

  .edit-section:last-of-type {
    margin-bottom: 6px;
  }

  .edit-section-header {
    font-size: 10px;
    margin-bottom: 6px;
  }

  .edit-field {
    margin-bottom: 6px;
  }

  .edit-label {
    font-size: 11px;
  }

  .ruchnik-input {
    padding: 6px 10px;
    font-size: 13px;
  }

  .edit-actions {
    margin-top: 10px;
    padding-top: 6px;
    gap: 6px;
  }

  .ruchnik-cancel-btn,
  .ruchnik-save-btn {
    padding: 8px 10px;
    font-size: 12px;
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