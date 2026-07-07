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
import { mergeTheme } from '../mergeTheme';
import type { IssuanceThemeTokens, ThemeOverrides, ThemePreset } from '../types';
import IssuanceQrShell from './IssuanceQrShell.vue';
import '../issuance-shell.css';

type DualSlot = 'app' | 'sub';

interface Props {
  visible: boolean;
  qrAppUrl: string;
  qrSubUrl: string;
  theme?: IssuanceThemeTokens;
  preset?: ThemePreset;
  overrides?: ThemeOverrides | null;
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
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'magnit',
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

const theme = computed(() =>
  props.theme ?? mergeTheme(props.preset, props.overrides, { variant: 'dual_qr' }),
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
}

function close() {
  emit('update:visible', false);
  emit('close');
}

function onQrClose() {
  qrVisible.value = false;
}

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      await nextTick();
      applyShellTheme();
      return;
    }

    document.body.style.overflow = '';
    qrVisible.value = false;
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
