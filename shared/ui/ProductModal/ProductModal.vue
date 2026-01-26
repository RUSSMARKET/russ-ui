<template>
  <BaseModal
    v-model="modalVisible"
    width="95vw"
    max-width="800px"
    max-height="85vh"
    class="product-modal"
    :title="isEditMode ? 'Редактировать продукт' : 'Создать новый продукт'"
    @hide="onHide"
  >
    <div class="product-form">
      <div class="form-row">
        <label for="product-name" class="form-label">Название продукта</label>
        <InputText
          id="product-name"
          :model-value="productForm.name"
          @update:model-value="updateField('name', $event)"
          variant="off"
          class="w-full"
          placeholder="Введите название продукта"
        />
      </div>
      <div class="form-row">
        <label for="product-handler" class="form-label">ID типа продукта (handler_id)</label>
        <InputText
          id="product-handler"
          :model-value="productForm.handler_id"
          @update:model-value="updateField('handler_id', $event)"
          type="number"
          variant="off"
          class="w-full"
          placeholder="Введите ID типа продукта"
        />
      </div>
      <div class="form-row">
        <label for="product-category" class="form-label">Категория продукта</label>
        <select
          id="product-category"
          :value="productForm.category_id"
          @change="updateField('category_id', ($event.target as HTMLSelectElement).value)"
          class="modern-select"
          required
        >
          <option value="" disabled>Выберите категорию</option>
          <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">{{ cat.name }}</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-label">Логотип продукта</label>
        <div class="logo-upload">
          <div v-if="logoPreview || productForm.logo" class="logo-preview-container">
            <img
              :src="logoPreview || productForm.logo"
              :alt="logoPreview ? 'Превью загруженного логотипа' : 'Текущий логотип'"
              class="logo-preview"
            />
            <div class="logo-preview-overlay">
              <button
                type="button"
                class="remove-logo-btn"
                @click="handleRemoveLogo"
                title="Удалить логотип"
              >
                <svg viewBox="0 0 24 24" class="remove-icon">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <FileUpload
            mode="basic"
            :auto="true"
            accept="image/*"
            :maxFileSize="1000000"
            @select="handleLogoSelect"
            chooseLabel="Выбрать файл"
            class="w-full"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="form-actions flex gap-2 mt-4">
        <Button label="Отмена" @click="close" class="custom-button-text cancel-btn" />
        <Button :label="isEditMode ? 'Сохранить' : 'Создать'" @click="handleSubmit" class="create-btn" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal, InputText, Button } from '~/shared/ui';
import FileUpload from 'primevue/fileupload';
import type { Category } from '~/entities/product';

interface ProductForm {
  name?: string;
  handler_id?: string;
  category_id?: string;
  logo?: string;
}

interface Props {
  visible: boolean;
  isEditMode: boolean;
  productForm: ProductForm;
  logoPreview?: string | null;
  categories: Category[];
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:product-form', value: ProductForm): void;
  (e: 'logo-select', event: { files: File[] }): void;
  (e: 'remove-logo'): void;
  (e: 'submit'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const updateField = (field: keyof ProductForm, value: any) => {
  emit('update:product-form', { ...props.productForm, [field]: value });
};

const handleLogoSelect = (event: any) => {
  // PrimeVue FileUpload emits event with files property
  // We need to recreate the event structure that parent expects
  const file = event.files?.[0];
  if (file) {
    // Create event-like object that parent's onLogoSelect expects
    emit('logo-select', { files: [file] } as any);
  }
};

const handleRemoveLogo = () => {
  emit('remove-logo');
};

const handleSubmit = () => {
  emit('submit');
};

const close = () => {
  modalVisible.value = false;
  emit('close');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.logo-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logo-preview-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.logo-preview-container:hover .logo-preview-overlay {
  opacity: 1;
}

.remove-logo-btn {
  background: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.remove-logo-btn:hover {
  transform: scale(1.1);
}

.remove-icon {
  width: 20px;
  height: 20px;
  fill: #ef4444;
}

.modern-select {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.04);
  color: #2D2D2D;
  box-sizing: border-box;
  font-size: 14px;
}

.modern-select:focus {
  border-color: #667eea;
  box-shadow: 1px 0px 5px 5px #0000000F;
  outline: none;
  background: white;
}

.modern-select:hover {
  border-color: #d1d5db;
  background: white;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  width: 100%;
}

.form-actions .cancel-btn {
  flex: 1;
  background: #f3f4f6 !important;
  color: #6b7280 !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

.form-actions .cancel-btn:hover {
  background: #e5e7eb !important;
  color: #374151 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.form-actions .create-btn {
  flex: 1;
  background: #1D4CD2 !important;
  color: white !important;
  border: 1px solid #1D4CD2 !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

.form-actions .create-btn:hover {
  background: #1e40af !important;
  border-color: #1e40af !important;
  box-shadow: 0 4px 12px rgba(29, 76, 210, 0.3) !important;
}

</style>
