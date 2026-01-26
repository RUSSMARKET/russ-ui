<template>
  <BaseModal
    :model-value="visible"
    @update:model-value="onCancel"
    :close-on-overlay-click="!loading"
    :closable="!loading"
    size="sm"
    class="confirm-modal-base"
  >
    <div class="confirm-message">{{ message }}</div>
    <div v-if="error" class="confirm-error">{{ error }}</div>

    <template #footer>
      <div class="confirm-actions">
        <button class="btn-cancel" :disabled="loading" @click="onCancel">Нет</button>
        <button class="btn-submit" :disabled="loading" @click="onConfirm">Да</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { BaseModal } from '~/shared/ui/BaseModal';

interface Props {
  visible: boolean;
  message: string;
  error?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const onConfirm = () => {
  emit('confirm');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<style scoped>

.confirm-message {
  font-size: clamp(16px,
      calc(16px + (18 - 16) * ((100vw - 320px) / (1920 - 320))),
      18px);
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.confirm-error {
  color: #dc2626;
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 1rem 2.2rem;
  border-radius: 12px;
  font-size: clamp(14px,
      calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
      16px);
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  min-width: 130px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.07);
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1.5px solid #d1d5db;
}

.btn-submit {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: #2563eb;
  border-color: #2563eb;

}

.btn-submit:hover {
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);

  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.13);
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 700px) {
  .confirm-actions {
    flex-direction: column;
    gap: 0.8rem;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    font-size: 14px;
    padding: 10px 0;
    border-radius: 7px;
    min-width: 0;
    box-sizing: border-box;
  }
}
</style>
