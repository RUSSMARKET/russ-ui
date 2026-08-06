<template>
  <div class="profile-snils-wizard">
    <ProfileStepShell
      :current="step"
      :total="SNILS_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :hide-progress="viewOnly"
      @back="onBack"
    >
      <!-- Step 1: upload document -->
      <div v-if="step === 1" class="piw-stack">
        <div class="piw-hero">
          <img
            class="piw-hero__img piw-hero__img--snils"
            :src="exampleSnils"
            alt="Пример документа СНИЛС"
          />
        </div>

        <p class="piw-reqs">
          ФИО и номер СНИЛС должны хорошо читаться. Документ должен быть полностью в кадре, без бликов и теней
        </p>

        <button type="button" class="piw-help-link" @click="helpOpen = true">
          <img
            class="piw-help-link__icon"
            :src="helpCircleIcon"
            alt=""
            width="20"
            height="20"
            aria-hidden="true"
          />
          Где найти СНИЛС
        </button>

        <input
          ref="fileInputRef"
          class="piw-file-input"
          type="file"
          accept="image/*"
          @change="onFilePicked"
        />
      </div>

      <!-- Step 2: SNILS number -->
      <div v-else-if="step === 2" class="piw-stack">
        <AuthRRField label="Номер СНИЛС" :error="snilsFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!snilsFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="123-456-789 00"
            maxlength="14"
            :value="form.snils"
            :aria-invalid="!!snilsFieldError"
            @input="onSnilsInput"
            @blur="snilsTouched = true"
          />
        </AuthRRField>
      </div>

      <!-- Step 3: review -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          alt="Фото СНИЛС"
          @click="openPreview(reviewPhotoUrl)"
        />

        <AuthRRField label="Номер СНИЛС" :error="snilsFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!snilsFieldError }"
            type="text"
            inputmode="numeric"
            maxlength="14"
            :value="form.snils"
            :readonly="viewOnly"
            :aria-invalid="!!snilsFieldError"
            @input="onSnilsInput"
            @blur="snilsTouched = true"
          />
        </AuthRRField>

        <ProfileRrCheckbox
          v-if="!viewOnly"
          v-model="form.dataConfirmed"
          label="Данные верны"
        />
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile')" />
        </template>
        <template v-else-if="step === 1">
          <AuthRRButton
            label="Продолжить"
            :loading="busy"
            @click="onStep1Continue"
          />
          <AuthRRButton
            variant="brand-secondary"
            :label="hasUploadedPhoto ? 'Загрузить заново' : 'Загрузить файл'"
            :disabled="busy"
            @click="openFilePicker"
          />
        </template>
        <AuthRRButton
          v-else-if="!viewOnly && step === 2"
          label="Продолжить"
          :disabled="!canContinueSnils"
          :loading="busy"
          @click="submitSnilsStep"
        />
        <AuthRRButton
          v-else-if="!viewOnly"
          label="Отправить на проверку"
          :disabled="!canSubmit"
          :loading="busy"
          @click="submitForReview"
        />
        <p v-if="formError" class="piw-error" role="alert">{{ formError }}</p>
      </template>
    </ProfileStepShell>

    <PassportCameraCapture
      v-if="cameraOpen"
      variant="snils"
      :source="captureSource"
      :seed-file="captureSeedFile"
      :saving="busy"
      @close="closeCapture"
      @save="onCameraSave"
      @replace="onCaptureReplace"
    />

    <ProfileBottomSheet
      v-model="helpOpen"
      :height-percent="helpSheetHeightPercent"
      title="Где найти СНИЛС"
      subtitle="Проверьте, хорошо ли все видно"
      title-id="psw-sheet-title"
    >
      <ul class="piw-ways" role="list">
        <li v-for="way in findWays" :key="way.title" class="piw-way">
          <span class="piw-way__num" aria-hidden="true">{{ way.num }}</span>
          <span class="piw-way__text">
            <span class="piw-way__title">{{ way.title }}</span>
            <span class="piw-way__desc">{{ way.desc }}</span>
          </span>
        </li>
      </ul>

      <template #footer>
        <AuthRRButton label="Понятно" @click="helpOpen = false" />
      </template>
    </ProfileBottomSheet>

    <ProfilePhotoReviewOverlay
      v-if="previewUrl"
      :src="previewUrl"
      alt="Просмотр фото"
      aria-label="Просмотр фото"
      :show-secondary="!viewOnly"
      secondary-label="Заменить"
      primary-label="Готово"
      @close="previewUrl = ''"
      @primary="previewUrl = ''"
      @secondary="onReplaceFromPreview"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  SNILS_WIZARD_TOTAL,
  createEmptySnilsForm,
  getSnilsFieldError,
  snilsDigits,
  snilsWizardPath,
  isSnilsPhotoValid,
  isSnilsReadyToSubmit,
  isSnilsValid,
  maskSnils,
  parseSnilsWizardStep,
} from './lib/snilsWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import {
  isAllowedUploadFile,
  uploadRejectMessage,
} from './lib/documentMedia'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfileBottomSheet from './personal/ProfileBottomSheet.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleSnils from './assets/activation/snils-examples/example-snils.webp'
import helpCircleIcon from './assets/activation/help-circle-contained.svg'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getPassportData,
  getPassportFiles,
  SubmitPassportData,
  uploadPassportDocuments,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
  /** Высота help-sheet в % экрана (20–100). */
  helpSheetHeightPercent: { type: Number, default: 72 },
})

const step = computed(() => parseSnilsWizardStep(props.step))
const busy = ref(false)
const formError = ref('')
const viewOnly = ref(false)
const form = reactive(createEmptySnilsForm())
const snilsTouched = ref(false)
const snilsFieldError = computed(() => getSnilsFieldError(form.snils, snilsTouched.value))
const helpOpen = ref(false)
const cameraOpen = ref(false)
const captureSource = ref('camera')
const captureSeedFile = ref(null)
const previewUrl = ref('')
const fileInputRef = ref(null)
const initialLoaded = ref(false)
/** После «Назад» со шага формы не автоперескакиваем снова на шаг 2. */
const allowPhotoStepRevisit = ref(false)

let photoPreviewObjectUrl = null

const findWays = [
  {
    num: '1',
    title: 'Зелёная карточка СНИЛС',
    desc: 'Если она сохранилась, сделайте фото лицевой стороны целиком',
  },
  {
    num: '2',
    title: 'Скачать на сайте СФР',
    desc: 'Личный кабинет →\u00A0Получить дубликат СНИЛС →\u00A0Скачать уведомление АДИ-РЕГ',
  },
  {
    num: '3',
    title: 'В приложении Госуслуги',
    desc: 'Профиль →\u00A0Документы →\u00A0Личные документы →\u00A0СНИЛС',
  },
]

const canContinueSnils = computed(() => isSnilsValid(form))
const canSubmit = computed(() => isSnilsReadyToSubmit(form))
const hasUploadedPhoto = computed(() => isSnilsPhotoValid(form))

const shellTitle = computed(() => {
  if (viewOnly.value) return 'СНИЛС'
  if (step.value === 1) return 'Загрузите документ СНИЛС'
  if (step.value === 2) return 'Введите номер СНИЛС'
  return 'Проверьте данные'
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) return 'Сфотографируйте или загрузите готовый файл'
  if (step.value === 2) return '11 цифр из свидетельства'
  return ''
})

const reviewPhotoUrl = computed(() => {
  if (form.photoPreviewUrl) return form.photoPreviewUrl
  if (form.photoServerPath) return getDocumentUrl(form.photoServerPath)
  return ''
})

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = true } = {}) {
  if (viewOnly.value && parseSnilsWizardStep(n) !== SNILS_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseSnilsWizardStep(n)
  if (next === step.value) return
  void navigateTo(snilsWizardPath(next), replace ? { replace: true } : undefined)
}

/** Уже выгруженное фото не показываем — сразу к номеру. */
function skipCompletedPhotoStep() {
  if (!initialLoaded.value || busy.value || viewOnly.value || allowPhotoStepRevisit.value) return
  if (step.value === 1 && isSnilsPhotoValid(form)) {
    goToStep(2, { replace: true })
  }
}

function onBack() {
  if (busy.value) return
  if (viewOnly.value || step.value <= 1) {
    void navigateTo('/profile')
    return
  }
  allowPhotoStepRevisit.value = true
  void navigateTo(snilsWizardPath(step.value - 1), { replace: true })
}

function enforceViewOnly(user) {
  const locked = isActivationStepLocked(user?.activation?.steps?.snils)
  viewOnly.value = locked
  if (locked && step.value !== SNILS_WIZARD_TOTAL) {
    void navigateTo(snilsWizardPath(SNILS_WIZARD_TOTAL), { replace: true })
  }
}

function onSnilsInput(event) {
  if (viewOnly.value) return
  form.snils = maskSnils(event.target.value)
}

function openPreview(url) {
  if (url) previewUrl.value = url
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function closeCapture() {
  if (busy.value) return
  cameraOpen.value = false
  captureSeedFile.value = null
  captureSource.value = 'camera'
}

function openCameraCapture() {
  formError.value = ''
  captureSource.value = 'camera'
  captureSeedFile.value = null
  cameraOpen.value = true
}

function onStep1Continue() {
  if (isSnilsPhotoValid(form)) {
    goToStep(2)
    return
  }
  openCameraCapture()
}

function onReplaceFromPreview() {
  previewUrl.value = ''
  openCameraCapture()
}

function onCaptureReplace() {
  formError.value = ''
  openFilePicker()
}

async function uploadSnilsFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
  photoPreviewObjectUrl = localUrl
  form.photoFile = file
  form.photoPreviewUrl = localUrl
  await uploadPassportDocuments(null, null, null, null, file, null)
  const files = await getPassportFiles()
  const fileRow = files?.data || files || {}
  form.photoServerPath = fileRow.file_snils || null
}

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  const gen = actionGen
  try {
    await uploadSnilsFile(file)
    if (!isActionCurrent(gen)) return
    if (!form.photoServerPath) {
      formError.value = 'Не удалось подтвердить загрузку фото СНИЛС'
      return
    }
    closeCapture()
    goToStep(2)
  } catch (err) {
    if (!isActionCurrent(gen)) return
    formError.value = apiError(err, 'Не удалось загрузить фото СНИЛС')
  } finally {
    busy.value = false
  }
}

async function onFilePicked(event) {
  const input = event.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file || busy.value) return
  formError.value = ''
  if (!isAllowedUploadFile(file, 'image')) {
    formError.value = uploadRejectMessage('image')
    return
  }
  captureSource.value = 'file'
  captureSeedFile.value = file
  cameraOpen.value = true
}

function buildPayload() {
  const payload = {
    snils: snilsDigits(form.snils),
  }
  // Backend requires full passport set on every personal-data PUT
  if (form.passport) payload.passport = form.passport
  if (form.passportIssued) payload.passport_issued = form.passportIssued
  if (form.passportDate) payload.passport_date = form.passportDate
  if (form.passportCode) payload.passport_code = form.passportCode
  if (form.birthday) payload.birthday = form.birthday
  if (form.birthdayPlace) payload.birthday_place = form.birthdayPlace
  if (form.registrationAddress) payload.registration_address = form.registrationAddress
  if (form.inn) payload.inn = form.inn
  if (form.bankAccount) payload.bank_account = form.bankAccount
  if (form.bankBik) payload.bank_bik = form.bankBik
  if (form.bankName) payload.bank_name = form.bankName
  return payload
}

async function submitSnilsStep() {
  if (!canContinueSnils.value || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    goToStep(3)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить номер СНИЛС')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  if (!isSnilsPhotoValid(form)) {
    formError.value = 'Загрузите фото документа СНИЛС'
    return
  }
  if (!isSnilsValid(form)) {
    formError.value = 'Укажите 11 цифр СНИЛС'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    await navigateTo('/profile')
  } catch (err) {
    formError.value = apiError(err, 'Не удалось отправить данные')
  } finally {
    busy.value = false
  }
}

async function loadInitial() {
  try {
    const [data, files, userRes] = await Promise.all([
      getPassportData(),
      getPassportFiles(),
      getUserData(),
    ])
    const row = data?.data || data || {}
    form.snils = maskSnils(row.snils || '')
    form.passport = row.passport || ''
    form.passportIssued = row.passport_issued || ''
    form.passportDate = row.passport_date || ''
    form.passportCode = row.passport_code || ''
    form.birthday = row.birthday || ''
    form.birthdayPlace = row.birthday_place || ''
    form.registrationAddress = row.registration_address || ''
    form.inn = row.inn || ''
    form.bankAccount = row.bank_account || ''
    form.bankBik = row.bank_bik || ''
    form.bankName = row.bank_name || ''

    const fileRow = files?.data || files || {}
    if (fileRow.file_snils) {
      form.photoServerPath = fileRow.file_snils
      form.photoPreviewUrl = getDocumentUrl(fileRow.file_snils)
      form.photoFile = null
    } else {
      form.photoServerPath = null
      form.photoPreviewUrl = null
      form.photoFile = null
      if (photoPreviewObjectUrl) {
        URL.revokeObjectURL(photoPreviewObjectUrl)
        photoPreviewObjectUrl = null
      }
    }

    enforceViewOnly(userRes?.data ?? userRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить данные СНИЛС')
    console.error('[snils-wizard] load failed', err)
  } finally {
    initialLoaded.value = true
    skipCompletedPhotoStep()
  }
}

function resetLocalState() {
  formError.value = ''
  helpOpen.value = false
  closeCapture()
  previewUrl.value = ''
  allowPhotoStepRevisit.value = false
  form.dataConfirmed = false
  if (photoPreviewObjectUrl) {
    URL.revokeObjectURL(photoPreviewObjectUrl)
    photoPreviewObjectUrl = null
  }
  Object.assign(form, createEmptySnilsForm())
  initialLoaded.value = false
}

watch(
  () => step.value,
  () => {
    skipCompletedPhotoStep()
  },
)


onMounted(() => {
  void loadInitial()
})

const skipNextActivateReload = ref(true)
let actionGen = 0

function isActionCurrent(gen) {
  return gen === actionGen
}

function bumpActionGen() {
  actionGen += 1
}

onActivated(() => {
  let forceReload = false
  try {
    forceReload = Boolean(
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('profile-data-cleared-at'),
    )
    if (forceReload) sessionStorage.removeItem('profile-data-cleared-at')
  } catch {
    /* ignore */
  }

  if (skipNextActivateReload.value && !forceReload) {
    skipNextActivateReload.value = false
    return
  }
  skipNextActivateReload.value = false
  resetLocalState()
  void loadInitial()
})

onDeactivated(() => {
  bumpActionGen()
})

onBeforeUnmount(() => {
  bumpActionGen()
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
})
</script>

<style scoped>
.profile-snils-wizard,
.profile-snils-wizard *,
.profile-snils-wizard *::before,
.profile-snils-wizard *::after {
  box-sizing: border-box;
}

.profile-snils-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-snils-wizard :deep(.profile-step-shell__footer) {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.piw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}

.piw-hero {
  display: grid;
  place-items: center;
  padding: var(--rr-spacing-padding-2-xl) var(--rr-spacing-padding-xl);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-brand-secondary-default);
  overflow: hidden;
}

.piw-hero__img {
  display: block;
  width: 100%;
  max-width: 160px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
  box-shadow: 0 var(--rr-spacing-padding-m) var(--rr-spacing-padding-3-xl) var(--rr-fx-shadow-major);
}

.piw-hero__img--snils {
  max-width: 100%;
  box-shadow: none;
  border-radius: 0;
}

.piw-reqs {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0);
  color: var(--rr-labels-neutral-primary, #101012);
  text-align: left;
}

.piw-help-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--rr-spacing-padding-m);
  align-self: flex-start;
  border: none;
  background: none;
  padding: var(--rr-spacing-padding-s) 0;
  color: var(--rr-labels-brand-primary);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  cursor: pointer;
}

.piw-help-link__icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.piw-file-input {
  display: none;
}

.piw-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}


.piw-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.piw-ways {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

.piw-way {
  display: flex;
  gap: var(--rr-spacing-padding-l);
  align-items: flex-start;
  padding: 14px var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-secondary);
}

.piw-way__num {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: var(--rr-size-2-xl);
  height: var(--rr-size-2-xl);
  border-radius: var(--rr-radius-full);
  background: var(--rr-fills-brand-primary);
  color: var(--rr-labels-brand-primary);
  font-size: 19.2px;
  font-weight: 500;
  line-height: 19.2px;
  letter-spacing: -0.4px;
}

.piw-way__text {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xs);
  min-width: 0;
}

.piw-way__title {
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: var(--rr-labels-neutral-primary);
}

.piw-way__desc {
  font-size: var(--rr-font-size-font-size-xs);
  font-weight: 400;
  line-height: var(--rr-line-height-line-height-xs);
  letter-spacing: var(--rr-tracking-tracking-s);
  color: var(--rr-labels-neutral-secondary);
}
</style>
