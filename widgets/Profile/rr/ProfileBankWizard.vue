<template>
  <div class="profile-bank-wizard">
    <ProfileStepShell
      :current="step"
      :total="BANK_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :hide-progress="viewOnly"
      @back="onBack"
    >
      <!-- Step 1: upload -->
      <div v-if="step === 1" class="piw-stack">
        <div class="piw-hero piw-hero--example">
          <img
            class="piw-hero__img piw-hero__img--bank"
            :src="exampleBank"
            alt="Пример банковских реквизитов"
          />
        </div>

        <p class="piw-reqs">
          БИК, номер счёта и ФИО получателя должны читаться
        </p>

        <button type="button" class="piw-help-link piw-help-link--start" @click="helpOpen = true">
          <img
            class="piw-help-link__icon"
            :src="helpCircleIcon"
            alt=""
            width="20"
            height="20"
            aria-hidden="true"
          />
          Где найти реквизиты
        </button>

        <input
          ref="fileInputRef"
          class="piw-file-input"
          type="file"
          accept="image/*,application/pdf"
          @change="onFilePicked"
        />
      </div>

      <!-- Step 2: form -->
      <div v-else class="piw-review">
        <ProfileDocThumb
          :src="reviewPhotoUrl"
          :is-pdf="form.photoIsPdf"
          alt="Банковские реквизиты"
          pdf-label="Реквизиты"
          empty-text="Нет файла"
          @click="openPreview(reviewPhotoUrl)"
        />

        <AuthRRField label="БИК банка" :error="bikFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bikFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="9 цифр"
            maxlength="9"
            :value="form.bankBik"
            :readonly="viewOnly"
            :aria-invalid="!!bikFieldError"
            @input="onBikInput"
            @blur="bikTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Расчётный счёт" :error="accountFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!accountFieldError }"
            type="text"
            inputmode="numeric"
            placeholder="20 цифр"
            maxlength="20"
            :value="form.bankAccount"
            :readonly="viewOnly"
            :aria-invalid="!!accountFieldError"
            @input="onAccountInput"
            @blur="accountTouched = true"
          />
        </AuthRRField>

        <AuthRRField label="Название банка" :error="bankNameFieldError">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            :class="{ 'auth-rr-input__control--error': !!bankNameFieldError }"
            type="text"
            placeholder="Например, ПАО Сбербанк"
            maxlength="255"
            :value="form.bankName"
            :readonly="viewOnly"
            :aria-invalid="!!bankNameFieldError"
            @input="onBankNameInput"
            @blur="bankNameTouched = true"
          />
        </AuthRRField>

        <ProfileRrCheckbox v-if="!viewOnly" v-model="form.dataConfirmed" label="Данные верны" />
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile')" />
        </template>
        <template v-else-if="step === 1">
          <AuthRRButton
            :label="hasUploadedPhoto ? 'Продолжить' : 'Сфотографировать'"
            :loading="busy"
            @click="onStep1Primary"
          />
          <AuthRRButton
            variant="brand-secondary"
            :label="hasUploadedPhoto ? 'Загрузить заново' : 'Загрузить файл'"
            :disabled="busy"
            @click="openFilePicker"
          />
        </template>
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
      variant="bank"
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
      title="Как найти реквизиты"
      subtitle="В приложении вашего банка"
      title-id="pbw-sheet-title"
    >
      <ul class="piw-ways" role="list">
        <li v-for="way in findWays" :key="way.num" class="piw-way">
          <span class="piw-way__num" aria-hidden="true">{{ way.num }}</span>
          <span class="piw-way__text">
            <span class="piw-way__title">{{ way.title }}</span>
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
      :is-pdf="previewIsPdf"
      alt="Просмотр"
      aria-label="Просмотр документа"
      pdf-label="Открыть PDF"
      :show-secondary="!viewOnly"
      secondary-label="Заменить"
      primary-label="Готово"
      @close="closePreview"
      @primary="closePreview"
      @secondary="onReplaceFromPreview"
    />
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import { getBankAccountValidationError } from 'bibli/shared/utils/russianBankAccount'
import {
  BANK_WIZARD_TOTAL,
  bankAccountDigits,
  bankBikDigits,
  bankWizardPath,
  createEmptyBankForm,
  getBankAccountFieldError,
  getBankBikFieldError,
  getBankNameFieldError,
  isBankPhotoValid,
  isBankReadyToSubmit,
  parseBankWizardStep,
} from './lib/bankWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import {
  isAllowedUploadFile,
  isImageFile,
  isPdfFile,
  isPdfSource,
  uploadRejectMessage,
} from './lib/documentMedia'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import ProfileBottomSheet from './personal/ProfileBottomSheet.vue'
import ProfilePhotoReviewOverlay from './personal/ProfilePhotoReviewOverlay.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleBank from './assets/activation/bank-examples/example-bank.webp'
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
  helpSheetHeightPercent: { type: Number, default: 72 },
})

const step = computed(() => parseBankWizardStep(props.step))
const busy = ref(false)
const formError = ref('')
const viewOnly = ref(false)
const form = reactive(createEmptyBankForm())
const helpOpen = ref(false)
const cameraOpen = ref(false)
const captureSource = ref('camera')
const captureSeedFile = ref(null)
const previewUrl = ref('')
const previewIsPdf = ref(false)
const fileInputRef = ref(null)
const initialLoaded = ref(false)
/** После «Назад» со шага формы не автоперескакиваем снова на шаг 2. */
const allowPhotoStepRevisit = ref(false)
const bikTouched = ref(false)
const accountTouched = ref(false)
const bankNameTouched = ref(false)

let photoPreviewObjectUrl = null

const findWays = [
  { num: '1', title: 'Откройте приложение банка' },
  { num: '2', title: 'Найдите ваш счёт или карту' },
  { num: '3', title: 'Откройте «Реквизиты» или «Для перевода»' },
  { num: '4', title: 'Сделайте скриншот или сохраните PDF' },
]

const canSubmit = computed(() => isBankReadyToSubmit(form))
const hasUploadedPhoto = computed(() => isBankPhotoValid(form))
const bikFieldError = computed(() =>
  getBankBikFieldError(form.bankBik, form.bankAccount, bikTouched.value),
)

const accountFieldError = computed(() =>
  getBankAccountFieldError(form.bankAccount, form.bankBik, accountTouched.value),
)
const bankNameFieldError = computed(() =>
  getBankNameFieldError(form.bankName, bankNameTouched.value),
)

const shellTitle = computed(() => {
  if (viewOnly.value) return 'Банковские реквизиты'
  if (step.value === 1) return 'Сделайте фото банковских реквизитов'
  return 'Введите реквизиты'
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) return 'Из приложения банка или с бумажной справки'
  return 'Перепишите с фото, которое сделали'
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
  if (viewOnly.value && parseBankWizardStep(n) !== BANK_WIZARD_TOTAL) return
  formError.value = ''
  const next = parseBankWizardStep(n)
  if (next === step.value) return
  void navigateTo(bankWizardPath(next), replace ? { replace: true } : undefined)
}

/** Уже выгруженное фото не показываем — сразу к реквизитам. */
function skipCompletedPhotoStep() {
  if (!initialLoaded.value || busy.value || viewOnly.value || allowPhotoStepRevisit.value) return
  if (step.value === 1 && isBankPhotoValid(form)) {
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
  void navigateTo(bankWizardPath(step.value - 1), { replace: true })
}

function enforceViewOnly(user) {
  const locked = isActivationStepLocked(user?.activation?.steps?.bank)
  viewOnly.value = locked
  if (locked && step.value !== BANK_WIZARD_TOTAL) {
    void navigateTo(bankWizardPath(BANK_WIZARD_TOTAL), { replace: true })
  }
}

function onBikInput(event) {
  if (viewOnly.value) return
  form.bankBik = bankBikDigits(event.target.value)
}

function onAccountInput(event) {
  if (viewOnly.value) return
  form.bankAccount = bankAccountDigits(event.target.value)
}

function onBankNameInput(event) {
  if (viewOnly.value) return
  form.bankName = String(event.target.value || '')
}

function closePreview() {
  previewUrl.value = ''
  previewIsPdf.value = false
}

function openPreview(url) {
  if (!url) return
  previewIsPdf.value = isPdfSource(url, form.photoFile) || form.photoIsPdf
  previewUrl.value = url
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

function onStep1Primary() {
  if (isBankPhotoValid(form)) {
    goToStep(2)
    return
  }
  openCameraCapture()
}

function onCaptureReplace() {
  formError.value = ''
  openFilePicker()
}

function onReplaceFromPreview() {
  if (busy.value || viewOnly.value) return
  closePreview()
  const isPdf =
    form.photoIsPdf || isPdfSource(form.photoPreviewUrl, form.photoFile, form.photoServerPath)
  if (isPdf) {
    openFilePicker()
    return
  }
  openCameraCapture()
}

async function uploadBankFile(file) {
  const localUrl = URL.createObjectURL(file)
  if (photoPreviewObjectUrl) URL.revokeObjectURL(photoPreviewObjectUrl)
  photoPreviewObjectUrl = localUrl
  form.photoFile = file
  form.photoPreviewUrl = localUrl
  form.photoIsPdf = isPdfFile(file)
  await uploadPassportDocuments(null, null, null, null, null, file)
  const files = await getPassportFiles()
  const fileRow = files?.data || files || {}
  form.photoServerPath = fileRow.file_banking_details || null
}

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  const gen = actionGen
  try {
    await uploadBankFile(file)
    if (!isActionCurrent(gen)) return
    if (!form.photoServerPath) {
      formError.value = 'Не удалось подтвердить загрузку файла реквизитов'
      return
    }
    closeCapture()
    if (step.value < 2) goToStep(2)
  } catch (err) {
    if (!isActionCurrent(gen)) return
    formError.value = apiError(err, 'Не удалось загрузить фото реквизитов')
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

  if (!isAllowedUploadFile(file, 'image-or-pdf')) {
    formError.value = uploadRejectMessage('image-or-pdf')
    return
  }

  if (isPdfFile(file)) {
    busy.value = true
    const gen = actionGen
    try {
      await uploadBankFile(file)
      if (!isActionCurrent(gen)) return
      if (!form.photoServerPath) {
        formError.value = 'Не удалось подтвердить загрузку файла реквизитов'
        return
      }
      if (step.value < 2) goToStep(2)
    } catch (err) {
      if (!isActionCurrent(gen)) return
      formError.value = apiError(err, 'Не удалось загрузить файл реквизитов')
    } finally {
      busy.value = false
    }
    return
  }

  if (!isImageFile(file)) {
    formError.value = uploadRejectMessage('image-or-pdf')
    return
  }

  captureSource.value = 'file'
  captureSeedFile.value = file
  cameraOpen.value = true
}

function buildPayload() {
  return {
    bank_bik: bankBikDigits(form.bankBik),
    bank_account: bankAccountDigits(form.bankAccount),
    bank_name: form.bankName.trim(),
  }
}

async function submitForReview() {
  if (!canSubmit.value || busy.value) return
  formError.value = ''
  bikTouched.value = true
  accountTouched.value = true
  if (!isBankPhotoValid(form)) {
    formError.value = 'Загрузите фото банковских реквизитов'
    return
  }
  const fieldError = getBankAccountValidationError(form.bankAccount, form.bankBik)
  if (fieldError) {
    formError.value = fieldError
    return
  }
  if (!form.bankName.trim()) {
    formError.value = 'Укажите название банка'
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
    form.bankBik = bankBikDigits(row.bank_bik || '')
    form.bankAccount = bankAccountDigits(row.bank_account || '')
    form.bankName = row.bank_name || ''

    const fileRow = files?.data || files || {}
    if (fileRow.file_banking_details) {
      form.photoServerPath = fileRow.file_banking_details
      form.photoPreviewUrl = getDocumentUrl(fileRow.file_banking_details)
      form.photoFile = null
      form.photoIsPdf = isPdfSource(
        form.photoPreviewUrl,
        null,
        fileRow.file_banking_details,
      )
    } else {
      form.photoServerPath = null
      form.photoPreviewUrl = null
      form.photoFile = null
      form.photoIsPdf = false
      if (photoPreviewObjectUrl) {
        URL.revokeObjectURL(photoPreviewObjectUrl)
        photoPreviewObjectUrl = null
      }
    }

    enforceViewOnly(userRes?.data ?? userRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить банковские данные')
    console.error('[bank-wizard] load failed', err)
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
  previewIsPdf.value = false
  allowPhotoStepRevisit.value = false
  form.dataConfirmed = false
  if (photoPreviewObjectUrl) {
    URL.revokeObjectURL(photoPreviewObjectUrl)
    photoPreviewObjectUrl = null
  }
  Object.assign(form, createEmptyBankForm())
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
.profile-bank-wizard,
.profile-bank-wizard *,
.profile-bank-wizard *::before,
.profile-bank-wizard *::after {
  box-sizing: border-box;
}

.profile-bank-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.profile-bank-wizard :deep(.profile-step-shell__footer) {
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

.piw-hero--example {
  align-items: end;
  justify-items: center;
  min-height: 220px;
  padding-top: var(--rr-spacing-padding-3-xl);
  padding-bottom: 0;
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

.piw-hero__img--bank {
  max-width: 240px;
  margin: 0;
  border-radius: var(--rr-radius-m) var(--rr-radius-m) 0 0;
  box-shadow: 0 var(--rr-spacing-padding-s) var(--rr-spacing-padding-2-xl) var(--rr-fx-shadow-major);
  object-position: bottom center;
}

.piw-reqs {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: var(--rr-labels-neutral-primary);
  text-align: left;
}

.piw-help-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--rr-spacing-padding-m);
  align-self: center;
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

.piw-help-link--start {
  align-self: flex-start;
  justify-content: flex-start;
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
  align-items: center;
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
</style>
