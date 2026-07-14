<template>
  <BaseModal
    v-model="visible"
    :title="title"
    size="sm"
  >
    <div class="cred-reveal">
      <div class="cred-reveal__status" aria-hidden="true">
        <i class="pi pi-check-circle"></i>
      </div>
      <p class="cred-reveal__lead">{{ lead }}</p>

      <div class="cred-reveal__rows">
        <div v-if="login" class="cred-row">
          <div class="cred-row__meta">
            <span class="cred-row__label">{{ loginLabel }}</span>
            <span class="cred-row__value cred-row__value--digits">{{ login }}</span>
          </div>
          <button type="button" class="cred-row__copy" title="Скопировать" @click="copy(login, loginLabel)">
            <i class="pi pi-copy" aria-hidden="true"></i>
          </button>
        </div>

        <div v-if="password" class="cred-row cred-row--accent">
          <div class="cred-row__meta">
            <span class="cred-row__label">Пароль</span>
            <span class="cred-row__value cred-row__value--mono">{{ password }}</span>
          </div>
          <button type="button" class="cred-row__copy" title="Скопировать пароль" @click="copy(password, 'Пароль')">
            <i class="pi pi-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <p class="cred-reveal__hint">
        {{ hint }}
      </p>
    </div>

    <template #footer>
      <div class="cred-reveal__footer">
        <button
          v-if="login && password"
          type="button"
          class="btn-cancel"
          @click="copyBoth"
        >
          Скопировать всё
        </button>
        <button type="button" class="btn-submit" @click="visible = false">
          Готово
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { BaseModal } from '../BaseModal'
import { useToast } from '../Toast'

const visible = defineModel<boolean>('visible', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    lead?: string
    login?: string | null
    loginLabel?: string
    password?: string | null
    hint?: string
  }>(),
  {
    title: 'Данные для входа',
    lead: 'Сохраните данные — пароль больше не будет показан.',
    login: null,
    loginLabel: 'Логин',
    password: null,
    hint: 'Передайте сотруднику логин и пароль по защищённому каналу.',
  },
)

const toast = useToast()

async function copy(text: string, label: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: `${label} скопирован`,
      life: 2000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось скопировать',
      life: 3000,
    })
  }
}

async function copyBoth() {
  const login = props.login?.trim() || ''
  const password = props.password?.trim() || ''
  if (!login && !password) return
  const payload = [
    login ? `${props.loginLabel}: ${login}` : null,
    password ? `Пароль: ${password}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  await copy(payload, 'Данные для входа')
}
</script>

<style scoped>
.cred-reveal {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  padding: 4px 0 8px;
}

.cred-reveal__status {
  display: flex;
  justify-content: center;
}

.cred-reveal__status .pi {
  font-size: 2rem;
  color: var(--russ-success, #16a34a);
}

.cred-reveal__lead {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
  color: var(--russ-text-secondary);
}

.cred-reveal__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cred-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary, var(--russ-bg));
}

.cred-row--accent {
  border-color: color-mix(in srgb, var(--russ-accent, #4f46e5) 28%, var(--russ-border));
  background: color-mix(in srgb, var(--russ-accent, #4f46e5) 6%, var(--russ-bg));
}

.cred-row__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.cred-row__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--russ-text-tertiary);
}

.cred-row__value {
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-text-primary);
  word-break: break-all;
  line-height: 1.35;
}

.cred-row__value--digits {
  font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
  letter-spacing: 0.04em;
}

.cred-row__value--mono {
  font-family: ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.cred-row__copy {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg);
  color: var(--russ-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.cred-row__copy:hover {
  color: var(--russ-accent-dark, var(--russ-accent));
  border-color: var(--russ-accent-dark, var(--russ-accent));
  background: color-mix(in srgb, var(--russ-accent, #4f46e5) 8%, var(--russ-bg));
}

.cred-reveal__hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--russ-warning-light, #fff7ed);
  color: var(--russ-warning-text, #9a3412);
  font-size: 13px;
  line-height: 1.4;
}

.cred-reveal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.btn-cancel,
.btn-submit {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  color: var(--russ-text-secondary);
}

.btn-cancel:hover {
  background: var(--russ-bg-hover);
  color: var(--russ-text-primary);
}

.btn-submit {
  background: var(--russ-accent-dark, var(--russ-accent));
  border: 1px solid var(--russ-accent-dark, var(--russ-accent));
  color: var(--russ-text-inverse, #fff);
}

.btn-submit:hover {
  filter: brightness(0.96);
}
</style>
