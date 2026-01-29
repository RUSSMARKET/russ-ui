<!--
  RuchnikBlockHome - Компонент для управления на странице home
  Без отображения статуса подтверждения
-->

<template>
  <div class="ruchnik-block">
    <div class="ruchnik-container">


      <div class="ruchnik-add-column">
        <h4 class="ruchnik-section-title">
          {{ canManage ? 'Добавить ID выдачи' : 'Поиск заявок' }}
        </h4>

        <div v-if="canManage" class="ruchnik-add-form">
          <div v-if="editingRuchnik" class="ruchnik-edit-mode">
            <i class="pi pi-pencil"></i>
            <span>Редактирование заявки: {{ editingRuchnik.code }}</span>
            <button class="ruchnik-cancel-edit-btn" @click="cancelEdit" title="Отменить редактирование">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="ruchnik-input-group">
            <label class="ruchnik-label"></label>
            <input
              v-model="newRuchnikCode"
              type="text"
              inputmode="numeric"
              enterkeyhint="done"
              class="ruchnik-input"
              placeholder="Введите ID"
              @input="handleInput"
              @keypress="allowRuchnikCharacters"
              @paste="handlePaste"
            />
          </div>

          <button class="ruchnik-add-btn" :disabled="!newRuchnikCode.trim() || addLoading"
            @click="handleAdd">

            <span class="ruchnik-btn-icon">
              <span v-if="addLoading" class="loader"></span>
              <i v-else class="pi pi-plus"></i>
            </span>
            <span class="ruchnik-btn-text">
              <span v-if="addLoading">
                {{ editingRuchnik ? 'Обновление...' : 'Добавление...' }}
              </span>
              <span v-else>
                {{ editingRuchnik ? 'Обновить' : 'Добавить' }}
              </span>
            </span>
          </button>
        </div>

        <div v-else class="ruchnik-no-access">
          <div class="ruchnik-no-access-text">Нет доступа</div>
          <div class="ruchnik-no-access-subtext">У вас нет прав для управления заявками</div>
        </div>
      </div>
      <div class="ruchnik-list-column">
        <h4 class="ruchnik-section-title">
          Внесенные ID
          <span v-if="items.length > 0" class="ruchnik-counter">
            ({{ items.length }} {{ items.length === 1 ? 'заявка' : items.length < 5 ? 'заявки' : 'заявок' }}) </span>
        </h4>


        <div v-if="loading" class="ruchnik-loading">
          <span class="loader"></span>
          <span>Загрузка заявок...</span>
        </div>

        <div v-else-if="items.length > 0" class="ruchnik-list">
          <div v-for="item in sortedItems" :key="item.id" class="ruchnik-card">
            <div class="ruchnik-card-content">
              <div class="ruchnik-avatar">
                <i class="pi pi-book"></i>
              </div>
              <div class="ruchnik-info">
                <div class="ruchnik-code">{{ item.code }}</div>
                <div v-if="item.user" class="ruchnik-user">
                  {{ item.user.surname }} {{ item.user.name }} {{ item.user.patronymic }}
                </div>
              </div>
            </div>
            <div v-if="canManage" class="ruchnik-actions">
              <button class="ruchnik-edit-btn" title="Редактировать" @click="handleEdit(item)">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="ruchnik-remove-btn" title="Удалить id" @click="handleRemove(item)">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="ruchnik-empty">
          <div class="ruchnik-empty-text">Нет ID</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

interface Ruchnik {
  id: number;
  code: string;
  user_id: number;
  date_match: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    surname: string;
    patronymic: string;
  };
}

interface Props {
  items: Ruchnik[];
  loading?: boolean;
  canManage?: boolean;
  searchQuery?: string;
  addLoading?: boolean;
  resetKey?: number;
  ruchnikTypeId?: number | string | null;
  ruchnikTypeSlug?: string | null;
}

interface Emits {
  (e: "add", data: { code: string; editingRuchnik?: Ruchnik }): void;
  (e: "remove", ruchnikId: number): void;
  (e: "edit", ruchnik: Ruchnik): void;
  (e: "search", query: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canManage: false,
  searchQuery: "",
  addLoading: false,
  resetKey: 0,
  ruchnikTypeId: null,
  ruchnikTypeSlug: null
});

const emit = defineEmits<Emits>();

const newRuchnikCode = ref("");
const editingRuchnik = ref<Ruchnik | null>(null);
const localSearchQuery = ref(props.searchQuery || "");

// Сортируем заявки по дате создания в убывающем порядке (новые сверху)
const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
});

const currentRuchnikTypeId = computed(() => props.ruchnikTypeId ?? null);
const currentRuchnikTypeSlug = computed(
  () => (props.ruchnikTypeSlug || "").toLowerCase()
);
const isAlfaType = computed(
  () =>
    currentRuchnikTypeId.value === 1 ||
    currentRuchnikTypeSlug.value.includes("alfa")
);
const isOtpType = computed(
  () =>
    currentRuchnikTypeId.value === 2 ||
    currentRuchnikTypeSlug.value.includes("otp")
);

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const formatOtpCode = (digits: string) => {
  const limited = sanitizeDigits(digits).slice(0, 11); // 6 + 1 + 4
  const part1 = limited.slice(0, 6);
  const part2 = limited.slice(6, 7);
  const part3 = limited.slice(7, 11);

  let formatted = part1;
  if (part2) formatted += `-${part2}`;
  if (part3) formatted += `-${part3}`;
  return formatted;
};

const sanitizeRuchnikCode = (value: string) => {
  const digits = sanitizeDigits(value);

  if (isAlfaType.value) {
    return digits.slice(0, 7);
  }

  if (isOtpType.value) {
    return formatOtpCode(digits);
  }

  return value.replace(/[^0-9-]/g, "");
};

const applyFormattedValue = (
  rawValue: string,
  target?: HTMLInputElement | null
) => {
  const formatted = sanitizeRuchnikCode(rawValue);
  if (target && target.value !== formatted) {
    target.value = formatted;
  }
  newRuchnikCode.value = formatted;
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  applyFormattedValue(target.value, target);
};

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const pastedText = event.clipboardData?.getData("text") || "";
  applyFormattedValue(pastedText);
};

const allowRuchnikCharacters = (event: KeyboardEvent) => {
  // Разрешенные клавиши (управляющие клавиши)
  const allowedKeys = [
    "Backspace", "Delete", "Tab", "Escape", "Enter",
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "Home", "End", "PageUp", "PageDown"
  ];

  // Разрешенные комбинации клавиш
  const isCtrlA = event.ctrlKey && event.key.toLowerCase() === "a";
  const isCtrlC = event.ctrlKey && event.key.toLowerCase() === "c";
  const isCtrlV = event.ctrlKey && event.key.toLowerCase() === "v";
  const isCtrlX = event.ctrlKey && event.key.toLowerCase() === "x";
  const isCtrlZ = event.ctrlKey && event.key.toLowerCase() === "z";

  // Проверяем, является ли клавиша разрешенной
  const isAllowedKey = allowedKeys.includes(event.key);
  const isAllowedCombination = isCtrlA || isCtrlC || isCtrlV || isCtrlX || isCtrlZ;

  // Проверяем, является ли символ цифрой
  const isDigit = /[0-9]/.test(event.key);
  const isHyphen = event.key === "-";

  // Для Альфы и ОТП вводим только цифры (без ручного "-")
  const digitsOnly = isAlfaType.value || isOtpType.value;
  const maxDigits = isAlfaType.value ? 7 : isOtpType.value ? 11 : null;

  if (
    isDigit &&
    maxDigits !== null &&
    sanitizeDigits(newRuchnikCode.value).length >= maxDigits
  ) {
    event.preventDefault();
    return;
  }

  // Блокируем ввод, если это не цифра и не разрешенная клавиша/комбинация
  if (
    !isDigit &&
    !(isHyphen && !digitsOnly) &&
    !isAllowedKey &&
    !isAllowedCombination
  ) {
    event.preventDefault();
  }
};

const handleAdd = () => {
  if (newRuchnikCode.value.trim()) {
    emit("add", {
      code: newRuchnikCode.value.trim(),
      editingRuchnik: editingRuchnik.value || undefined
    });
  }
};

const handleRemove = (ruchnik: Ruchnik) => {
  emit("remove", ruchnik.id);
};

const handleEdit = (ruchnik: Ruchnik) => {
  editingRuchnik.value = ruchnik;
  newRuchnikCode.value = ruchnik.code;
  emit("edit", ruchnik);
};

const cancelEdit = () => {
  editingRuchnik.value = null;
  newRuchnikCode.value = "";
};

watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue || "";
});

watch(() => props.resetKey, () => {
  newRuchnikCode.value = "";
  editingRuchnik.value = null;
  localSearchQuery.value = "";
});
</script>

<style scoped>
.ruchnik-block {
  width: 100%;
  height: 100%;
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

.ruchnik-list-column,
.ruchnik-add-column {
  background: var(--russ-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--russ-shadow-default);
  border: 1px solid var(--russ-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ruchnik-section-title {
  font-size: clamp(16px, calc(16px + (20 - 16) * ((100vw - 320px) / (1920 - 320))), 20px);
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ruchnik-counter {
  color: var(--russ-text-tertiary);
  font-weight: 500;
  font-size: 14px;
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
  border: 1px dashed var(--russ-border-light);
}

.ruchnik-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.ruchnik-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--russ-border-light);
  transition: all 0.2s ease;
}

.ruchnik-card:hover {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-dark);
  box-shadow: 0 4px 12px var(--russ-shadow-color);
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
  background: var(--russ-accent-light);
  color: var(--russ-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
}

.ruchnik-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ruchnik-code {
  font-weight: 600;
  color: var(--russ-text-primary);
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
}

.ruchnik-user {
  color: var(--russ-text-muted);
  font-size: clamp(12px, calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))), 14px);
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
}

.ruchnik-empty-text {
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 8px;
}

.ruchnik-empty-subtext {
  font-size: clamp(12px, calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))), 14px);
  color: var(--russ-text-tertiary);
}

.ruchnik-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  transition: all 0.2s ease;
}

.ruchnik-edit-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--russ-warning-light);
  border: 1px solid var(--russ-warning);
  border-radius: 8px;
  color: var(--russ-warning-text);
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  margin-bottom: 8px;
}

.ruchnik-cancel-edit-btn {
  background: none;
  border: none;
  color: var(--russ-warning-text);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.ruchnik-cancel-edit-btn:hover {
  background: var(--russ-warning-light);
}

.ruchnik-input-group {
  display: flex;
  flex-direction: column;
  min-height: 60px;
}

.ruchnik-label {
  font-size: clamp(13px, calc(13px + (15 - 13) * ((100vw - 320px) / (1920 - 320))), 15px);
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.ruchnik-input {
  padding: 12px 16px;
  border: 2px solid var(--russ-input-border);
  border-radius: 10px;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  background: var(--russ-bg);
  transition: all 0.2s ease;
  color: var(--russ-text-primary);
}

.ruchnik-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  box-shadow: 0 0 0 3px var(--russ-shadow-secondary);
}

.ruchnik-input-error {
  border-color: var(--russ-input-border-error);
  box-shadow: 0 0 0 3px var(--russ-shadow-error);
}

.ruchnik-error-message {
  color: var(--russ-error);
  font-size: clamp(11px, calc(11px + (13 - 11) * ((100vw - 320px) / (1920 - 320))), 13px);
  font-weight: 500;
}

.ruchnik-add-btn {
  background: var(--russ-accent-light);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  min-width: 120px;
}

.ruchnik-add-btn:hover:not([disabled]) {
  background: var(--russ-accent-light);
}

.ruchnik-add-btn[disabled] {
  background: var(--russ-neutral-light);
  color: var(--russ-text-tertiary);
  cursor: not-allowed;
  opacity: 0.7;
}

.ruchnik-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.ruchnik-btn-text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  text-align: center;
}

.ruchnik-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.ruchnik-no-access {
  text-align: center;
  padding: 40px 20px;
  color: var(--russ-text-tertiary);
}

.ruchnik-no-access-text {
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 8px;
}

.ruchnik-no-access-subtext {
  font-size: clamp(12px, calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))), 14px);
  color: var(--russ-text-muted);
}

.ruchnik-search-compact {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--russ-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--russ-border-light);
}

.ruchnik-search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.ruchnik-search-icon {
  position: absolute;
  left: 12px;
  color: var(--russ-text-tertiary);
  font-size: 14px;
  z-index: 1;
}

.ruchnik-search-input-compact {
  width: 100%;
  padding: 8px 12px 8px 36px !important;
  border: 1px solid var(--russ-border-dark);
  border-radius: 6px;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  background: var(--russ-bg);
  transition: all 0.2s ease;
  color: var(--russ-text-secondary);
}

.ruchnik-search-input-compact:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.ruchnik-search-clear {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.ruchnik-search-clear:hover {
  background: var(--russ-bg-light);
  color: var(--russ-text-secondary);
}

.ruchnik-search-count {
  margin-top: 8px;
  font-size: 12px;
  color: var(--russ-text-tertiary);
  font-weight: 500;
  text-align: right;
}

@media (max-width: 700px) {
  .ruchnik-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ruchnik-list-column,
  .ruchnik-add-column {
    padding: 16px;
  }


  .ruchnik-card {
    padding: 12px;
  }

  .ruchnik-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
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
    min-height: 44px;
    min-width: 100px;
  }

  .ruchnik-btn-text {
    min-width: 70px;
  }

  .ruchnik-empty,
  .ruchnik-no-access {
    padding: 30px 16px;
  }



  .ruchnik-search-compact {
    margin-bottom: 12px;
    padding: 10px;
  }

  .ruchnik-search-input-compact {
    font-size: 16px;
  }
}
</style>