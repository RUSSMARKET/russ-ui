<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="base-modal-overlay"
      @mousedown.self="onOverlayMouseDownSelf"
      @mouseup.self="onOverlayMouseUpSelf"
      @click.self="shouldCloseOnOverlayClick() && handleOverlayClick()"
      @keydown.esc="handleEscape"
    >
      <div
        ref="modalRef"
        class="base-modal"
        :class="modalClass"
        :style="modalStyle"
        @click.stop
        @mousedown="onModalMouseDown"
        @mouseup="onModalMouseUp"
      >
        <div class="base-modal-header">
          <div class="base-modal-header-content">
            <slot name="header">
              <h3 v-if="title" class="base-modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="base-modal-subtitle">{{ subtitle }}</p>
            </slot>
          </div>
          <div class="base-modal-header-actions">
            <slot name="header-actions"></slot>
            <button
              v-if="closable"
              class="base-modal-close"
              @click="handleClose"
              :aria-label="closeAriaLabel"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="base-modal-content">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="base-modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  subtitle?: string;
  closable?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  modal?: boolean;
  width?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  position?: 'center' | 'top' | 'bottom';
  closeAriaLabel?: string;
  class?: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  closeOnEscape: true,
  closeOnOverlayClick: true,
  modal: true,
  position: 'center',
  closeAriaLabel: 'Закрыть',
  class: '',
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'hide': [];
  'show': [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const mouseDownTarget = ref<'overlay' | 'modal' | null>(null);
const mouseUpTarget = ref<'overlay' | 'modal' | null>(null);

const modalClass = computed(() => {
  return [
    props.class,
    props.size ? `base-modal-size-${props.size}` : '',
    {
      'base-modal-wide': props.maxWidth === '900px' || props.width === '900px',
      'base-modal-large': props.maxWidth === '1000px' || props.width === '1000px',
    },
  ].filter(Boolean).join(' ');
});

const modalStyle = computed(() => {
  const style: Record<string, string> = {};
  
  const sizePresets: Record<'sm' | 'md' | 'lg', { width: string; maxWidth: string }> = {
    sm: { width: 'min(520px, calc(100vw - 40px))', maxWidth: 'min(520px, calc(100vw - 40px))' },
    md: { width: 'min(820px, calc(100vw - 40px))', maxWidth: 'min(820px, calc(100vw - 40px))' },
    lg: { width: 'min(1100px, calc(100vw - 40px))', maxWidth: 'min(1100px, calc(100vw - 40px))' },
  };

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  } else if (props.size && sizePresets[props.size]) {
    style.width = sizePresets[props.size].width;
  }
  
  if (props.maxWidth) {
    style.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth;
  } else if (props.size && sizePresets[props.size]) {
    style.maxWidth = sizePresets[props.size].maxWidth;
  }
  
  if (props.maxHeight) {
    style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  }
  
  return style;
});

const onOverlayMouseDownSelf = () => {
  // Запоминаем, что клик начался на overlay
  mouseDownTarget.value = 'overlay';
};

const onModalMouseDown = () => {
  // Запоминаем, что клик начался в модалке
  mouseDownTarget.value = 'modal';
};

const onModalMouseUp = () => {
  // Запоминаем, что клик закончился в модалке
  mouseUpTarget.value = 'modal';
  // Если клик начался в модалке, сбрасываем флаги
  if (mouseDownTarget.value === 'modal') {
    mouseDownTarget.value = null;
    mouseUpTarget.value = null;
  }
};

const onOverlayMouseUpSelf = () => {
  // Запоминаем, что клик закончился на overlay
  mouseUpTarget.value = 'overlay';
  // Если клик начался в модалке, сбрасываем флаги чтобы предотвратить закрытие
  if (mouseDownTarget.value === 'modal') {
    mouseDownTarget.value = null;
    mouseUpTarget.value = null;
  }
};

const shouldCloseOnOverlayClick = () => {
  // Закрываем только если:
  // 1. Клик начался на overlay И
  // 2. Клик закончился на overlay (не в модалке) И
  // 3. Включено закрытие по клику на overlay
  const should = 
    mouseDownTarget.value === 'overlay' && 
    mouseUpTarget.value !== 'modal' && 
    props.closeOnOverlayClick;
  
  // Сбрасываем флаги после проверки
  mouseDownTarget.value = null;
  mouseUpTarget.value = null;
  
  return should;
};

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    handleClose();
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
  emit('hide');
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    handleClose();
  }
};

// Блокировка скролла body при открытой модалке
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      emit('show');
      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
      // Фокусируемся на модалке для доступности
      nextTick(() => {
        modalRef.value?.focus();
      });
    } else {
      // Разблокируем скролл body
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

// Очистка при размонтировании
onUnmounted(() => {
  document.body.style.overflow = '';
});

// Обработка клавиатуры
onMounted(() => {
  if (props.closeOnEscape) {
    document.addEventListener('keydown', handleEscape);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.base-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--russ-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  touch-action: auto;
  overflow-y: auto;
  padding: 20px;
}

.base-modal-overlay::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.base-modal-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.base-modal-overlay::-webkit-scrollbar-thumb {
  background: transparent;
}

.base-modal {
  background: var(--russ-bg);
  border-radius: 25px;
  max-width: 1200px;
  width: min(1200px, calc(100vw - 40px));
  max-height: calc(min(90vh, 100dvh) - 40px);
  box-shadow: 0 4px 12px var(--russ-shadow-color);
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  animation: slideIn 0.2s ease;
  margin: auto;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  outline: none;
}

.base-modal-wide {
  max-width: 1200px;
  width: min(1200px, calc(100vw - 40px));
}

.base-modal-large {
  max-width: 1400px;
  width: min(1400px, calc(100vw - 40px));
}

.base-modal-size-sm {
  max-width: 520px;
  width: min(520px, calc(100vw - 40px));
}

.base-modal-size-md {
  max-width: 820px;
  width: min(820px, calc(100vw - 40px));
}

.base-modal-size-lg {
  max-width: 1140px;
  width: min(1140px, calc(100vw - 40px));
}

.base-modal-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
}

.base-modal-header-content {
  flex: 1;
}

.base-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-left: auto;
  flex-wrap: wrap;
}

.base-modal-title {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
  padding-right: 40px;
}

.base-modal-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
  padding-right: 40px;
}

.base-modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
  font-size: 24px;
  line-height: 1;
  padding: 0;
  border-radius: 50%;
}

.base-modal-close:hover {
  color: #374151;
  background: #f3f4f6;
}

.base-modal-close:focus {
  outline: 1px solid #9ca3af;
  outline-offset: 2px;
}

.base-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  max-width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  position: relative;
  text-align: left;
}


.base-modal-size-sm {
  max-width: 520px;
  width: min(520px, calc(100vw - 40px));
}

.base-modal-size-md {
  max-width: 820px;
  width: min(820px, calc(100vw - 40px));
}

.base-modal-size-lg {
  max-width: 1100px;
  width: min(1100px, calc(100vw - 40px));
}

/* Стили для контента внутри модалки */
.base-modal-content > * {
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.base-modal-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.base-modal-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.base-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.base-modal-footer > * {
  flex-shrink: 0;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .base-modal-overlay {
    padding: 10px;
  }

  .base-modal {
    max-width: calc(100vw - 20px);
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 8px;
  }

  .base-modal-wide {
    max-width: calc(100vw - 20px);
    width: calc(100vw - 20px);
  }

  .base-modal-large {
    max-width: calc(100vw - 20px);
    width: calc(100vw - 20px);
  }

  .base-modal-header {
    padding: 1rem;
  }

  .base-modal-title {
    font-size: 16px;
    padding-right: 32px;
  }

  .base-modal-subtitle {
    font-size: 13px;
    padding-right: 32px;
  }

  .base-modal-close {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    font-size: 20px;
  }

  .base-modal-content {
    padding: 1rem;
  }

  .base-modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
  }

  .base-modal-footer > * {
    width: 100%;
  }
}
</style>

