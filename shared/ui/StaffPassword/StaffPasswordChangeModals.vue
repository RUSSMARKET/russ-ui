<template>
  <BaseModal
    v-model="visible"
    title="Смена пароля"
    size="sm"
    @hide="resetForm"
  >
    <div class="pwd-form">
      <div v-if="userLabel" class="pwd-form__user">
        <span class="pwd-form__user-label">Пользователь</span>
        <span class="pwd-form__user-name">{{ userLabel }}</span>
      </div>

      <div class="pwd-form__field">
        <label class="pwd-form__label" for="staff-new-password">Новый пароль</label>
        <InputPassword
          id="staff-new-password"
          v-model="form.newPassword"
          placeholder="Введите новый пароль"
          name="new-password"
          autocomplete="new-password"
          :toggle-mask="true"
        />
      </div>

      <div class="pwd-form__field">
        <label class="pwd-form__label" for="staff-new-password-confirm">Повтор пароля</label>
        <InputPassword
          id="staff-new-password-confirm"
          v-model="form.newPasswordConfirmation"
          placeholder="Повторите новый пароль"
          name="new-password-confirm"
          autocomplete="new-password"
          :toggle-mask="true"
        />
      </div>

      <div class="password-rules">
        <div class="password-rules-title">Требования к паролю</div>
        <ul class="password-rules-list">
          <li>Не менее 8 символов</li>
          <li>Латинские заглавные и строчные буквы</li>
          <li>Минимум 1 цифра и спецсимвол (!@#$%&amp;)</li>
        </ul>
      </div>

      <div v-if="error" class="pwd-form__error" role="alert">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <div class="pwd-form__footer">
        <button type="button" class="btn-cancel" :disabled="loading" @click="close">
          Отмена
        </button>
        <button type="button" class="btn-submit" :disabled="loading" @click="submit">
          <span v-if="loading" class="loader-inline" aria-hidden="true"></span>
          {{ loading ? 'Сохранение…' : 'Сменить пароль' }}
        </button>
      </div>
    </template>
  </BaseModal>

  <StaffCredentialsRevealModal
    v-model:visible="showResult"
    title="Пароль изменён"
    lead="Новый пароль установлен. Сохраните его — повторно он не отобразится."
    :password="establishedPassword"
    hint="Передайте пароль сотруднику по защищённому каналу."
  />
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { BaseModal } from '../BaseModal'
import { InputPassword } from '../inputs/password'
import { useToast } from '../Toast'
import StaffCredentialsRevealModal from './StaffCredentialsRevealModal.vue'
import {
  setUserPasswordErrorMessage,
  validateStaffPassword,
  type StaffSetPasswordFn,
} from './password'

const visible = defineModel<boolean>('visible', { default: false })

const props = defineProps<{
  userId: string | number | null | undefined
  userLabel?: string | null
  setPassword: StaffSetPasswordFn
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const loading = ref(false)
const error = ref('')
const showResult = ref(false)
const establishedPassword = ref('')
const form = reactive({
  newPassword: '',
  newPasswordConfirmation: '',
})

watch(visible, (open) => {
  if (open) {
    resetForm()
  }
})

function resetForm() {
  form.newPassword = ''
  form.newPasswordConfirmation = ''
  error.value = ''
  loading.value = false
}

function close() {
  visible.value = false
  resetForm()
}

async function submit() {
  if (props.userId == null || props.userId === '') {
    error.value = 'Пользователь не выбран'
    return
  }

  if (!form.newPassword || !form.newPasswordConfirmation) {
    error.value = 'Пожалуйста, заполните все поля'
    return
  }

  if (form.newPassword !== form.newPasswordConfirmation) {
    error.value = 'Пароли не совпадают'
    return
  }

  const validationError = validateStaffPassword(form.newPassword)
  if (validationError) {
    error.value = validationError
    return
  }

  loading.value = true
  error.value = ''

  try {
    await props.setPassword({
      userId: props.userId,
      newPassword: form.newPassword,
      newPasswordConfirmation: form.newPasswordConfirmation,
    })
    establishedPassword.value = form.newPassword
    visible.value = false
    resetForm()
    showResult.value = true
    emit('success')
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Пароль успешно изменен',
      life: 3000,
    })
  } catch (err) {
    error.value = setUserPasswordErrorMessage(err)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.value,
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.pwd-form__user {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary, var(--russ-bg));
}

.pwd-form__user-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--russ-text-tertiary);
}

.pwd-form__user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--russ-text-primary);
  word-break: break-word;
}

.pwd-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pwd-form__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--russ-text-secondary);
}

.password-rules {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary, rgba(0, 0, 0, 0.03));
}

.password-rules-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--russ-text-secondary);
}

.password-rules-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 12px;
  color: var(--russ-text-tertiary);
  line-height: 1.5;
}

.pwd-form__error {
  color: var(--russ-error);
  font-size: 13px;
  line-height: 1.4;
}

.pwd-form__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.btn-cancel,
.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.btn-cancel:hover:not(:disabled) {
  background: var(--russ-bg-hover);
}

.btn-submit {
  background: var(--russ-accent-dark, var(--russ-accent));
  border: 1px solid var(--russ-accent-dark, var(--russ-accent));
  color: var(--russ-text-inverse, #fff);
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.7;
  cursor: wait;
}

.loader-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, #fff 35%, transparent);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pwd-spin 0.7s linear infinite;
}

@keyframes pwd-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
