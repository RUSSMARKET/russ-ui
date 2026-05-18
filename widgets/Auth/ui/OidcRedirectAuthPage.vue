<template>
  <div class="auth-page">
    <a :href="homeHref" class="auth-header">
      <img class="logo" :src="logo" :alt="logoAlt" />
    </a>

    <div class="auth-form-container">
      <div class="auth-card">
        <div class="auth-card-head">
          <span class="auth-badge" aria-hidden="true">
            <i class="pi pi-shield" />
          </span>
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="auth-subtitle">{{ subtitle }}</p>
        </div>

        <button
          type="button"
          class="login_btn login_btn-primary"
          :disabled="loading"
          @click="emit('login')"
        >
          <span v-if="loading" class="button-loading">
            <i class="pi pi-spin pi-spinner" aria-hidden="true" />
            {{ loadingLabel }}
          </span>
          <span v-else class="login_btn-inner">
            <span>{{ loginButtonLabel }}</span>
            <i class="pi pi-external-link btn-chevron" aria-hidden="true" />
          </span>
        </button>

        <div v-if="showForgotPassword" class="forgot_password_block">
          <a :href="forgotPasswordHref" class="forgot_password_btn">
            <span>{{ forgotPasswordLabel }}</span>
          </a>
        </div>

        <p class="auth-hint">
          <i class="pi pi-info-circle" aria-hidden="true" />
          {{ hint }}
        </p>
        <p v-if="authError" class="auth-error">
          <i class="pi pi-exclamation-triangle" aria-hidden="true" />
          {{ authError }}
        </p>
      </div>

      <p class="policy">
        Продолжая, вы соглашаетесь с
        <a
          :href="policy.userAgreementHref"
          target="_blank"
          rel="noopener"
          class="policy-link"
          >Пользовательским соглашением</a
        >,
        <a :href="policy.sopdHref" target="_blank" rel="noopener" class="policy-link"
          >Согласием на обработку персональных данных</a
        >
        и
        <a :href="policy.policyHref" target="_blank" rel="noopener" class="policy-link"
          >Политикой в отношении обработки персональных данных</a
        >.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OidcRedirectAuthPolicy } from '../types';

withDefaults(
  defineProps<{
    logo: string;
    logoAlt: string;
    title: string;
    policy: OidcRedirectAuthPolicy;
    subtitle?: string;
    homeHref?: string;
    loginButtonLabel?: string;
    loadingLabel?: string;
    hint?: string;
    loading?: boolean;
    authError?: string;
    showForgotPassword?: boolean;
    forgotPasswordHref?: string;
    forgotPasswordLabel?: string;
  }>(),
  {
    homeHref: '/',
    loginButtonLabel: 'Войти',
    loadingLabel: 'Переход…',
    hint: 'Не открылось окно? Разрешите всплывающие окна для сайта.',
    loading: false,
    authError: '',
    showForgotPassword: true,
    forgotPasswordHref: '/forgot_password/',
    forgotPasswordLabel: 'Забыли пароль?',
  },
);

const emit = defineEmits<{
  login: [];
}>();
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding-bottom: 48px;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-header .logo {
  width: min(300px, 72vw);
  margin-left: 20px;
  margin-top: 20px;
}

.auth-form-container {
  max-width: 440px;
  margin: 0 auto;
  margin-top: 28px;
  padding: 0 16px;
}

.auth-card {
  background: var(--russ-bg-elevated, var(--russ-bg, #fff));
  border: 1px solid var(--russ-border, rgba(0, 0, 0, 0.08));
  border-radius: 16px;
  padding: 28px 24px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.auth-card-head {
  text-align: center;
  margin-bottom: 22px;
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--russ-primary, #2563eb) 12%, transparent);
  color: var(--russ-primary, #2563eb);
  font-size: 1.35rem;
  margin-bottom: 14px;
}

.auth-card-head h1 {
  margin: 0 0 10px;
  font-size: clamp(22px, 4.5vw, 28px);
  font-weight: 700;
  line-height: 1.2;
}

.auth-subtitle {
  margin: 0;
  font-size: clamp(14px, 3.2vw, 15px);
  line-height: 1.5;
  color: var(--russ-text-secondary, #555);
}

.login_btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  font-weight: 700;
  font-size: clamp(15px, 3.5vw, 16px);
  min-height: 56px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease,
    transform 0.15s ease;
}

.login_btn-primary {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse, #fff);
}

.login_btn-primary:hover:not(:disabled) {
  background-color: var(--russ-primary-dark);
}

.login_btn-primary:active:not(:disabled) {
  transform: scale(0.99);
}

.login_btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login_btn-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-chevron {
  font-size: 0.9em;
  opacity: 0.9;
}

.button-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.auth-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--russ-text-tertiary, #666);
}

.auth-hint .pi {
  margin-top: 2px;
  flex-shrink: 0;
  opacity: 0.85;
}

.auth-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--russ-error, #dc2626);
}

.forgot_password_block {
  margin-top: 18px;
}

.forgot_password_btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  border: 2px solid var(--russ-primary, #2563eb);
  background: var(--russ-bg-elevated);
  color: var(--russ-primary, #2563eb);
  font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.forgot_password_btn:hover {
  background: color-mix(in srgb, var(--russ-primary, #2563eb) 18%, var(--russ-bg-elevated, #fff));
  border-color: var(--russ-primary-dark, #1d4ed8);
  color: var(--russ-primary-dark, #1d4ed8);
}

.forgot_password_btn:active {
  transform: scale(0.99);
}

.auth-form-container .policy {
  font-size: 13px;
  text-align: center;
  color: var(--russ-text-tertiary);
  margin: 28px 0 0;
  line-height: 1.5;
}

.policy-link {
  color: var(--russ-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.policy-link:hover {
  color: var(--russ-primary-dark);
}
</style>
