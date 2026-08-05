<template>
  <Teleport to="body">
    <div
      v-if="rendered"
      class="profile-bottom-sheet"
      :class="{
        'profile-bottom-sheet--open': visible,
        'profile-bottom-sheet--fit': heightMode === 'fit',
      }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="resolvedTitleId || undefined"
      :style="{ zIndex }"
    >
      <div
        class="profile-bottom-sheet__scrim"
        aria-hidden="true"
        :style="{ opacity: backdropOpacity }"
      />
      <button
        type="button"
        class="profile-bottom-sheet__backdrop"
        aria-label="Закрыть"
        :disabled="!closeOnBackdrop || closingLocked"
        @click="onBackdropClick"
      />

      <div
        ref="panelRef"
        class="profile-bottom-sheet__panel"
        :class="{ 'profile-bottom-sheet__panel--fit': heightMode === 'fit' }"
        :style="panelStyle"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <div
          v-if="showHandle"
          class="profile-bottom-sheet__handle"
          aria-hidden="true"
          @pointerdown="onHandlePointerDown"
        >
          <span class="profile-bottom-sheet__grabber" />
        </div>

        <div class="profile-bottom-sheet__body">
          <header v-if="title || subtitle || $slots.header" class="profile-bottom-sheet__header">
            <slot name="header">
              <h2
                v-if="title"
                :id="resolvedTitleId"
                class="profile-bottom-sheet__title"
              >
                {{ title }}
              </h2>
              <p v-if="subtitle" class="profile-bottom-sheet__subtitle">{{ subtitle }}</p>
            </slot>
          </header>

          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="profile-bottom-sheet__footer"
          :class="`profile-bottom-sheet__footer--${footerLayout}`"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /**
   * percent — фиксированная высота heightPercent экрана
   * fit — по контенту, не выше heightPercent
   */
  heightMode: {
    type: String,
    default: 'percent',
    validator: (v) => v === 'percent' || v === 'fit',
  },
  /** Доля экрана (20–100). Для fit — max-height. */
  heightPercent: {
    type: Number,
    default: 72,
    validator: (v) => Number.isFinite(v) && v >= 20 && v <= 100,
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  titleId: { type: String, default: '' },
  showHandle: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true },
  /** Блокирует закрытие (свайп / backdrop), пока true — напр. во время запроса. */
  closingLocked: { type: Boolean, default: false },
  swipeToDismiss: { type: Boolean, default: true },
  /** stack | row — раскладка слота footer */
  footerLayout: {
    type: String,
    default: 'stack',
    validator: (v) => v === 'stack' || v === 'row',
  },
  dismissRatio: { type: Number, default: 0.22 },
  dismissPx: { type: Number, default: 96 },
  zIndex: { type: [Number, String], default: 1300 },
})

const emit = defineEmits(['update:modelValue', 'close'])

const autoTitleId = useId()
const resolvedTitleId = computed(() => props.titleId || (props.title ? autoTitleId : ''))

const rendered = ref(false)
const visible = ref(false)
const panelRef = ref(null)
const dragY = ref(0)
const dragging = ref(false)

let startY = 0
let startDragY = 0
let closeTimer = null

const pct = computed(() => clamp(props.heightPercent, 20, 100))

const panelStyle = computed(() => {
  const y = dragY.value
  const transitioning = !dragging.value
  const base = {
    transform: `translate3d(0, ${y}px, 0)`,
    transition: transitioning
      ? 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)'
      : 'none',
  }
  if (props.heightMode === 'fit') {
    return {
      ...base,
      height: 'auto',
      maxHeight: `min(${pct.value}dvh, ${pct.value}vh)`,
    }
  }
  return {
    ...base,
    height: `${pct.value}dvh`,
    maxHeight: `min(${pct.value}dvh, ${pct.value}vh)`,
  }
})

const backdropOpacity = computed(() => {
  if (!visible.value && dragY.value === 0) return 0
  const fallbackH = window.innerHeight * (pct.value / 100)
  const panelH = panelRef.value?.offsetHeight || fallbackH
  const progress = 1 - Math.min(1, Math.max(0, dragY.value / Math.max(panelH, 1)))
  return progress * (visible.value ? 1 : 0.5)
})

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function panelOffsetHeight() {
  return panelRef.value?.offsetHeight || window.innerHeight * (pct.value / 100)
}

async function openSheet() {
  clearCloseTimer()
  rendered.value = true
  dragY.value = 0
  dragging.value = false
  lockBodyScroll()
  await nextTick()
  dragY.value = panelOffsetHeight()
  await nextTick()
  requestAnimationFrame(() => {
    visible.value = true
    dragY.value = 0
  })
}

function finishClose({ force = false } = {}) {
  if (props.closingLocked && !force) return
  clearCloseTimer()
  visible.value = false
  dragY.value = panelOffsetHeight()
  closeTimer = setTimeout(() => {
    rendered.value = false
    dragY.value = 0
    dragging.value = false
    unlockBodyScroll()
    emit('update:modelValue', false)
    emit('close')
  }, 280)
}

function requestClose() {
  if (!rendered.value || props.closingLocked) return
  finishClose()
}

function onBackdropClick() {
  if (!props.closeOnBackdrop || props.closingLocked) return
  requestClose()
}

function shouldDismiss(deltaY) {
  const panelH = panelOffsetHeight() || 1
  return deltaY >= props.dismissPx || deltaY / panelH >= props.dismissRatio
}

function onTouchStart(event) {
  if (!props.swipeToDismiss || props.closingLocked || !event.touches?.[0]) return
  const body = panelRef.value?.querySelector('.profile-bottom-sheet__body')
  if (body && body.scrollTop > 0 && !event.target.closest('.profile-bottom-sheet__handle')) {
    dragging.value = false
    return
  }
  startY = event.touches[0].clientY
  startDragY = dragY.value
  dragging.value = true
}

function onTouchMove(event) {
  if (!dragging.value || !event.touches?.[0]) return
  const dy = event.touches[0].clientY - startY
  if (dy < 0) {
    dragY.value = 0
    return
  }
  dragY.value = startDragY + dy
  if (dy > 8) event.preventDefault()
}

function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (shouldDismiss(dragY.value)) {
    requestClose()
    return
  }
  dragY.value = 0
}

function onHandlePointerDown(event) {
  if (!props.swipeToDismiss || props.closingLocked) return
  if (event.button != null && event.button !== 0) return
  startY = event.clientY
  startDragY = dragY.value
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)

  const onMove = (e) => {
    if (!dragging.value) return
    const dy = e.clientY - startY
    dragY.value = dy < 0 ? 0 : startDragY + dy
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    dragging.value = false
    if (shouldDismiss(dragY.value)) {
      requestClose()
      return
    }
    dragY.value = 0
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void openSheet()
    else if (rendered.value) finishClose({ force: true })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearCloseTimer()
  unlockBodyScroll()
})

defineExpose({ close: requestClose })
</script>

<style scoped>
.profile-bottom-sheet,
.profile-bottom-sheet *,
.profile-bottom-sheet *::before,
.profile-bottom-sheet *::after {
  box-sizing: border-box;
}

.profile-bottom-sheet {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  pointer-events: auto;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
}

.profile-bottom-sheet__scrim {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--rr-fills-neutral-static-dark-primary);
  -webkit-backdrop-filter: blur(var(--rr-fx-blur-m, 8px));
  backdrop-filter: blur(var(--rr-fx-blur-m, 8px));
  transition: opacity 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

.profile-bottom-sheet__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  border: none;
  border-radius: var(--rr-radius-none, 0);
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.profile-bottom-sheet__backdrop:disabled {
  cursor: default;
}

.profile-bottom-sheet__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: var(--rr-radius-3-xl) var(--rr-radius-3-xl) 0 0;
  background: var(--rr-backgrounds-primary);
  box-shadow: 0 calc(var(--rr-spacing-padding-m) * -1) 32px var(--rr-fx-shadow-major);
  will-change: transform;
  touch-action: pan-y;
  padding-bottom: 0;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__panel--fit {
  flex: 0 1 auto;
}

.profile-bottom-sheet__handle {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px var(--rr-spacing-padding-xl) var(--rr-spacing-padding-3-xl);
  cursor: grab;
  touch-action: none;
}

.profile-bottom-sheet__handle:active {
  cursor: grabbing;
}

.profile-bottom-sheet__grabber {
  width: 36px;
  height: 4px;
  border-radius: var(--rr-radius-full);
  background: var(--rr-labels-neutral-tertiary, #3C3C4385);
}

.profile-bottom-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 0 var(--rr-spacing-padding-xl) 0;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
  touch-action: pan-y;
}

.profile-bottom-sheet__panel--fit .profile-bottom-sheet__body {
  flex: 0 1 auto;
  overflow: visible;
}

.profile-bottom-sheet__panel:not(:has(.profile-bottom-sheet__footer)) .profile-bottom-sheet__body {
  padding-bottom: calc(var(--rr-spacing-padding-3-xl) + env(safe-area-inset-bottom, 0px) + var(--profile-sheet-browser-bar, var(--rr-spacing-padding-l)));
}

.profile-bottom-sheet__header {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
}

.profile-bottom-sheet__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xl);
  line-height: var(--rr-line-height-line-height-xl);
  letter-spacing: var(--rr-tracking-tracking-xl);
  text-align: left;
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__subtitle {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  vertical-align: middle;
  text-align: left;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-bottom-sheet__body :deep(p) {
  margin: 0;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-bottom-sheet__footer {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  gap: var(--rr-spacing-padding-m);
  padding: 0 var(--rr-spacing-padding-xl);
  padding-bottom: calc(var(--rr-spacing-padding-l) + env(safe-area-inset-bottom, 0px) + var(--profile-sheet-browser-bar, var(--rr-spacing-padding-l)));
  background: var(--rr-backgrounds-primary);
  box-shadow: 0 calc(var(--rr-spacing-padding-m) * -1) var(--rr-spacing-padding-xl) calc(var(--rr-spacing-padding-l) * -1) var(--rr-fx-shadow-major);
  margin-top: 24px;
}

.profile-bottom-sheet__panel--fit .profile-bottom-sheet__footer {
  box-shadow: none;
}

.profile-bottom-sheet__footer--stack {
  flex-direction: column;
}

.profile-bottom-sheet__footer--row {
  flex-direction: row;
  align-items: stretch;
}

.profile-bottom-sheet__footer--row > :deep(*) {
  flex: 1 1 0;
  min-width: 0;
}

@media (min-width: 640px) {
  .profile-bottom-sheet {
    align-items: center;
    padding: var(--rr-spacing-padding-3-xl);
  }

  .profile-bottom-sheet__panel {
    border-radius: var(--rr-radius-3-xl);
    max-height: min(90dvh, 90vh) !important;
  }
}
</style>
