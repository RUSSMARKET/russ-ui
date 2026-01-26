<template>
  <BaseModal
    :model-value="visible"
    @update:model-value="closeModal"
    title="Информация о проекте"
    size="sm"
  >
    <form @submit.prevent="handleSubmit" id="project-info-form">
      <div class="project-info-block-form">
        <div class="form-row">
          <label>Название</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-row">
          <BaseSelect label="Руководитель проекта" v-model="form.project_manager_id"
            :options="projectManagers" placeholder="Выберите руководителя" option-label="fullName"
            option-value="id" :loading="staffLoading" />
        </div>
        <div class="form-row">
          <StatusSelect 
            label="Региональные руководители (не обязательно, максимум 3)"
            v-model="form.regional_director_ids" 
            :options="regionalDirectors"
            placeholder="Выберите руководителей" 
            option-label="fullName" 
            option-value="id"
            :multiple="true"
            :searchable="true"
            :disabled="staffLoading"
          />
        </div>
      </div>

      <div v-if="backendError" class="backend-error">{{ backendError }}</div>
    </form>

    <template #footer>
      <button type="button" @click="closeModal" :disabled="loading" class="btn-cancel">Отмена</button>
      <button type="submit" form="project-info-form" :disabled="loading" class="btn-submit">
        <span v-if="loading" class="loader"></span>
        <span v-if="loading">Сохранение...</span>
        <span v-else>Сохранить</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseSelect, BaseModal, StatusSelect } from '@/shared/ui';
import { updateProjectAPI } from '~/pages/project/api/index';

interface Props {
  visible: boolean;
  project: {
    id: number;
    name: string;
    project_manager_id?: number | string;
    regional_director_id?: number | string;
    regional_director_ids?: (number | string)[];
    regional_directors?: Array<{
      id: number;
      name: string;
      surname: string;
      patronymic?: string | null;
    }>;
  } | null;
  projectManagers: any[];
  regionalDirectors: any[];
  staffLoading: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const form = ref<{
  id: number | null;
  name: string;
  project_manager_id: string;
  regional_director_ids: (string | number)[];
}>({
  id: null,
  name: "",
  project_manager_id: "",
  regional_director_ids: [],
});

const loading = ref(false);
const backendError = ref("");

watch(() => props.project, (newProject) => {
  if (newProject) {
    form.value.id = newProject.id;
    form.value.name = newProject.name;
    form.value.project_manager_id = newProject.project_manager_id ? String(newProject.project_manager_id) : "";
    
    // Поддержка нового формата (regional_directors) и старого (regional_director_id)
    if (newProject.regional_directors && Array.isArray(newProject.regional_directors)) {
      form.value.regional_director_ids = newProject.regional_directors
        .map((dir: any) => String(dir.id))
        .filter(Boolean);
    } else if (newProject.regional_director_ids && Array.isArray(newProject.regional_director_ids)) {
      form.value.regional_director_ids = newProject.regional_director_ids.map(id => String(id));
    } else if (newProject.regional_director_id) {
      // Обратная совместимость со старым форматом
      form.value.regional_director_ids = [String(newProject.regional_director_id)];
    } else {
      form.value.regional_director_ids = [];
    }
  }
}, { immediate: true });

const closeModal = () => {
  emit('close');
  backendError.value = "";
};

const handleSubmit = async () => {
  if (!form.value.id) return;
  
  loading.value = true;
  backendError.value = "";
  
  try {
    // Валидация: максимум 3 региональных руководителя
    const directorIds = Array.isArray(form.value.regional_director_ids) 
      ? form.value.regional_director_ids.filter(id => id !== "" && id !== null)
      : [];
    
    if (directorIds.length > 3) {
      backendError.value = "Можно выбрать максимум 3 региональных руководителя";
      loading.value = false;
      return;
    }

    const updateData: any = {
      name: form.value.name,
      disabled: "1",
      project_manager_id: form.value.project_manager_id || "",
      regional_director_ids: directorIds.length > 0 ? directorIds : [],
    };

    await updateProjectAPI(form.value.id, updateData);
    emit('updated');
    closeModal();
  } catch (err) {
    let msg = "Ошибка при сохранении проекта";
    if (err && typeof err === "object") {
      if ("response" in err && (err as any).response?.data?.message) {
        msg = (err as any).response.data.message;
      } else if ("message" in err && (err as any).message) {
        msg = (err as any).message;
      }
    }
    backendError.value = msg;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>

.project-info-block-form {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0;
  overflow: visible;
}

.project-info-block-form .form-row {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  overflow: visible;
  position: relative;
}

.project-info-block-form .form-row:last-of-type {
  margin-bottom: 0;
}

.project-info-block-form .form-row label {
  display: block;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  color: #374151;
  font-weight: 500;
  margin-bottom: 2px;
}

.project-info-block-form .form-row input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  color: #111827;
  transition: all 0.2s ease;
  background: #ffffff;
  box-sizing: border-box;
}

.project-info-block-form .form-row input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.project-info-block-form .form-row input:hover {
  border-color: #9ca3af;
}

.project-info-block-form .form-row input::placeholder {
  color: #9ca3af;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: clamp(14px, calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))), 16px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-cancel:hover:not([disabled]) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.btn-submit {
  background: #4f46e5;
  color: white;
}

.btn-submit:hover:not([disabled]) {
  background: #1D4CD2;
}

.btn-cancel:disabled,
.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #d1d5db;
}

.form-actions button .loader {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
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

.backend-error {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  line-height: 1.5;
}


@media (max-width: 768px) {
  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>

