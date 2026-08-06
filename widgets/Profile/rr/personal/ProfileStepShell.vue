<template>
  <div
    ref="rootEl"
    class="profile-step-shell"
    :class="{ 'profile-step-shell--keyboard': keyboardOpen }"
  >
    <header class="profile-step-shell__header">
      <button
        type="button"
        class="profile-step-shell__back"
        aria-label="Назад"
        @click="$emit('back')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14.5 6.5L9 12l5.5 5.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <p v-if="!hideProgress" class="profile-step-shell__step" aria-live="polite">
        {{ stepLabel }}
      </p>
    </header>

    <AuthRRStepProgress v-if="!hideProgress" :current="current" :total="total" />

    <div class="profile-step-shell__body">
      <div v-if="title || subtitle" class="profile-step-shell__intro">
        <h1 v-if="title" class="profile-step-shell__title">{{ title }}</h1>
        <p v-if="subtitle" class="profile-step-shell__subtitle">{{ subtitle }}</p>
      </div>
      <slot />
    </div>

    <div class="profile-step-shell__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AuthRRStepProgress } from 'bibli/shared/ui/rr'

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, default: 5 },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  stepText: { type: String, default: '' },
  /** Режим просмотра: без счётчика шага и полоски прогресса */
  hideProgress: { type: Boolean, default: false },
})

defineEmits(['back'])

const rootEl = ref(null)
const keyboardOpen = ref(false)
let focusTimer = 0

const stepLabel = computed(() => {
  if (props.stepText) return props.stepText
  return `Шаг ${props.current} из ${props.total}`
})

function getBodyEl() {
  return rootEl.value?.querySelector('.profile-step-shell__body') ?? null
}

function isKeyboardUp() {
  return document.documentElement.classList.contains('rr-keyboard-open')
}

function syncKeyboardOpen() {
  if (typeof document === 'undefined') return
  const focused = Boolean(
    rootEl.value?.contains(document.activeElement) &&
      document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]'),
  )
  keyboardOpen.value = focused && isKeyboardUp()
}

/**
 * Один раз сдвигает body так, чтобы поле было над клавиатурой,
 * затем скролл блокируется CSS (overflow: hidden).
 */
function revealFocusedInput(target) {
  const body = getBodyEl()
  if (!(body instanceof HTMLElement) || !(target instanceof HTMLElement)) return

  const field = target.closest('.auth-rr-field, .profile-rr-checkbox') || target
  const vv = window.visualViewport
  const visibleTop = (vv?.offsetTop ?? 0) + 12
  const visibleBottom = (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight) - 12

  // На миг разрешаем скролл только для позиционирования
  body.style.overflowY = 'auto'
  const rect = field.getBoundingClientRect()
  if (rect.bottom > visibleBottom) {
    body.scrollTop += rect.bottom - visibleBottom
  } else if (rect.top < visibleTop) {
    body.scrollTop -= visibleTop - rect.top
  }
  body.style.overflowY = ''
}

function onFocusIn(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (!target.matches('input, textarea, select, [contenteditable="true"]')) return
  if (!rootEl.value?.contains(target)) return

  if (focusTimer) window.clearTimeout(focusTimer)

  const apply = () => {
    revealFocusedInput(target)
    syncKeyboardOpen()
  }

  // Клавиатура уже открыта (переход между полями) — сразу; иначе ждём анимацию
  if (isKeyboardUp()) {
    requestAnimationFrame(apply)
  } else {
    focusTimer = window.setTimeout(apply, 350)
  }
}

function onFocusOut() {
  window.setTimeout(syncKeyboardOpen, 50)
}

function onViewportResize() {
  // Только класс; без повторного скролла — иначе всё прыгает
  syncKeyboardOpen()
}

onMounted(() => {
  syncKeyboardOpen()
  window.visualViewport?.addEventListener('resize', onViewportResize)
  window.addEventListener('resize', onViewportResize)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
})

onBeforeUnmount(() => {
  if (focusTimer) window.clearTimeout(focusTimer)
  window.visualViewport?.removeEventListener('resize', onViewportResize)
  window.removeEventListener('resize', onViewportResize)
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
})
</script>

<style scoped>
.profile-step-shell,
.profile-step-shell *,
.profile-step-shell *::before,
.profile-step-shell *::after {
  box-sizing: border-box;
}

.profile-step-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
  background: var(--rr-backgrounds-secondary);
  color: var(--rr-labels-neutral-primary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  padding:
    var(--rr-spacing-padding-m)
    var(--rr-spacing-padding-xl)
    calc(var(--rr-spacing-padding-xl) + env(safe-area-inset-bottom, 0px));
}

.profile-step-shell--keyboard {
  padding-bottom: 0;
}

.profile-step-shell--keyboard .profile-step-shell__footer {
  display: none;
}

/* Клавиатура открыта: скролл запрещён, поле уже выведено в зону видимости */
.profile-step-shell--keyboard .profile-step-shell__body {
  overflow-y: hidden;
  overscroll-behavior: none;
  touch-action: manipulation;
}

.profile-step-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--rr-size-3-xl);
  margin-bottom: var(--rr-spacing-padding-xl);
  flex: 0 0 auto;
}

.profile-step-shell__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rr-size-3-xl);
  height: var(--rr-size-3-xl);
  margin: 0 0 0 var(--rr-spacing-margin-neg-l);
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-m);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.profile-step-shell__step {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  font-weight: 500;
  color: var(--rr-labels-neutral-secondary);
}

.profile-step-shell :deep(.auth-rr-step-progress) {
  flex: 0 0 auto;
  gap: var(--rr-spacing-padding-m);
}

@media (max-width: 1023px) {
  .profile-step-shell :deep(.auth-rr-step-progress) {
    margin-bottom: var(--rr-spacing-padding-3-xl);
  }
}

.profile-step-shell :deep(.auth-rr-step-progress__segment--active) {
  background: var(--rr-labels-brand-primary);
}

.profile-step-shell__body {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  display: block;
  padding:
    var(--rr-spacing-padding-none)
    var(--rr-spacing-padding-xs)
    var(--rr-spacing-padding-l);
  scrollbar-width: none;
}

.profile-step-shell__body::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.profile-step-shell__intro {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
  margin-bottom: var(--rr-spacing-padding-3-xl);
}

.profile-step-shell__title {
  margin: 0;
  font-size: var(--rr-font-size-font-size-2xl);
  line-height: var(--rr-line-height-line-height-2xl);
  letter-spacing: var(--rr-tracking-tracking-2xl);
  font-weight: 600;
}

.profile-step-shell__subtitle {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  color: var(--rr-labels-neutral-secondary);
}

.profile-step-shell__footer {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  padding-top: var(--rr-spacing-padding-l);
  background: var(--rr-backgrounds-secondary);
}

.profile-step-shell :deep(.auth-rr-input__control) {
  box-sizing: border-box;
  height: var(--rr-size-4-xl);
  min-height: var(--rr-size-4-xl);
  max-height: var(--rr-size-4-xl);
  padding: 0 var(--rr-spacing-padding-xl);
  border: none;
  border-radius: var(--rr-radius-m);
  background-color: var(--rr-input-background-default);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  text-align: left;
  color: var(--rr-input-text-fill);
}

.profile-step-shell :deep(.auth-rr-input__control::placeholder) {
  text-align: left;
  color: var(--rr-input-text-default);
}

.profile-step-shell :deep(.auth-rr-input__control:hover:not(:disabled):not([readonly]):not(.auth-rr-input__control--error):not(:focus):not(:focus-visible)) {
  border: none;
  background-color: var(--rr-input-background-hover);
}

.profile-step-shell :deep(.auth-rr-input__control:focus),
.profile-step-shell :deep(.auth-rr-input__control:focus-visible) {
  outline: none;
  border: none;
  background-color: var(--rr-input-background-default);
}

.profile-step-shell :deep(.auth-rr-input__control:disabled),
.profile-step-shell :deep(.auth-rr-input__control[readonly]) {
  border: none;
  background-color: var(--rr-input-background-default);
  color: var(--rr-input-text-fill);
  opacity: 0.6;
}

.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill),
.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill:hover),
.profile-step-shell :deep(.auth-rr-input__control:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--rr-input-text-fill);
  caret-color: var(--rr-input-text-fill);
  border: none;
  box-shadow: 0 0 0 1000px var(--rr-input-background-default) inset;
}

.profile-step-shell :deep(.auth-rr-input-phone) {
  --auth-rr-phone-h: var(--rr-size-4-xl);
  height: var(--rr-size-4-xl);
  min-height: var(--rr-size-4-xl);
  max-height: var(--rr-size-4-xl);
  gap: var(--rr-spacing-padding-m);
  border: none;
  border-radius: var(--rr-radius-m);
  background-color: var(--rr-input-background-default);
}

.profile-step-shell :deep(.auth-rr-input-phone:hover:not(.auth-rr-input-phone--error):not(:focus-within)) {
  border: none;
  background-color: var(--rr-input-background-hover);
}

.profile-step-shell :deep(.auth-rr-input-phone:focus-within:not(.auth-rr-input-phone--error)) {
  border: none;
  background-color: var(--rr-input-background-default);
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input:disabled)) {
  border: none;
  background-color: var(--rr-input-background-default);
  opacity: 0.6;
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly])) {
  cursor: pointer;
}

.profile-step-shell :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly]) .auth-rr-input-phone__input) {
  cursor: pointer;
}

.profile-step-shell :deep(.auth-rr-input-phone__flag) {
  margin-left: var(--rr-spacing-padding-m);
}

.profile-step-shell :deep(.auth-rr-input-phone__prefix),
.profile-step-shell :deep(.auth-rr-input-phone__mirror),
.profile-step-shell :deep(.auth-rr-input-phone__input) {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
}

.profile-step-shell :deep(.auth-rr-field__label) {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-s);
  font-weight: 400;
  font-style: normal;
  line-height: 140%;
  letter-spacing: 0;
  vertical-align: middle;
  color: #000000;
  margin-bottom: var(--rr-spacing-margin-m);
}
</style>
