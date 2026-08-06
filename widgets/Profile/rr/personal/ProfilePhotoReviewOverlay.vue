<template>
  <Teleport to="body">
    <div
      class="profile-photo-review"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
    >
      <div class="profile-photo-review__stage" aria-hidden="true">
        <a
          v-if="isPdf && src"
          class="profile-photo-review__pdf"
          :href="src"
          target="_blank"
          rel="noopener"
        >
          <span class="profile-photo-review__pdf-badge">PDF</span>
          <span class="profile-photo-review__pdf-label">{{ pdfLabel }}</span>
        </a>
        <img
          v-else
          class="profile-photo-review__img"
          :src="src"
          :alt="alt"
        />
        <div class="profile-photo-review__dim" />
      </div>

      <button
        type="button"
        class="profile-photo-review__close"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 3l8 8M11 3L3 11"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <div class="profile-photo-review__footer">
        <p v-if="hint" class="profile-photo-review__hint">{{ hint }}</p>
        <div class="profile-photo-review__bar">
          <div class="profile-photo-review__actions">
            <AuthRRButton
              v-if="showSecondary"
              variant="brand-secondary"
              :label="secondaryLabel"
              :disabled="primaryLoading"
              @click="emit('secondary')"
            />
            <AuthRRButton
              :label="primaryLabel"
              :loading="primaryLoading"
              :class="{ 'profile-photo-review__primary--alone': !showSecondary }"
              @click="emit('primary')"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { AuthRRButton } from 'bibli/shared/ui/rr'
import 'bibli/shared/ui/rr/auth-rr-button.css'

defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: 'Просмотр фото' },
  ariaLabel: { type: String, default: 'Просмотр фото' },
  hint: { type: String, default: 'Проверьте изображение' },
  isPdf: { type: Boolean, default: false },
  pdfLabel: { type: String, default: 'Открыть PDF' },
  showSecondary: { type: Boolean, default: true },
  secondaryLabel: { type: String, default: 'Заменить' },
  primaryLabel: { type: String, default: 'Готово' },
  primaryLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'primary', 'secondary'])
</script>

<style scoped>
.profile-photo-review {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  background: #2c2c2e;
  color: #fff;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
}

.profile-photo-review__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1c1c1e;
}

.profile-photo-review__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #1c1c1e;
}

.profile-photo-review__pdf {
  position: absolute;
  inset: 48px 24px 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 16px;
  background: #fff;
  color: var(--rr-labels-brand-primary, #1c4ae5);
  text-decoration: none;
}

.profile-photo-review__pdf-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--rr-backgrounds-overlay-strong, rgba(28, 74, 229, 0.12));
  font-size: 14px;
  font-weight: 700;
}

.profile-photo-review__pdf-label {
  font-size: 16px;
  font-weight: 600;
}

.profile-photo-review__dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(28, 28, 30, 0.28);
}

.profile-photo-review__close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 16px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(60, 60, 67, 0.55);
  color: #fff;
  cursor: pointer;
}

.profile-photo-review__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.profile-photo-review__hint {
  margin: 0;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  border-radius: 12px;
  box-sizing: border-box;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  text-align: center;
  color: #fff;
}

.profile-photo-review__bar {
  width: 100%;
  padding:
    16px
    16px
    calc(16px + env(safe-area-inset-bottom, 0px));
  border-radius: 16px 16px 0 0;
  background: var(--rr-backgrounds-primary, #fff);
  box-sizing: border-box;
  pointer-events: auto;
}

.profile-photo-review__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.profile-photo-review__actions:has(.profile-photo-review__primary--alone) {
  grid-template-columns: 1fr;
}

.profile-photo-review__actions :deep(.auth-rr-button) {
  width: 100%;
}
</style>
