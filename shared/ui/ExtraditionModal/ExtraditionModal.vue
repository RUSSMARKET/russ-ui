<template>
  <BaseModal
    v-model="modalVisible"
    width="95vw"
    max-width="500px"
    class="extradition-modal"
    @hide="onHide"
  >
    <template #header>
      <div class="extradition-modal-header">
        <span>{{ title }}</span>
        <button @click="close" class="close-x" aria-label="Закрыть">
          ×
        </button>
      </div>
    </template>
    <slot></slot>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal } from '@/shared/ui';

interface Props {
  visible: boolean;
  title?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const close = () => {
  modalVisible.value = false;
  emit('close');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.extradition-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.close-x {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 1rem;
  font-size: 24px;
  color: var(--russ-text-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-x:hover {
  background: var(--russ-bg-disabled);
  color: var(--russ-text-secondary);
}
</style>
