<!--
  AddItemBlock - Универсальный компонент для добавления/удаления элементов
  
  Использование:
  <AddItemBlock
    :items="[]"                    // Текущие элементы
    :available-items="[]"          // Доступные для добавления элементы
    :config="{                     // Конфигурация текстов (опционально)
      listTitle: 'Заголовок списка',
      addTitle: 'Заголовок добавления',
      listLoadingText: 'Загрузка...',
      addLoadingText: 'Загрузка...',
      addButtonLoadingText: 'Добавление...',
      emptyText: 'Нет элементов',
      emptySubtext: 'Подсказка',
      allAddedText: 'Все добавлены',
      allAddedSubtext: 'Подсказка',
      selectLabel: 'Выберите',
      selectPlaceholder: 'Выберите из списка',
      addButtonText: 'Добавить',
      removeButtonTitle: 'Удалить'
    }"
    :get-item-name="(item) => item.name"           // Функция получения имени
    :get-item-subtitle="(item) => item.subtitle"   // Функция получения подзаголовка
    :show-edit-button="false"                      // Показывать кнопку редактирования
    @add="(itemId) => handleAdd(itemId)"           // Событие добавления
    @remove="(itemId) => handleRemove(itemId)"     // Событие удаления
    @edit="(item) => handleEdit(item)"             // Событие редактирования
  />
  
  События:
  - @add: вызывается при добавлении элемента, передает itemId
  - @remove: вызывается при удалении элемента, передает itemId
  - @edit: вызывается при редактировании элемента, передает item
-->

<template>
  <div class="add-item-block">
    <div class="supports-container">
      <div class="supports-list-column">
        <h4 class="supports-section-title">{{ computedProps.listTitle }}</h4>

        <div v-if="listLoading" class="supports-loading">
          <span class="loader"></span>
          <span>{{ computedProps.listLoadingText }}</span>
        </div>

        <div v-else-if="items.length > 0" class="supports-list">
          <div v-for="item in items" :key="item.id" class="support-card"
            :class="{ 'support-card-disabled': item.disabled }">
            <div class="support-card-content">
              <div class="support-avatar category-avatar">
                <i class="pi pi-tag"></i>
              </div>
              <div v-if="item.disabled" class="locked-indicator" title="Заблокировано">
                <i class="pi pi-lock"></i>
              </div>
              <div class="support-info">
                <div class="support-fio">{{ getItemName(item) }}</div>
                <div v-if="getItemSubtitle(item)" class="support-phone">{{ getItemSubtitle(item) }}</div>
                <div v-if="showProductFields && (productFields && productFields.length)"
                  class="product-fields-under-item ultra-compact">
                  <div
                    v-for="field in (productFields.filter(f => f.product_id === item.id && (!fieldNameFilter || (f.name || '').toLowerCase() === fieldNameFilter)))"
                    :key="(field.id || field.name) + '-' + item.id" class="product-field-row ultra-compact-row">
                    <div class="product-field-controls ultra-compact-controls">
                      <input type="text" class="product-field-input ultra-compact-input"
                        v-model="fieldValues[field.id as number]" :placeholder="field.name || 'Поле'"
                        :data-field-id="field.id" @keyup.enter="updateField(field.id)" @blur="updateField(field.id)" />
                      <button class="product-field-save ultra-compact-save" @click="updateField(field.id)"
                        title="Сохранить">
                        <i class="pi pi-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="support-actions">
              <button v-if="showEditButton" class="support-edit-btn"
                :class="{ 'support-edit-btn-disabled': item.disabled }"
                :title="item.disabled ? 'Редактирование заблокировано' : 'Редактировать'" :disabled="item.disabled"
                @click="handleEdit(item)">
                <i class="pi pi-pencil"></i>
              </button>
              <button v-if="showRemoveButton" class="support-remove-btn" :title="computedProps.removeButtonTitle"
                @click="handleRemove(item)">
                <i class="pi pi-trash"></i>
              </button>
            </div>

          </div>
        </div>

        <div v-else class="supports-empty">
          <div class="supports-empty-text">{{ computedProps.emptyText }}</div>
          <div class="supports-empty-subtext">{{ computedProps.emptySubtext }}</div>
        </div>
      </div>

      <div class="supports-add-column">
        <h4 class="supports-section-title">{{ computedProps.addTitle }}</h4>

        <div v-if="false" class="supports-add-loading">
          <span class="loader"></span>
          <span>{{ computedProps.addLoadingText }}</span>
        </div>

        <div v-else class="supports-add-form">
          <slot name="select" :available-items="availableItems" :on-add="handleSlotAdd">
            <div v-if="availableItems.length > 0">
              <div class="support-select-wrapper">
                <label class="support-select-label">{{
                  computedProps.selectLabel
                }}</label>
                <select v-model="selectedItemId" class="support-select">
                  <option value="">{{ computedProps.selectPlaceholder }}</option>
                  <option v-for="item in availableItems" :key="item.id" :value="item.id">
                    {{ getItemName(item) }}
                  </option>
                </select>
                <button class="support-add-btn" @click="handleAdd" :disabled="addButtonLoading || !selectedItemId">
                  <span v-if="addButtonLoading" class="loader"></span>
                  <i v-else class="pi pi-plus"></i>
                  <span v-if="addButtonLoading">{{
                    computedProps.addButtonLoadingText
                  }}</span>
                  <span v-else>{{ computedProps.addButtonText }}</span>
                </button>
              </div>
            </div>
            <div v-else class="supports-all-attached">
              <div class="supports-all-text">{{ computedProps.allAddedText }}</div>
              <div class="supports-all-subtext">{{ computedProps.allAddedSubtext }}</div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";


interface Props {
  items: any[];
  availableItems: any[];

  listLoading?: boolean;
  addButtonLoading?: boolean;

  config?: {
    listTitle?: string;
    addTitle?: string;
    listLoadingText?: string;
    addLoadingText?: string;
    addButtonLoadingText?: string;
    emptyText?: string;
    emptySubtext?: string;
    allAddedText?: string;
    allAddedSubtext?: string;
    selectLabel?: string;
    selectPlaceholder?: string;
    addButtonText?: string;
    removeButtonTitle?: string;
  };

  listTitle?: string;
  addTitle?: string;

  listLoadingText?: string;
  addLoadingText?: string;
  addButtonLoadingText?: string;

  emptyText?: string;
  emptySubtext?: string;
  allAddedText?: string;
  allAddedSubtext?: string;

  selectLabel?: string;
  selectPlaceholder?: string;
  addButtonText?: string;
  removeButtonTitle?: string;

  getItemName?: (item: any) => string;
  getItemSubtitle?: (item: any) => string;

  showEditButton?: boolean;
  showRemoveButton?: boolean;

  showProductFields?: boolean;
  productFields?: Array<{
    id?: number;
    name?: string;
    value?: string;
    product_id?: number;
  }>;
}

interface Emits {
  (e: "add", itemId: string | number | Record<string, any>): void;
  (e: "remove", itemId: string | number): void;
  (e: "edit", item: any): void;
  (e: "update-field", fieldId: number, value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  listLoading: false,
  addButtonLoading: false,
  listTitle: "Текущие элементы",
  addTitle: "Добавить элемент",
  listLoadingText: "Загрузка элементов...",
  addLoadingText: "Загрузка доступных элементов...",
  addButtonLoadingText: "Добавление...",
  emptyText: "Нет элементов",
  emptySubtext: "Добавьте элементы в правой панели",
  allAddedText: "Все элементы уже добавлены",
  allAddedSubtext: "Нет доступных элементов для добавления",
  selectLabel: "Выберите элемент",
  selectPlaceholder: "Выберите из списка",
  addButtonText: "Добавить",
  removeButtonTitle: "Удалить",
  showEditButton: false,
  showRemoveButton: true,
  showProductFields: false,
  productFields: () => [] as Array<{ id?: number; name?: string; value?: string }>,
});

const computedProps = computed(() => {
  if (props.config) {
    return {
      listTitle: props.config.listTitle || props.listTitle,
      addTitle: props.config.addTitle || props.addTitle,
      listLoadingText: props.config.listLoadingText || props.listLoadingText,
      addLoadingText: props.config.addLoadingText || props.addLoadingText,
      addButtonLoadingText:
        props.config.addButtonLoadingText || props.addButtonLoadingText,
      emptyText: props.config.emptyText || props.emptyText,
      emptySubtext: props.config.emptySubtext || props.emptySubtext,
      allAddedText: props.config.allAddedText || props.allAddedText,
      allAddedSubtext: props.config.allAddedSubtext || props.allAddedSubtext,
      selectLabel: props.config.selectLabel || props.selectLabel,
      selectPlaceholder: props.config.selectPlaceholder || props.selectPlaceholder,
      addButtonText: props.config.addButtonText || props.addButtonText,
      removeButtonTitle: props.config.removeButtonTitle || props.removeButtonTitle,
    };
  }
  return {
    listTitle: props.listTitle,
    addTitle: props.addTitle,
    listLoadingText: props.listLoadingText,
    addLoadingText: props.addLoadingText,
    addButtonLoadingText: props.addButtonLoadingText,
    emptyText: props.emptyText,
    emptySubtext: props.emptySubtext,
    allAddedText: props.allAddedText,
    allAddedSubtext: props.allAddedSubtext,
    selectLabel: props.selectLabel,
    selectPlaceholder: props.selectPlaceholder,
    addButtonText: props.addButtonText,
    removeButtonTitle: props.removeButtonTitle,
  };
});

const getItemName = (item: any): string => {
  if (props.getItemName) {
    return props.getItemName(item);
  }
  if (item.surname && item.name) {
    return [item.surname, item.name, item.patronymic].filter(Boolean).join(' ');
  }
  return item.name || item.fullName || "";
};

const getItemSubtitle = (item: any): string => {
  if (props.getItemSubtitle) {
    return props.getItemSubtitle(item);
  }
  return "";
};


const emit = defineEmits<Emits>();

const selectedItemId = ref<string | number>("");

const handleAdd = () => {
  if (selectedItemId.value) {
    emit("add", selectedItemId.value);
    selectedItemId.value = "";
  }
};

const handleSlotAdd = () => {
  emit("add", {});
};

const handleRemove = (item: any) => {
  if (item && item.id) {
    emit("remove", item.id);
  } else {
    console.error("Item ID is missing for removal:", item);
  }
};

const handleEdit = (item: any) => {
  if (item && !item.disabled) {
    emit("edit", item);
  }
};

const fieldValues = ref<Record<number, string>>({});
const fieldNameFilter = null;

const initializeFieldValues = () => {
  const values: Record<number, string> = {};
  (props.productFields || []).forEach((f) => {
    if (typeof f.id === "number") {
      values[f.id] = f.value || "";
    }
  });
  fieldValues.value = values;
};

initializeFieldValues();

watch(
  () => props.productFields,
  () => {
    initializeFieldValues();
  },
  { deep: true }
);

const updateField = (fieldId?: number) => {
  if (typeof fieldId !== "number") return;
  const value = fieldValues.value[fieldId] ?? "";
  emit("update-field", fieldId, value);
};

</script>

<style scoped>
.add-item-block {
  width: 100%;
}

.supports-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 20px;
}

.supports-list-column,
.supports-add-column {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  height: 500px;
}

.supports-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d2d;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.product-fields-section {
  margin-top: 24px;
}

.product-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.product-fields-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.product-fields-header h6 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #334155;
}

.product-fields-list {
  display: flex;
  gap: 8px;
}

.product-field-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  min-width: 0;
}

.product-field-input.compact {
  padding: 6px 8px;
  height: 34px;
  font-size: 13px;
}

.product-field-input.ultra-compact-input,
.product-field-input.ultra-compact {
  padding: 4px 6px;
  height: 28px;
  font-size: 12px;
}

.product-field-save {
  padding: 8px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.product-field-save.compact {
  padding: 6px 10px;
  height: 34px;
  font-size: 12px;
}

.product-field-save.ultra-compact-save,
.product-field-save.ultra-compact {
  padding: 4px 8px;
  height: 28px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.product-field-save:hover {
  background: #1d4ed8;
}

.product-fields-under-item {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.product-fields-under-item.ultra-compact {
  margin-top: 6px;
  padding-top: 4px;
}

.product-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.product-field-row.ultra-compact-row,
.product-field-row.compact-row {
  gap: 6px;
  margin-top: 4px;
}

.product-field-label {
  min-width: 80px;
  font-size: 12px;
  color: #64748b;
}

.product-field-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.product-field-controls.ultra-compact-controls {
  gap: 4px;
}

.supports-loading,
.supports-add-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #2d2d2d;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.supports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 400px;
  min-height: 400px;
  max-height: 400px;
  overflow-y: auto;
}


.support-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.support-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.support-card-disabled {
  opacity: 0.6;
  background: #f3f4f6 !important;
  border-color: #d1d5db !important;
}

.support-card-disabled:hover {
  background: #f3f4f6 !important;
  border-color: #d1d5db !important;
  box-shadow: none !important;
  transform: none !important;
}

.support-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.locked-indicator {
  color: #ef4444;
  font-size: 14px;
  margin-left: 4px;
}

.support-avatar {
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

.support-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.support-fio {
  font-weight: 600;
  color: #2d2d2d;
  font-size: 15px;
}

.support-phone {
  color: #919191;
  font-size: 13px;
}


.support-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.support-edit-btn {
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

.support-edit-btn:hover:not([disabled]) {
  background: #bfdbfe;
  color: #1d4ed8;
  transform: scale(1.05);
}

.support-edit-btn[disabled],
.support-edit-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #e5e7eb !important;
  color: #9ca3af !important;
}

.support-edit-btn[disabled]:hover,
.support-edit-btn-disabled:hover {
  background: #e5e7eb !important;
  color: #9ca3af !important;
  transform: none !important;
}



.support-remove-btn {
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

.support-remove-btn:hover:not([disabled]) {
  background: #fecaca;
  color: #b91c1c;
  transform: scale(1.05);
}

.support-remove-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.support-remove-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.supports-empty {
  text-align: center;
  padding: 40px 20px;
  color: #919191;
}

.supports-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.supports-empty-subtext {
  font-size: 14px;
  color: #94a3b8;
}

.supports-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.support-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.support-select-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.support-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: #fff;
  transition: all 0.2s ease;
  color: #2d2d2d;
}

.support-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.support-add-btn {
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

.support-add-btn:hover:not([disabled]) {
  background: #6b9eff;
}

.support-add-btn[disabled] {
  background: #9ca3af;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.support-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.supports-all-attached {
  text-align: center;
  padding: 40px 20px;
  color: #059669;
}

.supports-all-text {
  font-size: 16px;
  font-weight: 600;
  color: #047857;
  margin-bottom: 8px;
}

.supports-all-subtext {
  font-size: 14px;
  color: #10b981;
}

.product-avatar {
  background: linear-gradient(135deg, #15bfa2 60%, #1fcfb1 100%) !important;
}

.product-avatar i {
  font-size: 18px;
}

.agent-avatar {
  background: #475569 !important;
}

.agent-avatar span {
  font-size: 16px;
  font-weight: 700;
}

.project-point-modal .supports-container {
  margin-top: 0;
}

.project-point-modal .supports-list-column,
.project-point-modal .supports-add-column {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.project-point-modal .supports-section-title {
  color: #475569;
  border-bottom-color: #cbd5e1;
}

.project-point-modal .support-card {
  background: #fff;
  border: 1px solid #e2e8f0;
}

.project-point-modal .support-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.project-point-modal .support-remove-btn {
  background: #fef2f2;
  color: #dc2626;
}

.project-point-modal .support-remove-btn:hover:not([disabled]) {
  background: #fee2e2;
  color: #b91c1c;
}

.project-point-modal .support-add-btn:hover:not([disabled]) {
  background: #6b9eff;
}

.project-point-modal .supports-loading,
.project-point-modal .supports-add-loading {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #475569;
}

.project-point-modal .supports-empty {
  color: #919191;
}

.project-point-modal .supports-empty-text {
  color: #475569;
}

.project-point-modal .supports-empty-subtext {
  color: #94a3b8;
}

.project-point-modal .supports-all-attached {
  color: #059669;
}

.project-point-modal .supports-all-text {
  color: #047857;
}

.project-point-modal .supports-all-subtext {
  color: #10b981;
}

.agent-modal-modern .supports-container {
  margin-top: 0;
}

.agent-modal-modern .supports-list-column,
.agent-modal-modern .supports-add-column {
  background: #f6f6f6;
  border: 1px solid #f2f2f2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.agent-modal-modern .supports-section-title {
  color: #2d2d2d;
  border-bottom-color: #f2f2f2;
}

.agent-modal-modern .support-card {
  background: #f2f2f2;
  border: 1px solid #f2f2f2;
}

.agent-modal-modern .support-card:hover {
  background: #f6f6f6;
  border-color: #f2f2f2;
}

.agent-modal-modern .support-remove-btn {
  background: #fef2f2;
  color: #dc2626;
}

.agent-modal-modern .support-remove-btn:hover:not([disabled]) {
  background: #fee2e2;
  color: #b91c1c;
}

.agent-modal-modern .supports-loading,
.agent-modal-modern .supports-add-loading {
  background: #f2f2f2;
  border: 1px dashed #f2f2f2;
  color: #2d2d2d;
}

.agent-modal-modern .supports-empty {
  color: #949494;
}

.agent-modal-modern .supports-empty-text {
  color: #2d2d2d;
}

.agent-modal-modern .supports-empty-subtext {
  color: #949494;
}

.agent-modal-modern .supports-all-attached {
  color: #059669;
}

.agent-modal-modern .supports-all-text {
  color: #047857;
}

.agent-modal-modern .supports-all-subtext {
  color: #10b981;
}

.agent-modal-modern .support-select-label {
  color: #2d2d2d;
}

.agent-modal-modern .support-fio {
  color: #2d2d2d;
}

.agent-modal-modern .support-phone {
  color: #949494;
}


@media (max-width: 700px) {
  .supports-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .supports-list-column,
  .supports-add-column {
    padding: 16px;
  }

  .supports-section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .support-card {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .support-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .support-fio {
    font-size: 14px;
  }

  .support-phone {
    font-size: 12px;
  }

  .support-actions {
    gap: 6px;
    margin-top: 8px;
    align-self: flex-end;
  }

  .product-field-row.ultra-compact-row {
    align-items: stretch;
  }

  .product-field-controls,
  .product-field-controls.ultra-compact-controls {
    flex-wrap: wrap;
    gap: 6px;
  }

  .product-field-input,
  .product-field-input.ultra-compact-input {
    width: 100%;
    flex: 1 1 100%;
  }

  .product-field-save,
  .product-field-save.ultra-compact-save {
    flex: 0 0 auto;
  }

  .support-edit-btn,
  .support-remove-btn {
    min-width: 36px;
    height: 36px;
    padding: 6px 10px;
  }

  .support-add-btn {
    padding: 12px 16px;
    font-size: 14px;
  }

  .supports-empty,
  .supports-all-attached {
    padding: 30px 16px;
  }

  .supports-empty-text,
  .supports-all-text {
    font-size: 14px;
  }

  .supports-empty-subtext,
  .supports-all-subtext {
    font-size: 12px;
  }
}
</style>
