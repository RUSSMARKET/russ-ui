<template>
  <button
    type="button"
    class="profile-doc-thumb"
    :class="{
      'profile-doc-thumb--empty': !src,
      'profile-doc-thumb--fill': fill,
      'profile-doc-thumb--pdf': showAsPdf && !!src,
    }"
    :disabled="!src"
    :aria-label="ariaLabel"
    @click.stop="onClick"
  >
    <template v-if="src">
      <img
        v-if="!showAsPdf"
        class="profile-doc-thumb__img"
        :src="src"
        :alt="alt"
        @error="onImgError"
      />
      <span v-else class="profile-doc-thumb__pdf" aria-hidden="true">
        <span class="profile-doc-thumb__pdf-badge">PDF</span>
        <span class="profile-doc-thumb__pdf-label">{{ pdfLabel }}</span>
      </span>
    </template>
    <span v-else class="profile-doc-thumb__empty">{{ emptyText }}</span>
    <span class="profile-doc-thumb__eye" aria-hidden="true">
      <img :src="eyeGlyph" alt="" width="18" height="18" />
    </span>
  </button>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import eyeGlyph from '../assets/activation/passport-tips/preview-eye-glyph.svg'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  emptyText: { type: String, default: 'Нет фото' },
  /** Явно PDF (иначе пробуем img, при ошибке — PDF-плитка). */
  isPdf: { type: Boolean, default: false },
  pdfLabel: { type: String, default: 'Документ' },
  /** Растянуть на всю ширину родителя (сетки документов). */
  fill: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const imgFailed = ref(false)

watch(
  () => [props.src, props.isPdf],
  () => {
    imgFailed.value = false
  },
)

const showAsPdf = computed(() => Boolean(props.src) && (props.isPdf || imgFailed.value))

const ariaLabel = computed(() => {
  if (!props.src) return props.emptyText
  if (showAsPdf.value) return props.alt || 'Открыть PDF'
  return props.alt || 'Открыть фото'
})

function onImgError() {
  imgFailed.value = true
}

function onClick(event) {
  if (!props.src) return
  emit('click', event)
}
</script>

<style scoped>
.profile-doc-thumb {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 120px;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-l, 12px);
  overflow: hidden;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  cursor: pointer;
  font: inherit;
  color: inherit;
  flex: 0 0 auto;
  align-self: flex-start;
}

.profile-doc-thumb--fill {
  width: 100%;
  align-self: stretch;
}

.profile-doc-thumb:disabled,
.profile-doc-thumb--empty {
  cursor: default;
}

.profile-doc-thumb__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.profile-doc-thumb__pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: linear-gradient(160deg, #eef1f8 0%, #e2e6f0 100%);
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-doc-thumb__pdf-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--rr-labels-brand-primary, #3d5afe);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.profile-doc-thumb__pdf-label {
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: 1.3;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, #6b6d76);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-doc-thumb__empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-neutral-tertiary, #8b8d98);
  text-align: center;
  padding: 8px;
}

.profile-doc-thumb__eye {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border-radius: 8px;
  background: rgba(16, 16, 18, 0.72);
  pointer-events: none;
}

.profile-doc-thumb__eye img {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
</style>
