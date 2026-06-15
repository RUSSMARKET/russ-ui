<template>
  <AuthRRLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :policy-href="policyHref"
    :support-href="supportHref"
    :hero-variant="heroVariant"
    body-spacing="sm"
    subtitle-spacing="sm"
  >
    <div
      v-if="isLoading"
      class="auth-rr-callback-status"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="auth-rr-spinner" aria-hidden="true" />
    </div>

    <div v-else-if="errorText" class="auth-rr-callback-actions">
      <AuthRRButton
        variant="brand-primary"
        @click="emit('retry-login')"
      >
        {{ retryLoginText }}
      </AuthRRButton>
      <AuthRRButton
        v-if="canReloadCallback"
        variant="brand-secondary"
        @click="emit('reload')"
      >
        {{ reloadText }}
      </AuthRRButton>
      <button
        type="button"
        class="auth-rr-callback-link"
        @click="emit('back-to-auth')"
      >
        {{ backToAuthText }}
      </button>
    </div>
  </AuthRRLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { authRrLegalLinks, type AuthRrHeroVariant } from 'bibli/shared/assets/auth/rr';
import { AuthRRLayout } from '../rr';
import AuthRRButton from '../rr/AuthRRButton.vue';
import '../rr/auth-rr-spinner.css';

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    errorText?: string | null;
    canReloadCallback?: boolean;
    waitTitle?: string;
    waitDescription?: string;
    errorTitle?: string;
    retryLoginText?: string;
    reloadText?: string;
    backToAuthText?: string;
    policyHref?: string;
    supportHref?: string;
    heroVariant?: AuthRrHeroVariant;
  }>(),
  {
    busy: true,
    errorText: null,
    canReloadCallback: false,
    waitTitle: 'Сейчас войдём...',
    waitDescription: 'Проверяем вход и открываем сервис.',
    errorTitle: 'Не удалось войти',
    retryLoginText: 'Попробовать снова',
    reloadText: 'Обновить страницу',
    backToAuthText: 'Вернуться ко входу',
    policyHref: authRrLegalLinks.personalDataPolicy,
    supportHref: authRrLegalLinks.support,
    heroVariant: 'login',
  },
);

const emit = defineEmits<{
  'retry-login': [];
  reload: [];
  'back-to-auth': [];
}>();

const isLoading = computed(() => props.busy && !props.errorText);

const pageTitle = computed(() =>
  isLoading.value ? props.waitTitle : props.errorTitle,
);

const pageSubtitle = computed(() =>
  isLoading.value ? props.waitDescription : (props.errorText ?? ''),
);
</script>
