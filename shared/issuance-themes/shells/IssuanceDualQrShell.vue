<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="shellRef"
      class="issuance-shell__overlay"
      @click.self="close"
    >
      <div class="issuance-shell__panel issuance-shell--dual_qr">
        <button
          v-if="theme.layout.showCloseButton"
          type="button"
          class="issuance-shell__close-btn"
          aria-label="Закрыть"
          @click="close"
        >
          <i class="pi pi-times"></i>
        </button>

        <p v-if="theme.branding.headline" class="issuance-shell__headline">
          {{ theme.branding.headline }}
        </p>
        <p v-else-if="productName" class="issuance-shell__headline">
          {{ productName }}
        </p>

        <div class="issuance-shell__dual-actions">
          <button type="button" class="issuance-shell__dual-btn" @click="openQr('app')">
            <i class="pi pi-qrcode"></i>
            <span>{{ appLabel }}</span>
            <small>{{ appSubLabel }}</small>
          </button>
          <button type="button" class="issuance-shell__dual-btn" @click="openQr('sub')">
            <i class="pi pi-qrcode"></i>
            <span>{{ subLabel }}</span>
            <small>{{ subSubLabel }}</small>
          </button>
        </div>

        <div class="issuance-shell__dual-form">
          <label class="issuance-shell__field-label" for="issuance-dual-id-card">
            ID КАРТЫ КЛИЕНТА
          </label>
          <input
            id="issuance-dual-id-card"
            v-model="idCard"
            type="text"
            class="issuance-shell__input"
            :class="{ 'issuance-shell__input--error': idCard && !isValidMask }"
            placeholder="ID"
          />
          <small v-if="idCard && !isValidMask" class="issuance-shell__field-error">
            Формат: E + 16 символов + T + 6 символов
          </small>

          <div class="issuance-shell__checks">
            <label class="issuance-shell__check-row">
              <input v-model="isSub" type="checkbox" />
              <span>Подписка оформлена</span>
            </label>
            <label class="issuance-shell__check-row">
              <input v-model="isApp" type="checkbox" />
              <span>Приложение установлено</span>
            </label>
          </div>

          <div class="issuance-shell__dual-form-actions">
            <button type="button" class="issuance-shell__btn issuance-shell__btn--ghost" @click="close">
              Отменить
            </button>
            <button type="button" class="issuance-shell__btn issuance-shell__btn--primary" @click="handleSubmit">
              Записать
            </button>
          </div>
        </div>
      </div>
    </div>

    <IssuanceQrShell
      v-model:visible="qrVisible"
      :theme="qrTheme"
      :qr-url="activeQrUrl"
      :product-name="activeQrTitle"
      :canvas-size="canvasSize"
      @close="onQrClose"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { applyTheme, clearTheme } from '../applyTheme';
import { mergeTheme, resolveShellTheme } from '../mergeTheme';
import type { IssuanceThemeTokens, ThemeOverrides, ThemePreset } from '../types';
import IssuanceQrShell from './IssuanceQrShell.vue';
import '../issuance-shell.css';

type DualSlot = 'app' | 'sub';

export type DualQrSubmitPayload = {
  id_card: string;
  is_app: boolean;
  is_sub: boolean;
};

interface Props {
  visible: boolean;
  qrAppUrl: string;
  qrSubUrl: string;
  theme?: IssuanceThemeTokens;
  preset?: ThemePreset;
  overrides?: ThemeOverrides | null;
  productName?: string;
  qrAppCode?: string;
  qrSubCode?: string;
  closeQrSignal?: number;
  qrRefreshSignal?: number;
  appLabel?: string;
  subLabel?: string;
  appSubLabel?: string;
  subSubLabel?: string;
  canvasSize?: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'qr-open', slot: DualSlot): void;
  (e: 'qr-switch', code: string): void;
  (e: 'submit', payload: DualQrSubmitPayload): void;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  preset: 'magnit',
  qrAppCode: '',
  qrSubCode: '',
  closeQrSignal: 0,
  qrRefreshSignal: 0,
  appLabel: 'Приложение',
  subLabel: 'Подписка',
  appSubLabel: 'Открыть QR-код',
  subSubLabel: 'Открыть QR-код',
  canvasSize: 200,
});

const emit = defineEmits<Emits>();

const shellRef = ref<HTMLElement | null>(null);
const qrVisible = ref(false);
const activeSlot = ref<DualSlot>('app');
const idCard = ref('');
const isSub = ref(false);
const isApp = ref(false);

const isValidMask = computed(() =>
  /^E[a-zA-Z0-9]{16}T[a-zA-Z0-9]{6}$/.test(idCard.value.trim()),
);

const theme = computed(() =>
  resolveShellTheme(props.theme, props.preset, props.overrides, { variant: 'dual_qr' }),
);

const qrTheme = computed(() => ({
  ...theme.value,
  variant: 'qr' as const,
  layout: {
    ...theme.value.layout,
    fullscreen: false,
  },
}));

const activeQrUrl = computed(() =>
  activeSlot.value === 'app' ? props.qrAppUrl : props.qrSubUrl,
);

const activeQrTitle = computed(() =>
  activeSlot.value === 'app' ? props.appLabel : props.subLabel,
);

function applyShellTheme() {
  if (shellRef.value) {
    applyTheme(shellRef.value, theme.value);
  }
}

function openQr(slot: DualSlot) {
  activeSlot.value = slot;
  qrVisible.value = true;
  emit('qr-open', slot);
  const code = slot === 'app' ? props.qrAppCode : props.qrSubCode;
  if (code) {
    emit('qr-switch', code);
  }
}

function handleSubmit() {
  if (!idCard.value.trim() || !isValidMask.value || (!isSub.value && !isApp.value)) {
    return;
  }

  emit('submit', {
    id_card: idCard.value.trim(),
    is_app: isApp.value,
    is_sub: isSub.value,
  });
}

function close() {
  emit('update:visible', false);
  emit('close');
}

function onQrClose() {
  qrVisible.value = false;
}

function resetForm() {
  idCard.value = '';
  isSub.value = false;
  isApp.value = false;
  qrVisible.value = false;
  activeSlot.value = 'app';
}

watch(
  () => props.qrRefreshSignal,
  () => {
    if (!qrVisible.value || !activeSlot.value) {
      return;
    }
    qrVisible.value = false;
    void nextTick(() => {
      qrVisible.value = true;
    });
  },
);

watch(
  () => props.closeQrSignal,
  () => {
    qrVisible.value = false;
    activeSlot.value = 'app';
  },
);

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen) {
      resetForm();
      document.body.style.overflow = 'hidden';
      await nextTick();
      applyShellTheme();
      return;
    }

    document.body.style.overflow = '';
    resetForm();
    if (shellRef.value) {
      clearTheme(shellRef.value);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
  if (shellRef.value) {
    clearTheme(shellRef.value);
  }
});
</script>
