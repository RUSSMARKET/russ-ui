<!--
  RuchnikBlockRequests - Компонент для управления ручниками на странице requests
  Для клиентов: только поиск и просмотр (без правой колонки)
  Для менеджеров: полный функционал
-->

<template>
  <div class="ruchnik-block">
    <div class="ruchnik-container" :class="{ 'ruchnik-container-client': !canManage }">
      <div class="ruchnik-list-column" :class="{ 'ruchnik-list-column-full': !canManage }">
        <h4 class="ruchnik-section-title">Заявки агентов</h4>
        <div class="ruchnik-filters-container">
          <div class="ruchnik-filters-grid">
            <div class="ruchnik-filter-item">
              <label class="ruchnik-filter-label">
                <i class="pi pi-search"></i>
                Поиск по коду
              </label>
              <div class="ruchnik-search-input-wrapper">
                <i class="pi pi-search ruchnik-search-icon"></i>
                <input v-model="localSearchQuery" type="text" inputmode="tel" pattern="[0-9-]*" enterkeyhint="search"
                  class="ruchnik-search-input-compact" placeholder="Введите код ручника..." @input="handleSearchInput"
                  @paste="handleSearchPaste" />
                <div v-if="localSearchQuery" class="ruchnik-search-clear" @click="clearSearch">
                  <i class="pi pi-times"></i>
                </div>
              </div>
            </div>

            <div class="ruchnik-filter-item" v-if="canManage">
              <label class="ruchnik-filter-label">
                <i class="pi pi-user"></i>
                Агент
              </label>
              <StatusSelect
                :options="agentOptions"
                optionLabel="name"
                optionValue="id"
                placeholder="Все агенты"
                :searchable="true"
                :clearable="true"
                :disabled="agentsLoading"
                :model-value="localSelectedUserId || undefined"
                @update:model-value="handleUserFilterChange"
                class="ruchnik-filter-select"
              />
            </div>

            <div class="ruchnik-filter-item">
              <label class="ruchnik-filter-label">
                <i class="pi pi-tags"></i>
                Тип ручника
              </label>
              <StatusSelect
                :options="typeOptions"
                optionLabel="name"
                optionValue="slug"
                placeholder="Все типы"
                :searchable="true"
                :clearable="true"
                :disabled="typesLoading"
                :model-value="localSelectedType || undefined"
                @update:model-value="handleTypeFilterChange"
                class="ruchnik-filter-select"
              />
            </div>

            <div class="ruchnik-filter-item ruchnik-filter-reset">
              <button 
                v-if="hasActiveFilters" 
                @click="resetAllFilters" 
                class="ruchnik-reset-btn"
                title="Сбросить все фильтры">
                <i class="pi pi-refresh"></i>
                <span>Сбросить</span>
              </button>
            </div>
          </div>
        </div>

        <div class="ruchnik-content">
          <div v-if="loading" class="ruchnik-loading">
            <span class="loader"></span>
            <span>Загрузка заявок...</span>
          </div>

          <div v-else-if="items.length > 0" class="ruchnik-list">
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
                <button class="ruchnik-edit-btn" title="Редактировать" @click="handleEdit(item)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="ruchnik-remove-btn" title="Удалить ручник" @click="handleRemove(item)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="ruchnik-empty">
            <div class="ruchnik-empty-text">Нет заявок</div>
            <div class="ruchnik-empty-subtext">Заявки агентов не найдены</div>
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
              <select v-model.number="localPerPage" @change="handlePerPageChange" class="pagination-select-compact">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
              <button @click="handlePageChange(currentPage - 1)" :disabled="currentPage <= 1" class="page-btn-compact">
                ←
              </button>
              <button @click="handlePageChange(currentPage + 1)" :disabled="currentPage >= totalPages"
                class="page-btn-compact">
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
                <input v-model="editCode" type="text" inputmode="tel" pattern="[0-9-]*" enterkeyhint="done"
                  class="ruchnik-input" placeholder="Введите код ручника..." @input="handleEditCodeInput"
                  @paste="handleEditPaste" />
              </div>

              <div class="edit-field">
                <label class="edit-label">
                  <i class="pi pi-user"></i>
                  Назначить агенту
                </label>
                <StatusSelect :options="agentOptions" optionLabel="name" optionValue="id"
                  placeholder="Выберите агента..." :searchable="true" class="ruchnik-select" :clearable="true"
                  :model-value="editUserId || undefined"
                  @update:model-value="(value: number | null) => editUserId = value" />
              </div>

              <div class="edit-field">
                <label class="edit-label">
                  <i class="pi pi-tags"></i>
                  Тип ручника
                </label>
                <StatusSelect
                  :options="typeOptions"
                  optionLabel="name"
                  optionValue="slug"
                  placeholder="Выберите тип..."
                  :searchable="true"
                  :clearable="true"
                  :disabled="typesLoading || !typeOptions.length"
                  :model-value="editRuchnikTypeSlug || undefined"
                  @update:model-value="(value: string | null) => editRuchnikTypeSlug = value || null"
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
            <label class="ruchnik-label">Код ручника (цифры и «-»)</label>
            <input v-model="newRuchnikCode" type="text" inputmode="tel" pattern="[0-9-]*" enterkeyhint="done"
              class="ruchnik-input" placeholder="Введите ID заявки..." @input="handleInput" @paste="handlePaste" />
          </div>

          <div v-if="!isEditing" class="ruchnik-input-group">
            <label class="ruchnik-label">
              <i class="pi pi-user"></i>
              Назначить агенту
            </label>
            <StatusSelect :options="agentOptions" optionLabel="name" optionValue="id" placeholder="Выберите агента..."
              :searchable="true" class="ruchnik-select" :clearable="true" :model-value="newUserId || undefined"
              @update:model-value="(value: number | null) => newUserId = value" />
          </div>

          <div v-if="!isEditing" class="ruchnik-input-group">
            <label class="ruchnik-label">
              <i class="pi pi-tags"></i>
              Тип ручника
            </label>
            <StatusSelect
              :options="typeOptions"
              optionLabel="name"
              optionValue="slug"
              placeholder="Выберите тип..."
              :searchable="true"
              :clearable="true"
              :disabled="typesLoading || !typeOptions.length"
              :model-value="newRuchnikTypeSlug || undefined"
              @update:model-value="(value: string | null) => newRuchnikTypeSlug = value || null"
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
import { ref, computed, watch, onMounted } from "vue";
import { getAgents, updateRuchnik } from "@/pages/requests/api";
import type { RuchnikType } from "@/pages/requests/api";
import { useToast } from "primevue/usetoast";
import StatusSelect from "@/shared/ui/inputs/select/StatusSelect.vue";

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

interface Props {
  items: Ruchnik[];
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
  selectedUserId: null
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
const sanitizeRuchnikValue = (value: string) => value.replace(/[^0-9-]/g, '');

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
  const target = event.target as HTMLInputElement;
  const sanitizedValue = sanitizeRuchnikValue(target.value);
  if (target.value !== sanitizedValue) {
    newRuchnikCode.value = sanitizedValue;
  }
};

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const pastedText = event.clipboardData?.getData('text') || '';
  newRuchnikCode.value = sanitizeRuchnikValue(pastedText);
};

const handleEditCodeInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const sanitizedValue = sanitizeRuchnikValue(target.value);
  if (target.value !== sanitizedValue) {
    editCode.value = sanitizedValue;
  }
};

const handleEditPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const pastedText = event.clipboardData?.getData('text') || '';
  editCode.value = sanitizeRuchnikValue(pastedText);
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
    const agentsData = await getAgents();
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
    await updateRuchnik(
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

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const sanitizedValue = sanitizeRuchnikValue(target.value);
  if (target.value !== sanitizedValue) {
    localSearchQuery.value = sanitizedValue;
  }

  emit("search", localSearchQuery.value);
  emit("page-change", 1); // Сбрасываем на первую страницу при изменении поиска
};

const handleSearchPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const pastedText = event.clipboardData?.getData('text') || '';
  localSearchQuery.value = sanitizeRuchnikValue(pastedText);

  emit("search", localSearchQuery.value);
};

const clearSearch = () => {
  localSearchQuery.value = "";
  emit("search", "");
};

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit("page-change", page);
  }
};

const handlePerPageChange = () => {
  emit("per-page-change", localPerPage.value);
};

const handleTypeFilterChange = (value: string | null) => {
  localSelectedType.value = value || null;
  emit("type-change", localSelectedType.value);
  emit("page-change", 1); // Сбрасываем на первую страницу при изменении типа
};

const handleUserFilterChange = (value: number | null) => {
  localSelectedUserId.value = value || null;
  emit("user-change", localSelectedUserId.value);
  emit("page-change", 1); // Сбрасываем на первую страницу при изменении пользователя
};

const hasActiveFilters = computed(() => {
  return !!(localSearchQuery.value || localSelectedType.value || localSelectedUserId.value);
});

const resetAllFilters = () => {
  localSearchQuery.value = "";
  localSelectedType.value = null;
  localSelectedUserId.value = null;
  emit("search", "");
  emit("type-change", null);
  emit("user-change", null);
  emit("page-change", 1); // Сбрасываем на первую страницу при сбросе фильтров
};

watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue || "";
});

watch(() => props.perPage, (newValue) => {
  localPerPage.value = newValue;
});

watch(() => props.selectedType, (newValue) => {
  localSelectedType.value = newValue || null;
  if (!newRuchnikTypeSlug.value) {
    newRuchnikTypeSlug.value = newValue || null;
  }
});

watch(() => props.selectedUserId, (newValue) => {
  localSelectedUserId.value = newValue || null;
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
  height: 73vh;
  display: flex;
  flex-direction: column;
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
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 400px;
  /* Фиксированная минимальная высота */
}

.ruchnik-list-column-full {
  width: 100%;
}

.ruchnik-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d2d;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.ruchnik-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: all 0.3s ease;
}

.ruchnik-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #2d2d2d;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
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
  transition: all 0.3s ease;
  -webkit-overflow-scrolling: touch;
}

.ruchnik-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  gap: 10px;
  opacity: 1;
  transform: translateY(0);
}

.ruchnik-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(71, 85, 105, 0.15);
}

.ruchnik-info {
  display: flex;
  gap: 20px;
}

.ruchnik-code {
  font-weight: 600;
  color: #2d2d2d;
  font-size: 15px;
}

.ruchnik-user {
  color: #919191;
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
  color: #475569;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
}

.status-type {
  color: #334155;
}

.status-date {
  color: #334155;
}

.ruchnik-report {
  background: #ffffff;
  border: 1px solid #e5e7eb;
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
  color: #374151;
  font-size: 13px;
}

.report-row i {
  color: #64748b;
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
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-not-confirmed {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.ruchnik-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ruchnik-edit-btn {
  background: #dbeafe;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-edit-btn:hover {
  background: #bfdbfe;
  color: #1d4ed8;
  transform: scale(1.05);
}

.ruchnik-remove-btn {
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.ruchnik-remove-btn:hover {
  background: #fecaca;
  color: #b91c1c;
  transform: scale(1.05);
}

.ruchnik-empty {
  text-align: center;
  padding: 40px 20px;
  color: #919191;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease-out;
}

.ruchnik-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.ruchnik-empty-subtext {
  font-size: 14px;
  color: #94a3b8;
}

.ruchnik-add-column {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
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
  background: rgb(230, 230, 230);
  border-radius: 16px;
  padding: 0;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
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
  color: white;
  font-size: 20px;
  backdrop-filter: blur(10px);
}

.edit-title h5 {
  margin: 0;
  color: white;
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
  color: white;
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
  border-bottom: 2px solid #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-section-header i {
  color: #6366f1;
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
  color: #374151;
  margin-bottom: 4px;
}

.required {
  color: #ef4444;
  font-weight: 700;
}

.optional {
  color: #6b7280;
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
  color: #6b7280;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.ruchnik-select {
  width: 100%;
  position: relative;
  z-index: 1000;
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
  color: #6b7280;
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
  border-top: 1px solid #e5e7eb;
}

.ruchnik-cancel-btn {
  padding: 12px 24px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ruchnik-cancel-btn:hover:not([disabled]) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ruchnik-cancel-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ruchnik-save-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.ruchnik-save-btn:hover:not([disabled]) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.ruchnik-save-btn[disabled] {
  background: #9ca3af;
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
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-message i {
  font-size: 14px;
  color: #dc2626;
}

.ruchnik-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ruchnik-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.ruchnik-input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: #fff;
  transition: all 0.2s ease;
  color: #2d2d2d;
}

.ruchnik-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.ruchnik-input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.ruchnik-error-message {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.ruchnik-add-btn {
  background: #6b9eff;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ruchnik-add-btn:hover:not([disabled]) {
  background: #5a8de8;
}

.ruchnik-add-btn[disabled] {
  background: #9ca3af;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.ruchnik-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

/* Красивые фильтры */
.ruchnik-filters-container {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.ruchnik-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

.ruchnik-filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.ruchnik-filter-item.ruchnik-filter-reset {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.ruchnik-filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 2px;
}

.ruchnik-filter-label i {
  color: #6366f1;
  font-size: 14px;
}

.ruchnik-filter-select {
  width: 100%;
}

.ruchnik-reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ruchnik-reset-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ruchnik-reset-btn:active {
  transform: translateY(0);
}

.ruchnik-reset-btn i {
  font-size: 14px;
}

/* Компактный поиск */
.ruchnik-search-compact {
  margin-bottom: 0;
  padding: 0;
  background: transparent;
  border: none;
  flex: 1;
}

.ruchnik-search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.ruchnik-search-icon {
  position: absolute;
  left: 12px;
  color: #6b7280;
  font-size: 14px;
  z-index: 1;
}

.ruchnik-search-input-compact {
  width: 100%;
  padding: 10px 12px 10px 36px !important;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  transition: all 0.2s ease;
  color: #374151;
  height: 42px;
  box-sizing: border-box;
}

.ruchnik-search-input-compact:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #fff;
}

.ruchnik-search-clear {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.ruchnik-search-clear:hover {
  background: #f3f4f6;
  color: #374151;
}

@media (max-width: 700px) {
  .ruchnik-filters-container {
    padding: 12px;
  }

  .ruchnik-filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .ruchnik-filter-item.ruchnik-filter-reset {
    align-items: stretch;
    justify-content: stretch;
  }

  .ruchnik-reset-btn {
    width: 100%;
    justify-content: center;
  }

  .ruchnik-search-compact {
    margin-bottom: 0;
    width: 100%;
  }
}

/* Стили для пагинации */
.ruchnik-pagination {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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
  color: #374151;
}

.page-info-text {
  color: #2563eb;
  font-weight: 600;
  background: #e0e7ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.total-info-text {
  color: #6b7280;
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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  transition: border-color 0.2s;
  outline: none;
  min-width: 50px;
  height: 28px;
}

.pagination-select-compact:focus {
  border-color: #2563eb;
}

.page-btn-compact {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  color: #374151;
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
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #1f2937;
}

.page-btn-compact[disabled] {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .ruchnik-block {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .ruchnik-container {
    grid-template-columns: 1fr;
    gap: 10px;
    overflow: visible;
  }

  .ruchnik-list-column,
  .ruchnik-add-column {
    padding: 16px;
    min-height: auto;
    overflow: visible;
  }

  .ruchnik-content {
    overflow: visible;
  }

  .ruchnik-list {
    overflow-y: visible;
    max-height: none;
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

  .ruchnik-search-compact {
    margin-bottom: 12px;
    padding: 10px;
  }

  .ruchnik-search-input-compact {
    font-size: 16px;
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
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .edit-header {
    padding: 8px 12px;
    background: #e2e8f0;
    border-radius: 12px 12px 0 0;
  }

  .edit-header-content {
    gap: 8px;
  }

  .edit-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
    background: #64748b;
  }

  .edit-title h5 {
    font-size: 14px;
    font-weight: 600;
  }

  .edit-code {
    font-size: 12px;
    color: #64748b;
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
    border-top: 1px solid #e2e8f0;
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