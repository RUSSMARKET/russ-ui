<template>
  <BaseModal
    v-model="modalVisible"
    class="handler4-final-modal"
    :closable="false"
    :close-on-overlay-click="false"
    :close-on-escape="false"
    @hide="onHide"
  >
    <div class="handler4-modal-content">
      <h2 class="handler4-title">Выдали карту?</h2>
      <p class="handler4-subtitle">Нажмите на кнопку ниже с соответствующим вариантом</p>
      <div class="handler4-buttons">
        <Button label="Да" class="handler4-btn handler4-btn-yes" @click="handleYes" />
        <Button label="Нет" class="handler4-btn handler4-btn-no" @click="handleNo" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal, Button } from '~/shared/ui';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'yes'): void;
  (e: 'no'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const handleYes = () => {
  emit('yes');
};

const handleNo = () => {
  emit('no');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.handler4-modal-content {
  text-align: center;
  padding: 2rem;
}

.handler4-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.handler4-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.handler4-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.handler4-btn {
  min-width: 120px;
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 8px;
}

.handler4-btn-yes {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.handler4-btn-yes:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.handler4-btn-no {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.handler4-btn-no:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}
</style>
