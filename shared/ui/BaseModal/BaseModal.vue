<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="base-modal-overlay"
      :style="{ zIndex: overlayZIndex }"
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
              v-if="hasFooter && isMobile"
              type="button"
              class="base-modal-mobile-menu-btn"
              :class="{ 'base-modal-mobile-menu-btn--active': mobileFooterOpen }"
              :aria-label="mobileMenuAriaLabel"
              :aria-expanded="mobileFooterOpen"
              @click.stop="toggleMobileFooter"
            >
              <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
            </button>
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

        <div
          v-if="isMobile && mobileFooterOpen && hasFooter"
          class="base-modal-footer-backdrop"
          @click="mobileFooterOpen = false"
        />

        <!-- Footer -->
        <div
          v-if="hasFooter"
          class="base-modal-footer"
          :class="{ 'base-modal-footer--mobile-open': isMobile && mobileFooterOpen }"
          @click="onFooterClick"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, normalizeClass, useSlots } from 'vue';

const MOBILE_BREAKPOINT = 768;

interface Props {
  modelValue: boolean;
  /** Поверх остальных слоёв (по умолчанию 10000). */
  overlayZIndex?: number;
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
  mobileMenuAriaLabel?: string;
  class?: string;
  size?: 'sm' | 'md' | 'lg';
  heightMode?: 'content' | 'max';
}

const props = withDefaults(defineProps<Props>(), {
  overlayZIndex: 10000,
  closable: true,
  closeOnEscape: true,
  closeOnOverlayClick: true,
  modal: true,
  position: 'center',
  closeAriaLabel: 'Закрыть',
  mobileMenuAriaLabel: 'Действия',
  class: '',
  size: 'md',
  heightMode: 'content',
});

const slots = useSlots();
const hasFooter = computed(() => Boolean(slots.footer));
const isMobile = ref(false);
const mobileFooterOpen = ref(false);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'hide': [];
  'show': [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const mouseDownTarget = ref<'overlay' | 'modal' | null>(null);
const mouseUpTarget = ref<'overlay' | 'modal' | null>(null);

const modalClass = computed(() =>
  normalizeClass([
    props.class,
    props.size ? `base-modal-size-${props.size}` : '',
    props.heightMode === 'max' ? 'base-modal-height-max' : 'base-modal-height-content',
    {
      'base-modal-wide': props.maxWidth === '900px' || props.width === '900px',
      'base-modal-large': props.maxWidth === '1000px' || props.width === '1000px',
    },
  ])
);

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
  mobileFooterOpen.value = false;
  emit('update:modelValue', false);
  emit('hide');
};

const updateIsMobile = () => {
  if (typeof window === 'undefined') return;
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT;
};

const toggleMobileFooter = () => {
  mobileFooterOpen.value = !mobileFooterOpen.value;
};

const onFooterClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('button:not(:disabled)')) {
    mobileFooterOpen.value = false;
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape || !props.modelValue) {
    return;
  }

  if (isMobile.value && mobileFooterOpen.value) {
    mobileFooterOpen.value = false;
    return;
  }

  handleClose();
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
      mobileFooterOpen.value = false;
      // Разблокируем скролл body
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileFooterOpen.value = false;
  }
});

// Обработка клавиатуры
onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  if (props.closeOnEscape) {
    document.addEventListener('keydown', handleEscape);
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('resize', updateIsMobile);
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
  isolation: isolate;
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
  max-height: calc(min(100vh, 100dvh) - 40px);
  box-shadow: 0 4px 12px var(--russ-shadow-color);
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  animation: slideIn 0.2s ease;
  margin: auto;
  box-sizing: border-box;
  border: 1px solid var(--russ-border);
  overflow: hidden;
  outline: none;
}

.base-modal-height-max {
  height: calc(min(100vh, 100dvh) - 40px);
}

.base-modal-height-content {
  height: auto;
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
  border-bottom: 1px solid var(--russ-border);
  flex-shrink: 0;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
  z-index: 21;
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
  color: var(--russ-bg-dark);
  font-weight: 600;
  font-size: 18px;
  padding-right: 40px;
}

.base-modal-subtitle {
  margin: 0;
  color: var(--russ-text-tertiary);
  font-size: 14px;
  line-height: 1.4;
  padding-right: 40px;
}

.base-modal-close {
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
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
  color: var(--russ-text-secondary);
  background: var(--russ-bg-hover);
}

.base-modal-close:focus {
  outline: 1px solid var(--russ-text-quaternary);
  outline-offset: 2px;
}

.base-modal-mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

.base-modal-mobile-menu-btn:hover {
  color: var(--russ-text-secondary);
  background: var(--russ-bg-hover);
}

.base-modal-mobile-menu-btn--active,
.base-modal-mobile-menu-btn--active:hover {
  color: var(--russ-accent-dark);
  background: var(--russ-bg-hover);
}

.base-modal-mobile-menu-btn:focus {
  outline: 1px solid var(--russ-text-quaternary);
  outline-offset: 2px;
}

.base-modal-footer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: transparent;
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
  background: var(--russ-bg-tertiary);
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb {
  background: var(--russ-text-light);
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--russ-neutral-light);
}

.base-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--russ-border);
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
    max-height: calc(min(100vh, 100dvh) - 20px);
    border-radius: 8px;
  }

  .base-modal-height-max {
    height: calc(min(100vh, 100dvh) - 20px);
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

  .base-modal-mobile-menu-btn {
    display: flex;
  }

  .base-modal-footer {
    display: none;
    position: absolute;
    top: 52px;
    right: 12px;
    left: auto;
    width: min(320px, calc(100% - 24px));
    max-height: min(60vh, calc(100dvh - 120px));
    overflow-y: auto;
    padding: 8px;
    border: 1px solid var(--russ-border);
    border-radius: 8px;
    border-top: 1px solid var(--russ-border);
    background: var(--russ-bg);
    box-shadow: 0 4px 20px var(--russ-shadow-color);
    flex-direction: column;
    align-items: stretch;
    z-index: 21;
  }

  .base-modal-footer.base-modal-footer--mobile-open {
    display: flex;
  }

  .base-modal-footer.base-modal-footer--mobile-open > * {
    width: 100%;
  }

  .base-modal-footer.base-modal-footer--mobile-open :deep(.form-actions),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.modal-footer-actions),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.reporting-modal-footer) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    padding: 4px;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .base-modal-footer.base-modal-footer--mobile-open :deep(.btn-block),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.modal-actions-group),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.modal-actions-group--process),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.modal-actions-cluster),
  .base-modal-footer.base-modal-footer--mobile-open :deep(.modal-actions-buttons) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
  }

  .base-modal-footer.base-modal-footer--mobile-open :deep(button) {
    width: 100%;
    min-width: 0;
    max-width: none;
    white-space: normal;
    text-align: center;
  }
}
</style>

