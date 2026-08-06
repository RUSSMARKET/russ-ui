<template>
  <div class="profile-agent-type-choice">
    <div class="patc-shell">
      <header class="patc-header">
        <button type="button" class="patc-back" aria-label="Назад" @click="onBack">
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
      </header>

      <div class="patc-intro">
        <h1 class="patc-title">Как будете работать?</h1>
        <p class="patc-subtitle">Выберите подходящий вариант</p>
      </div>

      <div class="patc-cards" role="radiogroup" aria-label="Тип оформления">
        <button
          type="button"
          class="patc-card"
          :class="{ 'patc-card--selected': selected === 'self-employed' }"
          role="radio"
          :aria-checked="selected === 'self-employed'"
          :disabled="choiceLocked"
          @click="selected = 'self-employed'"
        >
          <span class="patc-card__radio" aria-hidden="true" />
          <span class="patc-card__body">
            <span class="patc-card__title">Самозанятый</span>
            <span class="patc-card__desc">Налог на профессиональный доход</span>
          </span>
          <span class="patc-card__tags">
            <span class="patc-tag patc-tag--brand">Самый простой</span>
            <span class="patc-tag">Налог 6%</span>
          </span>
          <img class="patc-card__illust" :src="illustSe" alt="" width="160" height="85" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="patc-card"
          :class="{ 'patc-card--selected': selected === 'ie' }"
          role="radio"
          :aria-checked="selected === 'ie'"
          :disabled="choiceLocked"
          @click="selected = 'ie'"
        >
          <span class="patc-card__radio" aria-hidden="true" />
          <span class="patc-card__body">
            <span class="patc-card__title">Индивидуальный предприниматель</span>
          </span>
          <span class="patc-card__tags">
            <span class="patc-tag">Гибкость в выводе</span>
            <span class="patc-tag">Свой счет</span>
          </span>
          <img class="patc-card__illust" :src="illustIe" alt="" width="160" height="85" aria-hidden="true" />
        </button>
      </div>

      <div class="patc-footer">
        <AuthRRButton
          label="Продолжить"
          :disabled="choiceLocked || !selected"
          :loading="busy"
          @click="onContinue"
        />
        <p v-if="choiceLocked" class="patc-error" role="alert">
          Тип оформления уже отправлен. Изменение недоступно.
        </p>
        <p v-else-if="formError" class="patc-error" role="alert">{{ formError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  AGENT_TYPE_IE,
  AGENT_TYPE_SELF_EMPLOYED,
  IE_WIZARD_TOTAL,
  SE_WIZARD_TOTAL,
  ieWizardPath,
  seWizardPath,
} from './lib/agentTypeWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import illustSe from './assets/activation/agent-type-examples/illust-self-employed.png'
import illustIe from './assets/activation/agent-type-examples/illust-ie.png'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const { setAgentType, getUserData } = api

const selected = ref('')
const busy = ref(false)
const formError = ref('')
const choiceLocked = ref(false)

function onBack() {
  void navigateTo('/profile')
}

async function redirectIfLocked() {
  try {
    const userRes = await getUserData()
    const user = userRes?.data ?? userRes
    if (!isActivationStepLocked(user?.activation?.steps?.['agent-type'])) return

    const accountType = Number(user?.account_type)
    if (accountType === AGENT_TYPE_SELF_EMPLOYED) {
      void navigateTo(seWizardPath(SE_WIZARD_TOTAL), { replace: true })
      return
    }
    if (accountType === AGENT_TYPE_IE) {
      void navigateTo(ieWizardPath(IE_WIZARD_TOTAL), { replace: true })
      return
    }
    // Locked without known type — return to hub (do not allow re-picking type).
    void navigateTo('/profile', { replace: true })
    return
  } catch (err) {
    console.error('[agent-type-choice] failed to check lock', err)
  }
}

async function onContinue() {
  if (choiceLocked.value || !selected.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const accountType =
      selected.value === 'self-employed' ? AGENT_TYPE_SELF_EMPLOYED : AGENT_TYPE_IE
    await setAgentType(String(accountType))
    if (selected.value === 'self-employed') {
      await navigateTo(seWizardPath(1))
    } else {
      await navigateTo(ieWizardPath(1))
    }
  } catch (err) {
    formError.value =
      parseApiErrorDetail(err, 'Не удалось сохранить тип оформления') ||
      'Не удалось сохранить тип оформления'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  void redirectIfLocked()
})
</script>

<style scoped>
.profile-agent-type-choice,
.profile-agent-type-choice *,
.profile-agent-type-choice *::before,
.profile-agent-type-choice *::after {
  box-sizing: border-box;
}

.profile-agent-type-choice {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
  background: var(--rr-backgrounds-primary, #fff);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  color: var(--rr-labels-neutral-primary);
}

.patc-shell {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  padding:
    var(--rr-spacing-padding-m)
    var(--rr-spacing-padding-xl)
    calc(var(--rr-spacing-padding-xl) + env(safe-area-inset-bottom, 0px));
}

.patc-header {
  flex: 0 0 auto;
  margin-bottom: var(--rr-spacing-padding-xl);
}

.patc-back {
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

.patc-intro {
  flex: 0 0 auto;
  margin-bottom: var(--rr-spacing-padding-3-xl);
}

.patc-title {
  margin: 0 0 var(--rr-spacing-padding-s);
  font-size: var(--rr-font-size-font-size-2xl);
  line-height: var(--rr-line-height-line-height-2xl);
  font-weight: 600;
  text-align: left;
}

.patc-subtitle {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  color: var(--rr-labels-neutral-secondary);
  text-align: left;
}

.patc-cards {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}

.patc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  width: 100%;
  min-height: 160px;
  margin: 0;
  padding: var(--rr-spacing-padding-l, 12px);
  border: 1.5px solid transparent;
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 4px 24px var(--rr-fx-shadow-minor, rgba(16, 16, 18, 0.06));
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.patc-card--selected {
  border-color: var(--rr-labels-brand-primary);
}

.patc-card__radio {
  position: absolute;
  top: var(--rr-spacing-padding-l, 12px);
  right: var(--rr-spacing-padding-l, 12px);
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--rr-border-neutral-base, #cdced6);
  background: transparent;
}

.patc-card--selected .patc-card__radio {
  border-color: var(--rr-labels-brand-primary);
  background:
    radial-gradient(circle at center, var(--rr-labels-brand-primary) 0 6px, transparent 7px);
}

.patc-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
  min-width: 0;
  padding-right: 140px;
}

.patc-card__title {
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m);
}

.patc-card__desc {
  font-size: var(--rr-font-size-font-size-xs);
  line-height: var(--rr-line-height-line-height-xs);
  color: var(--rr-labels-neutral-secondary);
}

.patc-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--rr-spacing-padding-s);
  width: 100%;
  margin-top: auto;
  padding-top: var(--rr-spacing-padding-m);
  box-sizing: border-box;
}

.patc-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--rr-radius-full);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-primary);
  font-size: var(--rr-font-size-font-size-xs);
  font-weight: 500;
  line-height: 1.3;
}

.patc-tag--brand {
  background: var(--rr-backgrounds-brand-secondary-default, #e8edfc);
  color: var(--rr-labels-brand-primary);
}

.patc-card__illust {
  position: absolute;
  right: 0;
  bottom: 0;
  display: block;
  width: 168px;
  height: auto;
  margin: 0;
  padding: 0;
  object-fit: contain;
  object-position: right bottom;
  pointer-events: none;
  z-index: 0;
}

.patc-card__body,
.patc-card__tags {
  position: relative;
  z-index: 1;
}

.patc-footer {
  flex: 0 0 auto;
  padding-top: var(--rr-spacing-padding-l);
}

.patc-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  text-align: center;
}
</style>
