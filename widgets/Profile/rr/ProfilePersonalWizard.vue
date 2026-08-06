<template>
  <div class="profile-personal-wizard">
  <ProfileStepShell
    :current="step"
    :total="PERSONAL_WIZARD_TOTAL"
    :title="shellTitle"
    :subtitle="shellSubtitle"
    :step-text="step === 5 ? '5 из 5' : ''"
    :hide-progress="viewOnly"
    @back="onBack"
  >
    <!-- Step 1: identity -->
    <div v-if="step === 1" class="ppw-stack">
      <div class="ppw-fio-group">
        <p class="ppw-fio-label">ФИО</p>
        <div class="ppw-fio-fields">
          <AuthRRField :error="nameFieldError">
            <input
              v-model="form.name"
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!nameFieldError }"
              type="text"
              autocomplete="given-name"
              placeholder="Имя"
              :aria-invalid="!!nameFieldError"
              @blur="nameTouched = true"
            />
          </AuthRRField>
          <AuthRRField :error="surnameFieldError">
            <input
              v-model="form.surname"
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!surnameFieldError }"
              type="text"
              autocomplete="family-name"
              placeholder="Фамилия"
              :aria-invalid="!!surnameFieldError"
              @blur="surnameTouched = true"
            />
          </AuthRRField>
          <AuthRRField :error="patronymicFieldError">
            <input
              v-model="form.patronymic"
              class="auth-rr-input__control auth-rr-input__control--align-left"
              :class="{ 'auth-rr-input__control--error': !!patronymicFieldError }"
              type="text"
              autocomplete="additional-name"
              placeholder="Отчество"
              :disabled="form.noPatronymic"
              :aria-invalid="!!patronymicFieldError"
              @blur="patronymicTouched = true"
            />
          </AuthRRField>
        </div>
        <ProfileRrCheckbox v-model="form.noPatronymic" label="Нет отчества" />
      </div>
      <div class="ppw-row">
        <ProfileRrGender v-model="form.gender" />
        <AuthRRField label="Дата рождения" :error="birthdayFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!birthdayFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="ДД.ММ.ГГГГ"
            :value="form.birthday"
            maxlength="10"
            :aria-invalid="!!birthdayFieldError"
            @input="onBirthdayInput"
            @blur="birthdayTouched = true"
          />
        </AuthRRField>
      </div>
    </div>

    <!-- Step 2: contacts -->
    <div v-else-if="step === 2" class="ppw-stack">
      <div
        class="ppw-phone-field"
        @pointerdown.capture="onPhoneLockedInteract"
        @focusin="onPhoneLockedInteract"
      >
        <AuthRRInputPhone
          v-model="form.phone"
          label="Номер телефона"
          readonly
        />
        <p v-if="phoneLockHint" class="ppw-field-hint" role="status">
          Заменить номер можно только через обращение к руководителю
        </p>
      </div>
      <AuthRRInputText
        v-model="form.email"
        label="Почта"
        type="email"
        autocomplete="email"
        placeholder="email@example.com"
        :error="emailFieldError"
        @blur="emailTouched = true"
      />
      <AuthRRInputText
        :model-value="form.telegram"
        label="Ник в тг (через @)"
        autocomplete="off"
        placeholder="@username"
        :error="telegramFieldError"
        @update:model-value="onTelegramInput"
        @focus="onTelegramFocus"
        @blur="telegramTouched = true"
      />
    </div>

    <!-- Step 3: email OTP -->
    <div v-else-if="step === 3" class="ppw-stack ppw-stack--otp">
      <AuthRROtpInput v-model="otpCode" :invalid="!!otpError" />
      <p v-if="otpError" class="ppw-error" role="alert">{{ otpError }}</p>
      <p class="ppw-hint">
        <template v-if="resendSeconds > 0">
          Новый код можно получить через {{ resendCountdownLabel }}
        </template>
        <button
          v-else
          type="button"
          class="ppw-link"
          :disabled="busy"
          @click="resendEmailCode"
        >
          Отправить код ещё раз
        </button>
      </p>
    </div>

    <!-- Step 4: photo (пропускается, если уже выгружено на сервер) -->
    <div v-else-if="step === 4" class="ppw-stack">
      <template v-if="photoLocked">
        <p class="ppw-photo-locked" role="status">
          Фото уже выгружено. Повторная загрузка недоступна.
        </p>
      </template>
      <template v-else>
        <div class="ppw-examples">
          <div
            v-for="item in photoExamples"
            :key="item.label"
            class="ppw-example"
            :class="`ppw-example--${item.kind}`"
          >
            <div class="ppw-example__media">
              <div class="ppw-example__frame">
                <img
                  class="ppw-example__img"
                  :src="item.src"
                  :alt="item.label"
                  width="120"
                  height="160"
                  decoding="async"
                />
              </div>
              <img
                class="ppw-example__badge"
                :src="item.kind === 'ok' ? badgeOk : badgeBad"
                alt=""
                width="18"
                height="18"
                aria-hidden="true"
              />
            </div>
            <p class="ppw-example__label">{{ item.label }}</p>
          </div>
        </div>

        <div class="ppw-tips">
          <h2 class="ppw-tips__title">Советы</h2>
          <div class="ppw-tips__grid">
            <div v-for="tip in photoTips" :key="tip.label" class="ppw-tip">
              <span class="ppw-tip__icon" aria-hidden="true">
                <img :src="tip.icon" alt="" width="16" height="16" />
              </span>
              <span class="ppw-tip__text">{{ tip.label }}</span>
            </div>
          </div>
        </div>

        <button type="button" class="ppw-help-link" @click="photoHelpOpen = true">
          <img
            class="ppw-help-link__icon"
            :src="helpCircleIcon"
            alt=""
            width="20"
            height="20"
            aria-hidden="true"
          />
          <span>Где сделать фотографию</span>
        </button>

        <input
          ref="photoInputRef"
          class="ppw-file-input"
          type="file"
          accept="image/*"
          @change="onPhotoPicked"
        />
      </template>
    </div>

    <!-- Step 5: review -->
    <div v-else class="ppw-review">
      <section class="ppw-card">
        <header class="ppw-card__head">
          <h2>Личные данные</h2>
          <button
            v-if="!viewOnly"
            type="button"
            class="ppw-link"
            @click="goToStep(1)"
          >
            Изменить
          </button>
        </header>
        <div class="ppw-stack">
          <div class="ppw-fio-group">
            <p class="ppw-fio-label">ФИО</p>
            <div class="ppw-fio-fields">
              <input
                class="auth-rr-input__control auth-rr-input__control--align-left"
                :value="form.name"
                readonly
              />
              <input
                class="auth-rr-input__control auth-rr-input__control--align-left"
                :value="form.surname"
                readonly
              />
              <input
                v-if="!form.noPatronymic"
                class="auth-rr-input__control auth-rr-input__control--align-left"
                :value="form.patronymic"
                readonly
              />
            </div>
          </div>
          <div class="ppw-row">
            <ProfileRrGender :model-value="form.gender" disabled />
            <AuthRRField label="Дата рождения">
              <input
                class="auth-rr-input__control auth-rr-input__control--align-left"
                :value="form.birthday"
                readonly
              />
            </AuthRRField>
          </div>
        </div>
      </section>

      <section class="ppw-card">
        <header class="ppw-card__head">
          <h2>Контакты</h2>
          <button
            v-if="!viewOnly"
            type="button"
            class="ppw-link"
            @click="goToStep(2)"
          >
            Изменить
          </button>
        </header>
        <div class="ppw-stack">
          <AuthRRInputPhone v-model="form.phone" label="Номер телефона" readonly />
          <AuthRRInputText v-model="form.email" label="Почта" readonly />
          <AuthRRInputText v-model="form.telegram" label="Ник в тг (через @)" readonly />
        </div>
      </section>

      <section class="ppw-card">
        <header class="ppw-card__head">
          <h2>Фото профиля</h2>
        </header>
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          alt="Фото профиля"
          @click="openPhotoPreview(reviewPhotoUrl)"
        />
      </section>

      <section v-if="!viewOnly" class="ppw-card">
        <ProfileRrCheckbox v-model="form.dataConfirmed" label="Данные верны" />
      </section>
    </div>

    <template #footer>
      <template v-if="viewOnly">
        <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile')" />
      </template>
      <template v-else>
        <AuthRRButton
          v-if="step === 1"
          label="Продолжить"
          :disabled="!canContinueIdentity"
          :loading="busy"
          @click="submitIdentity"
        />
        <AuthRRButton
          v-else-if="step === 2"
          :label="needsEmailVerification ? 'Подтвердить почту' : 'Продолжить'"
          :disabled="!canContinueContacts"
          :loading="busy"
          @click="startEmailConfirm"
        />
        <AuthRRButton
          v-else-if="step === 3"
          variant="neutral-secondary"
          label="Изменить почту"
          :disabled="busy"
          @click="onChangeEmailFromOtp"
        />
        <template v-else-if="step === 4">
          <template v-if="photoLocked">
            <AuthRRButton
              label="Продолжить"
              :loading="busy"
              @click="onPhotoContinue"
            />
          </template>
          <template v-else>
            <AuthRRButton
              label="Сфотографироваться"
              :loading="busy"
              @click="openPhotoCamera"
            />
            <AuthRRButton
              variant="brand-secondary"
              label="Загрузить из галереи"
              :disabled="busy"
              @click="openPhotoGallery"
            />
          </template>
        </template>
        <AuthRRButton
          v-else
          label="Отправить на проверку"
          :disabled="!form.dataConfirmed || !form.photoServerPath"
          :loading="busy"
          @click="submitForReview"
        />
      </template>
      <p v-if="formError" class="ppw-error" role="alert">{{ formError }}</p>
    </template>
  </ProfileStepShell>

    <PassportCameraCapture
      v-if="cameraOpen"
      variant="profile"
      :source="photoCaptureSource"
      :seed-file="photoSeedFile"
      :saving="busy"
      @close="closePhotoCapture"
      @save="onCameraSave"
      @replace="onPhotoReplace"
    />

    <ProfileBottomSheet
      v-model="photoHelpOpen"
      height-mode="fit"
      :height-percent="70"
      title="Нет подходящего фото?"
    >
      <div class="ppw-sheet-copy">
        <p class="ppw-sheet-copy__p">
          Для удобства рекомендуем использовать приложение «Фото на документы».
        </p>
        <p class="ppw-sheet-copy__p">
          Оно поможет обрезать фотографию, выровнять фон и подготовить изображение согласно требованиям.
        </p>
        <div class="ppw-store-links" role="group" aria-label="Скачать приложение">
          <a
            class="ppw-store-links__link"
            href="https://apps.apple.com/ru/app/фото-на-документы-паспорт-визы/id1483750251"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="ppw-store-links__badge"
              :src="appStoreBadge"
              alt="Загрузите в App Store"
              width="120"
              height="40"
              decoding="async"
            />
          </a>
          <a
            class="ppw-store-links__link"
            href="https://play.google.com/store/apps/details?id=online.passportphoto.visa.id.app&hl=ru&gl=US"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="ppw-store-links__badge"
              :src="googlePlayBadge"
              alt="Загрузите в Google Play"
              width="135"
              height="40"
              decoding="async"
            />
          </a>
        </div>
      </div>
      <template #footer>
        <AuthRRButton label="Понятно" @click="photoHelpOpen = false" />
      </template>
    </ProfileBottomSheet>

    <ProfilePhotoReviewOverlay
      v-if="photoPreviewOpenUrl"
      :src="photoPreviewOpenUrl"
      alt="Просмотр фото профиля"
      aria-label="Просмотр фото профиля"
      :show-secondary="!viewOnly && !photoLocked"
      secondary-label="Заменить"
      primary-label="Готово"
      @close="photoPreviewOpenUrl = ''"
      @primary="photoPreviewOpenUrl = ''"
      @secondary="onReplaceFromPhotoPreview"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import {
  AuthRRButton,
  AuthRRField,
  AuthRRInputPhone,
  AuthRRInputText,
  AuthRROtpInput,
} from 'bibli/shared/ui/rr'
import 'bibli/shared/ui/rr/auth-rr-input.css'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import { normalizeTelegramWithPrefix, sanitizeTelegramForSubmit } from 'bibli/widgets/Profile/lib/telegram'
import {
  PERSONAL_WIZARD_TOTAL,
  birthdayFromApi,
  birthdayToApi,
  clearPendingOtpEmail,
  createEmptyPersonalForm,
  getPersonalBirthdayFieldError,
  getPersonalEmailFieldError,
  getPersonalNameFieldError,
  getPersonalPatronymicFieldError,
  getPersonalSurnameFieldError,
  getPersonalTelegramFieldError,
  isContactsStepValid,
  isIdentityStepValid,
  isPhotoStepValid,
  maskBirthdayInput,
  maskEmail,
  normalizePhoneForRrInput,
  parsePersonalWizardStep,
  personalWizardPath,
  readPendingOtpEmail,
  remainingOtpResendSeconds,
  writeOtpResendAt,
  writePendingOtpEmail,
} from './lib/personalWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import {
  isAllowedUploadFile,
  uploadRejectMessage,
} from './lib/documentMedia'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfileRrGender from './personal/ProfileRrGender.vue'
import ProfileBottomSheet from './personal/ProfileBottomSheet.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleOk from './assets/activation/photo-examples/example-ok.webp'
import exampleSelfie from './assets/activation/photo-examples/example-selfie.webp'
import exampleFar from './assets/activation/photo-examples/example-far.webp'
import badgeOk from './assets/activation/photo-examples/badge-ok.svg'
import badgeBad from './assets/activation/photo-examples/badge-bad.svg'
import tipLookIcon from './assets/activation/photo-tips/tip-look.svg'
import tipBackgroundIcon from './assets/activation/photo-tips/tip-background.svg'
import tipFrameIcon from './assets/activation/photo-tips/tip-frame.svg'
import tipAccessoriesIcon from './assets/activation/photo-tips/tip-accessories.svg'
import helpCircleIcon from './assets/activation/help-circle-contained.svg'
import appStoreBadge from './assets/activation/store/app_store.webp'
import googlePlayBadge from './assets/activation/store/google_play_black.webp'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getPersonalData,
  submitContactData,
  sendUserEmailCode,
  sendUserEmailCodeVerify,
  uploadPassportDocuments,
  getPassportFiles,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
})

const step = computed(() => parsePersonalWizardStep(props.step))
const busy = ref(false)
const formError = ref('')
/** Уже отправлено на проверку — только просмотр. */
const viewOnly = ref(false)
const otpCode = ref('')
const otpError = ref('')
const otpEmail = ref(typeof sessionStorage !== 'undefined' ? readPendingOtpEmail() : '')
const resendSeconds = ref(0)
const photoHelpOpen = ref(false)
const photoInputRef = ref(null)
const phoneLockHint = ref(false)
const cameraOpen = ref(false)
const photoCaptureSource = ref('camera')
const photoSeedFile = ref(null)
const photoPreviewOpenUrl = ref('')
const form = reactive(createEmptyPersonalForm())

const nameTouched = ref(false)
const surnameTouched = ref(false)
const patronymicTouched = ref(false)
const birthdayTouched = ref(false)
const emailTouched = ref(false)
const telegramTouched = ref(false)

const nameFieldError = computed(() => getPersonalNameFieldError(form.name, nameTouched.value))
const surnameFieldError = computed(() =>
  getPersonalSurnameFieldError(form.surname, surnameTouched.value),
)
const patronymicFieldError = computed(() =>
  getPersonalPatronymicFieldError(form.patronymic, form.noPatronymic, patronymicTouched.value),
)
const birthdayFieldError = computed(() =>
  getPersonalBirthdayFieldError(form.birthday, birthdayTouched.value),
)
const emailFieldError = computed(() => getPersonalEmailFieldError(form.email, emailTouched.value))
const telegramFieldError = computed(() =>
  getPersonalTelegramFieldError(form.telegram, telegramTouched.value),
)

let resendTimer = null
let localPreviewUrl = null

const OTP_RESEND_COOLDOWN_SEC = 60

const resendCountdownLabel = computed(() => {
  const total = Math.max(0, resendSeconds.value)
  if (total >= 60) {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
  return `${total} сек`
})

const photoExamples = [
  { label: 'Правильно', kind: 'ok', src: exampleOk },
  { label: 'Не селфи', kind: 'bad', src: exampleSelfie },
  { label: 'Снимок издалека', kind: 'bad', src: exampleFar },
]

const photoTips = [
  { label: 'Смотрите прямо\nв\u00a0камеру', icon: tipLookIcon },
  { label: 'Используйте светлый\nоднотонный\u00a0фон', icon: tipBackgroundIcon },
  { label: 'Лицо занимает около\n80%\u00a0кадра', icon: tipFrameIcon },
  { label: 'Без головных уборов\nи\u00a0тёмных\u00a0очков', icon: tipAccessoriesIcon },
]

const canContinueIdentity = computed(() => isIdentityStepValid(form))
const canContinueContacts = computed(() => isContactsStepValid(form))
const initialEmail = ref('')
/** Фото уже на сервере — шаг не показываем и менять нельзя. */
const photoLocked = computed(() => Boolean(form.photoServerPath))
const reviewPhotoUrl = computed(() => {
  if (form.photoPreviewUrl) return form.photoPreviewUrl
  if (form.photoServerPath) return getDocumentUrl(form.photoServerPath)
  return ''
})
const needsEmailVerification = computed(() => {
  const next = form.email.trim().toLowerCase()
  const current = initialEmail.value.trim().toLowerCase()
  return !current || next !== current
})

const shellTitle = computed(() => {
  if (viewOnly.value) return 'Личные данные'
  if (step.value === 1) return 'Как вас зовут?'
  if (step.value === 2) return 'Контактные данные'
  if (step.value === 3) return 'Введите код'
  if (step.value === 4) return 'Фото для документов'
  return 'Проверьте данные'
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) return 'Укажите данные как в паспорте'
  if (step.value === 2) return 'Как с вами связаться'
  if (step.value === 3) {
    const mail = (otpEmail.value || form.email || readPendingOtpEmail()).trim()
    return mail ? `Код отправлен на почту ${maskEmail(mail)}` : 'Код отправлен на почту'
  }
  if (step.value === 4) {
    return photoLocked.value
      ? 'Фото уже выгружено'
      : 'Сфотографируйтесь анфас на светлом фоне'
  }
  return ''
})

function resolveOtpEmail() {
  return (otpEmail.value || form.email || readPendingOtpEmail()).trim()
}

function rememberOtpEmail(mail) {
  const value = String(mail || '').trim()
  otpEmail.value = value
  if (value) form.email = value
  writePendingOtpEmail(value)
}

function goAfterContactsOrOtp() {
  goToStep(photoLocked.value ? 5 : 4)
}

watch(
  () => form.noPatronymic,
  (checked) => {
    if (checked) form.patronymic = ''
  },
)


watch(otpCode, async (code) => {
  otpError.value = ''
  if (code.length === 6) {
    await verifyEmailCode()
  }
})

function onBirthdayInput(event) {
  form.birthday = maskBirthdayInput(event.target.value)
}

function onTelegramInput(value) {
  form.telegram = normalizeTelegramWithPrefix(value)
}

function onTelegramFocus(event) {
  if (!form.telegram || form.telegram === '') {
    form.telegram = '@'
  }
  const input = event?.target
  if (input instanceof HTMLInputElement) {
    requestAnimationFrame(() => {
      const len = form.telegram.length
      input.setSelectionRange(len, len)
    })
  }
}

function onPhoneLockedInteract() {
  phoneLockHint.value = true
}

function onChangeEmailFromOtp() {
  clearPendingOtpEmail()
  otpEmail.value = ''
  otpCode.value = ''
  otpError.value = ''
  goToStep(2)
}

function goToStep(n) {
  if (viewOnly.value) return
  formError.value = ''
  otpError.value = ''
  phoneLockHint.value = false
  nameTouched.value = false
  surnameTouched.value = false
  patronymicTouched.value = false
  birthdayTouched.value = false
  emailTouched.value = false
  telegramTouched.value = false
  let next = parsePersonalWizardStep(n)
  if (next === 4 && photoLocked.value) next = 5
  if (next === step.value) return
  void navigateTo(personalWizardPath(next), { replace: true })
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || step.value <= 1) {
    void navigateTo('/profile')
    return
  }
  // Явный шаг, не history.back(): после камеры/OTP/редиректов в истории
  // оказывается чужой URL → Nuxt/nginx «Page Not Found» на /profile/personal/1.
  let prev = step.value - 1
  if (prev === 4 && photoLocked.value) prev = 3
  void navigateTo(personalWizardPath(prev), { replace: true })
}

function enforceViewOnly(user) {
  const locked = isActivationStepLocked(user?.activation?.steps?.personal)
  viewOnly.value = locked
  if (locked && step.value !== PERSONAL_WIZARD_TOTAL) {
    void navigateTo(personalWizardPath(PERSONAL_WIZARD_TOTAL), { replace: true })
  }
}

function startResendCountdown(seconds = OTP_RESEND_COOLDOWN_SEC) {
  clearInterval(resendTimer)
  resendTimer = null
  const total = Math.max(0, Math.floor(seconds))
  if (total <= 0) {
    resendSeconds.value = 0
    writeOtpResendAt(0)
    return
  }
  writeOtpResendAt(Date.now() + total * 1000)
  resendSeconds.value = total
  resendTimer = setInterval(() => {
    const left = remainingOtpResendSeconds()
    resendSeconds.value = left
    if (left <= 0) {
      clearInterval(resendTimer)
      resendTimer = null
      writeOtpResendAt(0)
    }
  }, 250)
}

function restoreResendCountdown() {
  const left = remainingOtpResendSeconds()
  if (left > 0) startResendCountdown(left)
  else resendSeconds.value = 0
}

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function personalPayload() {
  return {
    name: form.name.trim(),
    surname: form.surname.trim(),
    patronymic: form.noPatronymic ? null : form.patronymic.trim() || null,
    gender: form.gender,
    birthday: birthdayToApi(form.birthday),
    telegram_username: sanitizeTelegramForSubmit(form.telegram),
  }
}

async function refreshPhotoFromApi() {
  try {
    const files = await getPassportFiles()
    const path = files?.file_agent_with_passport || files?.data?.file_agent_with_passport || null
    if (path) {
      form.photoServerPath = path
      form.photoPreviewUrl = getDocumentUrl(path)
    }
  } catch (err) {
    console.error('[personal-wizard] photo refresh failed', err)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function applyLoadedProfile(personal, user, pendingMail) {
  form.name = personal.name || user.name || form.name || ''
  form.surname = personal.surname || user.surname || form.surname || ''
  form.patronymic = personal.patronymic || user.patronymic || form.patronymic || ''
  form.noPatronymic = !String(form.patronymic || '').trim()
  form.gender = personal.gender || user.gender || form.gender || null
  form.birthday =
    birthdayFromApi(personal.birthday || user.data?.birthday) || form.birthday
  form.phone =
    normalizePhoneForRrInput(personal.phone || user.phone) || form.phone

  const apiEmail = String(personal.email || user.email || '').trim()
  const localEmail = form.email.trim() || pendingMail
  // Почта ещё не сохранена на бэке до OTP — не затираем локально введённую.
  form.email = apiEmail || localEmail
  initialEmail.value = apiEmail
  if (!otpEmail.value && pendingMail) otpEmail.value = pendingMail
  if (!otpEmail.value && form.email && step.value === 3) otpEmail.value = form.email

  form.telegram = normalizeTelegramWithPrefix(
    personal.telegram_username || user.telegram_username || form.telegram,
  )
  form.emailVerified = Boolean(apiEmail) && (!pendingMail || apiEmail === pendingMail)
}

async function loadInitial() {
  const maxAttempts = 3
  let lastErr = null

  const pendingMail = readPendingOtpEmail()
  if (pendingMail) {
    otpEmail.value = pendingMail
    if (!form.email.trim()) form.email = pendingMail
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [personalRes, userRes] = await Promise.all([getPersonalData(), getUserData()])
      const personal = personalRes || {}
      const user = userRes?.data ?? userRes ?? {}

      applyLoadedProfile(personal, user, pendingMail)

      const photoPath = user.data?.file_agent_with_passport || null
      if (photoPath) {
        form.photoServerPath = photoPath
        form.photoPreviewUrl = getDocumentUrl(photoPath)
      } else {
        await refreshPhotoFromApi()
      }

      enforceViewOnly(user)

      if (!viewOnly.value) {
        if (step.value === 3 && !resolveOtpEmail()) {
          void navigateTo(personalWizardPath(2), { replace: true })
        } else if (step.value === 5 && !form.photoServerPath) {
          void navigateTo(personalWizardPath(4), { replace: true })
        } else if (step.value === 4 && form.photoServerPath) {
          void navigateTo(personalWizardPath(5), { replace: true })
        }
      }

      const missingFio =
        !String(form.name || '').trim() && !String(form.surname || '').trim()
      // Частичный ответ (пол/дата есть, ФИО нет) — запрашиваем ещё раз.
      const gotPartialIdentity = Boolean(
        form.birthday || form.gender || form.phone || form.telegram,
      )
      if (missingFio && gotPartialIdentity && attempt < maxAttempts) {
        await sleep(400 * attempt)
        continue
      }

      formError.value = ''
      return
    } catch (err) {
      lastErr = err
      console.error(`[personal-wizard] load failed (attempt ${attempt}/${maxAttempts})`, err)
      if (attempt < maxAttempts) {
        await sleep(400 * attempt)
        continue
      }
    }
  }

  formError.value = apiError(lastErr, 'Не удалось загрузить данные профиля')
}

async function submitIdentity() {
  if (!canContinueIdentity.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    await submitContactData(personalPayload())
    goToStep(2)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить данные')
  } finally {
    busy.value = false
  }
}

async function sendEmailCode() {
  const mail = resolveOtpEmail() || form.email.trim()
  if (!mail) {
    otpError.value = 'Укажите почту'
    return false
  }
  formError.value = ''
  otpError.value = ''
  busy.value = true
  try {
    // Сначала бэкенд проверяет формат и занятость — письмо уходит только после этого.
    const res = await sendUserEmailCode(mail)
    if (res?.status === false) {
      otpError.value = res?.data || res?.message || 'Не удалось отправить код'
      return false
    }
    rememberOtpEmail(mail)
    otpCode.value = ''
    startResendCountdown(OTP_RESEND_COOLDOWN_SEC)
    return true
  } catch (err) {
    otpError.value = apiError(err, 'Не удалось отправить код')
    return false
  } finally {
    busy.value = false
  }
}

async function resendEmailCode() {
  if (busy.value || resendSeconds.value > 0) return
  await sendEmailCode()
}

async function startEmailConfirm() {
  if (!canContinueContacts.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    await submitContactData(personalPayload())

    if (!needsEmailVerification.value) {
      form.emailVerified = true
      clearPendingOtpEmail()
      goAfterContactsOrOtp()
      return
    }

    const mail = form.email.trim()
    const res = await sendUserEmailCode(mail)
    if (res?.status === false) {
      formError.value = res?.data || res?.message || 'Не удалось подтвердить почту'
      return
    }
    rememberOtpEmail(mail)
    otpCode.value = ''
    startResendCountdown(OTP_RESEND_COOLDOWN_SEC)
    goToStep(3)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось подтвердить почту')
  } finally {
    busy.value = false
  }
}

async function verifyEmailCode() {
  if (busy.value) return
  const mail = resolveOtpEmail()
  if (!mail) {
    otpError.value = 'Укажите почту'
    return
  }
  formError.value = ''
  otpError.value = ''
  busy.value = true
  try {
    const res = await sendUserEmailCodeVerify(mail, otpCode.value)
    if (res?.status === false) {
      otpError.value = res?.data || 'Неверный код'
      return
    }
    form.emailVerified = true
    form.email = mail
    initialEmail.value = mail
    clearPendingOtpEmail()
    otpEmail.value = ''
    goAfterContactsOrOtp()
  } catch (err) {
    otpError.value = apiError(err, 'Неверный код')
  } finally {
    busy.value = false
  }
}

function openPhotoPreview(url) {
  if (!url) return
  photoPreviewOpenUrl.value = url
}

function onReplaceFromPhotoPreview() {
  photoPreviewOpenUrl.value = ''
  openPhotoCamera()
}

function closePhotoCapture() {
  if (busy.value) return
  cameraOpen.value = false
  photoSeedFile.value = null
  photoCaptureSource.value = 'camera'
}

function openPhotoCamera() {
  if (photoLocked.value || busy.value) return
  formError.value = ''
  photoCaptureSource.value = 'camera'
  photoSeedFile.value = null
  cameraOpen.value = true
}

function openPhotoGallery() {
  if (photoLocked.value || busy.value) return
  formError.value = ''
  photoInputRef.value?.click()
}

function onPhotoReplace() {
  formError.value = ''
  photoInputRef.value?.click()
}

function onPhotoContinue() {
  if (photoLocked.value) {
    goToStep(5)
    return
  }
  if (!isPhotoStepValid(form)) return
  goToStep(5)
}

async function uploadProfilePhoto(file) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  const gen = actionGen
  try {
    const res = await uploadPassportDocuments(null, null, file, null, null, null)
    if (!isActionCurrent(gen)) return
    if (res?.status === false) {
      formError.value = res?.data || 'Не удалось загрузить фото'
      return
    }
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = URL.createObjectURL(file)
    form.photoFile = file
    form.photoPreviewUrl = localPreviewUrl
    await refreshPhotoFromApi()
    if (!isActionCurrent(gen)) return
    if (!form.photoServerPath) {
      formError.value = 'Не удалось подтвердить загрузку фото'
      return
    }
    closePhotoCapture()
    goToStep(5)
  } catch (err) {
    if (!isActionCurrent(gen)) return
    formError.value = apiError(err, 'Не удалось загрузить фото')
  } finally {
    if (isActionCurrent(gen)) busy.value = false
    else busy.value = false
  }
}

async function onCameraSave({ file }) {
  await uploadProfilePhoto(file)
}

async function onPhotoPicked(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!isAllowedUploadFile(file, 'image')) {
    formError.value = uploadRejectMessage('image')
    return
  }
  photoCaptureSource.value = 'file'
  photoSeedFile.value = file
  cameraOpen.value = true
}

async function submitForReview() {
  if (!form.dataConfirmed || busy.value) return
  if (!form.photoServerPath) {
    formError.value = 'Загрузите фото профиля'
    return
  }
  formError.value = ''
  busy.value = true
  try {
    await submitContactData(personalPayload())
    await navigateTo('/profile')
  } catch (err) {
    formError.value = apiError(err, 'Не удалось отправить данные')
  } finally {
    busy.value = false
  }
}


const skipNextActivateReload = ref(true)
let actionGen = 0

function bumpActionGen() {
  actionGen += 1
  return actionGen
}

function isActionCurrent(gen) {
  return gen === actionGen
}

onMounted(() => {
  restoreResendCountdown()
  void loadInitial()
})

onActivated(() => {
  restoreResendCountdown()
  if (skipNextActivateReload.value) {
    skipNextActivateReload.value = false
    return
  }
  void loadInitial()
})

onDeactivated(() => {
  bumpActionGen()
})

watch(step, (n) => {
  if (viewOnly.value) return
  if (n === 3) restoreResendCountdown()
  if (n === 4 && photoLocked.value) {
    void navigateTo(personalWizardPath(5), { replace: true })
  }
})

watch(photoLocked, (locked) => {
  if (viewOnly.value) return
  if (locked && step.value === 4) {
    void navigateTo(personalWizardPath(5), { replace: true })
  }
})

onBeforeUnmount(() => {
  bumpActionGen()
  clearInterval(resendTimer)
  resendTimer = null
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
})
</script>

<style scoped>
.profile-personal-wizard,
.profile-personal-wizard *,
.profile-personal-wizard *::before,
.profile-personal-wizard *::after {
  box-sizing: border-box;
}

.profile-personal-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-personal-wizard :deep(.profile-step-shell__footer) {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.ppw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}

.ppw-fio-group {
  display: flex;
  flex-direction: column;
}

.ppw-fio-label {
  margin: 0 0 var(--rr-spacing-padding-m);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-s);
  line-height: 140%;
  letter-spacing: 0;
  vertical-align: middle;
  color: #000000;
}

.ppw-fio-fields {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
}

.ppw-fio-group > :deep(.profile-rr-checkbox) {
  margin-top: var(--rr-spacing-padding-m);
}

.ppw-stack--otp {
  align-items: stretch;
  gap: var(--rr-spacing-padding-xl);
}

.ppw-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.9fr) 1.1fr;
  gap: var(--rr-spacing-padding-l);
  align-items: end;
}

.ppw-fio {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}

.ppw-hint,
.ppw-error {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.ppw-hint {
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.ppw-field-hint {
  margin: var(--rr-spacing-padding-s) 0 0;
  font-size: var(--rr-font-size-font-size-xs);
  line-height: var(--rr-line-height-line-height-xs);
  text-align: left;
  color: var(--rr-labels-neutral-secondary);
}

.ppw-error {
  color: var(--rr-labels-danger-primary);
  margin-top: var(--rr-spacing-padding-m);
}

.ppw-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 6px var(--rr-spacing-padding-m, 8px);
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--rr-button-brand-secondary-background-default, #e8edfc);
  color: var(--rr-button-brand-secondary-text-default, #1c4ae5);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
  text-align: center;
  cursor: pointer;
}

.ppw-link:hover {
  background: var(--rr-button-brand-secondary-background-hover, #d2dbfa);
}

.ppw-link:active {
  background: var(--rr-button-brand-secondary-background-active, #bbc9f7);
}

.ppw-examples {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--rr-spacing-padding-m);
  position: relative;
  z-index: 1;
  /* Небольшой внутренний отступ — правый бейдж не упирается в край скролл-контейнера. */
  padding: var(--rr-spacing-padding-s);
  box-sizing: border-box;
}

.ppw-example {
  min-width: 0;
}

.ppw-example__media {
  position: relative;
  z-index: 0;
  overflow: visible;
}

.ppw-example__frame {
  aspect-ratio: 3 / 4;
  border-radius: var(--rr-radius-l);
  overflow: hidden;
  background: var(--rr-backgrounds-quaternary, #f1f1f3);
}

.ppw-example__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ppw-example__badge {
  position: absolute;
  top: var(--rr-spacing-margin-neg-m);
  right: var(--rr-spacing-margin-neg-m);
  z-index: 2;
  width: 18px;
  height: 18px;
  display: block;
  pointer-events: none;
}

.ppw-example__label {
  margin: 6px 0 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xs);
  line-height: 12px;
  letter-spacing: var(--rr-tracking-tracking-s);
  text-align: center;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.ppw-example--ok .ppw-example__label {
  color: var(--rr-labels-success-primary);
}

.ppw-example--bad .ppw-example__label {
  color: var(--rr-labels-danger-primary);
}

.ppw-tips__title {
  margin: 0 0 var(--rr-spacing-padding-m);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 500;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-l);
  line-height: var(--rr-line-height-line-height-l);
  letter-spacing: var(--rr-tracking-tracking-l);
  text-align: center;
}

.ppw-tips__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}

.ppw-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rr-spacing-padding-xs);
  padding: var(--rr-spacing-padding-l) var(--rr-spacing-padding-m);
  border-radius: var(--rr-radius-l);
  background: var(--rr-backgrounds-quaternary, #f1f1f3);
  font-size: var(--rr-font-size-font-size-xs);
  line-height: 18px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.ppw-tip__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  width: var(--rr-size-m);
  height: var(--rr-size-m);
  border-radius: var(--rr-radius-m);
  background: var(--rr-backgrounds-primary);
  padding: var(--rr-spacing-padding-m);
}

.ppw-tip__icon img {
  display: block;
  width: var(--rr-size-m);
  height: var(--rr-size-m);
  object-fit: contain;
}

.ppw-tip__text {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 150px;
  white-space: pre-line;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xs);
  line-height: var(--rr-line-height-line-height-xs);
  letter-spacing: var(--rr-tracking-tracking-s);
  text-align: center;
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.ppw-help-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  align-self: flex-start;
  gap: var(--rr-spacing-padding-s);
  border: none;
  background: none;
  padding: 0;
  color: var(--rr-labels-brand-primary, #1C4AE5);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  cursor: pointer;
}

.ppw-help-link__icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.ppw-file-input {
  display: none;
}

.ppw-photo-locked {
  margin: 0;
  padding: var(--rr-spacing-padding-xl);
  border-radius: var(--rr-radius-l);
  background: var(--rr-backgrounds-quaternary, #f1f1f3);
  font-size: var(--rr-font-size-font-size-s);
  line-height: 22px;
  color: var(--rr-labels-neutral-primary, #101012);
  text-align: center;
}

.ppw-photo-locked--inline {
  text-align: left;
  padding: var(--rr-spacing-padding-l);
  font-size: var(--rr-font-size-font-size-s);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.ppw-photo-preview,
.ppw-review-photo {
  width: 120px;
  height: 120px;
  border-radius: var(--rr-radius-xl);
  overflow: hidden;
  background: var(--rr-backgrounds-tetriary);
}

.ppw-photo-preview img,
.ppw-review-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.ppw-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  padding-bottom: 0;
}

/* Review: единый фон fills, без затемнения readonly */
.ppw-review :deep(.auth-rr-input__control),
.ppw-review :deep(.auth-rr-input__control[readonly]),
.ppw-review :deep(.auth-rr-input__control:disabled) {
  background-color: var(--rr-input-background-fills, #F8F9FB);
  opacity: 1;
}

.ppw-review :deep(.auth-rr-input-phone),
.ppw-review :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input[readonly])),
.ppw-review :deep(.auth-rr-input-phone:has(.auth-rr-input-phone__input:disabled)) {
  background-color: var(--rr-input-background-fills, #F8F9FB);
  opacity: 1;
}

.ppw-review :deep(.profile-rr-gender__control) {
  background: var(--rr-input-background-fills, #F8F9FB);
}

.ppw-review :deep(.profile-rr-gender__option:disabled) {
  opacity: 1;
  cursor: default;
}

.ppw-card {
  padding: var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-primary);
}

.ppw-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--rr-spacing-padding-l);
}

.ppw-card__head h2 {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
}

.ppw-sheet-copy {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.ppw-sheet-copy__p {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  text-align: left;
  vertical-align: middle;
  color: var(--rr-labels-neutral-primary, #101012);
}

.ppw-store-links {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--rr-spacing-padding-m);
  width: 100%;
  /* gap родителя (m=8) + margin = 16px до бейджей */
  margin-top: calc(var(--rr-spacing-padding-xl) - var(--rr-spacing-padding-m));
}

.ppw-store-links__link {
  display: inline-flex;
  flex: 1 1 0;
  min-width: 0;
  line-height: 0;
  border-radius: var(--rr-radius-s);
  overflow: hidden;
}

.ppw-store-links__badge {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}
</style>
