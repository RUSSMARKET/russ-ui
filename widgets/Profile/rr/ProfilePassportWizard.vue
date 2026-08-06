<template>
  <div class="profile-passport-wizard">
    <ProfileStepShell
      :current="step"
      :total="PASSPORT_WIZARD_TOTAL"
      :title="shellTitle"
      :subtitle="shellSubtitle"
      :step-text="step === 4 ? '4 из 4' : ''"
      :hide-progress="viewOnly"
      @back="onBack"
    >
      <!-- Step 1: main passport photo -->
      <div v-if="step === 1" class="ppw-stack">
        <div class="ppass-hero">
          <img
            class="ppass-hero__img"
            :src="exampleMain"
            alt="Пример фото главной страницы паспорта"
          />
        </div>
        <div class="ppass-tips">
          <h2 class="ppass-tips__title">Советы</h2>
          <div class="ppass-tips__grid">
            <div v-for="tip in photoTips" :key="tip.label" class="ppass-tip">
              <span class="ppass-tip__icon" aria-hidden="true">
                <img :src="tip.icon" alt="" width="16" height="16" />
              </span>
              <span class="ppass-tip__text">{{ tip.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: registration page photo -->
      <div v-else-if="step === 2" class="ppw-stack">
        <div class="ppass-hero">
          <img
            class="ppass-hero__img ppass-hero__img--reg"
            :src="exampleReg"
            alt="Пример фото страницы регистрации"
          />
        </div>
        <div class="ppass-tips">
          <h2 class="ppass-tips__title">Советы</h2>
          <div class="ppass-tips__grid">
            <div v-for="tip in regTips" :key="tip.label" class="ppass-tip">
              <span class="ppass-tip__icon" aria-hidden="true">
                <img :src="tip.icon" alt="" width="16" height="16" />
              </span>
              <span class="ppass-tip__text">{{ tip.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: form -->
      <div v-else-if="step === 3" class="ppw-stack ppass-form">
        <AuthRRField label="Серия и номер">
          <input
            class="auth-rr-input__control auth-rr-input__control--align-left"
            type="text"
            inputmode="numeric"
            placeholder="0000 000000"
            maxlength="11"
            :value="form.passport"
            @input="onPassportInput"
          />
        </AuthRRField>

        <div class="ppass-row">
          <AuthRRField label="Дата выдачи">
            <input
              class="auth-rr-input__control auth-rr-input__control--align-left"
              type="text"
              inputmode="numeric"
              placeholder="ДД.ММ.ГГГГ"
              maxlength="10"
              :value="form.passportDate"
              @input="onPassportDateInput"
            />
          </AuthRRField>
          <AuthRRField label="Код подразделения">
            <input
              class="auth-rr-input__control auth-rr-input__control--align-left"
              type="text"
              inputmode="numeric"
              placeholder="000-000"
              maxlength="7"
              :value="form.passportCode"
              @input="onPassportCodeInput"
            />
          </AuthRRField>
        </div>

        <AuthRRField label="Кем выдан">
          <div class="ppass-issued">
            <select
              v-if="!form.issuedManual"
              v-model="form.passportIssued"
              class="auth-rr-input__control auth-rr-input__control--align-left ppass-select"
            >
              <option disabled value="">Выберите вариант</option>
              <option v-for="name in issuedOptions" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
            <input
              v-else
              v-model="form.passportIssued"
              class="auth-rr-input__control auth-rr-input__control--align-left"
              type="text"
              placeholder="Кем выдан"
              autocomplete="off"
            />
          </div>
        </AuthRRField>

        <ProfileRrCheckbox v-model="form.issuedManual" label="Моего варианта нет" />

        <AuthRRField label="Место рождения">
          <input
            v-model="form.birthdayPlace"
            class="auth-rr-input__control auth-rr-input__control--align-left"
            type="text"
            placeholder="Место рождения"
            autocomplete="off"
          />
        </AuthRRField>

        <AuthRRField label="Адрес регистрации">
          <input
            v-model="form.registrationAddress"
            class="auth-rr-input__control auth-rr-input__control--align-left"
            type="text"
            placeholder="Адрес регистрации"
            autocomplete="street-address"
          />
        </AuthRRField>

        <ProfileRrCheckbox
          v-model="form.sameAsResidence"
          label="Адрес регистрации совпадает с проживанием"
        />

        <AuthRRField v-if="!form.sameAsResidence" label="Адрес фактического проживания">
          <input
            v-model="form.residenceAddress"
            class="auth-rr-input__control auth-rr-input__control--align-left"
            type="text"
            placeholder="Адрес фактического проживания"
            autocomplete="street-address"
          />
        </AuthRRField>
      </div>

      <!-- Step 4: review -->
      <div v-else class="ppass-review">
        <section class="ppass-card">
          <header class="ppass-card__head">
            <h2>Фото документов</h2>
          </header>
          <div class="ppass-docs">
            <ProfileDocThumb
              v-for="doc in reviewDocs"
              :key="doc.key"
              fill
              :src="doc.url"
              :alt="doc.label"
              @click="openPreview(doc.url)"
            />
          </div>
        </section>

        <section class="ppass-card">
          <header class="ppass-card__head">
            <h2>Паспорт РФ</h2>
            <button
              v-if="!viewOnly"
              type="button"
              class="ppass-link"
              @click="goToStep(3)"
            >
              Изменить
            </button>
          </header>
          <div class="ppw-stack">
            <AuthRRField label="Серия и номер">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passport" readonly />
            </AuthRRField>
            <div class="ppass-row">
              <AuthRRField label="Дата выдачи">
                <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportDate" readonly />
              </AuthRRField>
              <AuthRRField label="Код подразделения">
                <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportCode" readonly />
              </AuthRRField>
            </div>
            <AuthRRField label="Кем выдан">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.passportIssued" readonly />
            </AuthRRField>
            <AuthRRField label="Место рождения">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.birthdayPlace" readonly />
            </AuthRRField>
            <AuthRRField label="Адрес регистрации">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.registrationAddress" readonly />
            </AuthRRField>
            <AuthRRField v-if="!form.sameAsResidence" label="Адрес фактического проживания">
              <input class="auth-rr-input__control auth-rr-input__control--align-left" :value="form.residenceAddress" readonly />
            </AuthRRField>
          </div>
        </section>
      </div>

      <template #footer>
        <template v-if="viewOnly">
          <AuthRRButton label="Назад к профилю" @click="navigateTo('/profile')" />
        </template>
        <template v-else>
          <AuthRRButton
            v-if="step === 1"
            label="Сделать фото"
            :loading="busy"
            @click="openMainCamera"
          />
          <AuthRRButton
            v-else-if="step === 2"
            label="Сделать фото"
            :loading="busy"
            @click="openRegCamera"
          />
          <AuthRRButton
            v-else-if="step === 3"
            label="Продолжить"
            :disabled="!canContinueForm"
            :loading="busy"
            @click="submitFormStep"
          />
          <AuthRRButton
            v-else
            label="Отправить на проверку"
            :loading="busy"
            @click="submitForReview"
          />
        </template>
        <p v-if="formError" class="ppass-error" role="alert">{{ formError }}</p>
      </template>
    </ProfileStepShell>

    <PassportCameraCapture
      v-if="cameraOpen"
      :variant="cameraVariant"
      :saving="busy"
      @close="cameraOpen = false"
      @save="onCameraSave"
    />

    <Teleport to="body">
      <div
        v-if="previewUrl"
        class="ppass-lightbox"
        role="dialog"
        aria-modal="true"
        @click.self="previewUrl = ''"
      >
        <button type="button" class="ppass-lightbox__close" aria-label="Закрыть" @click="previewUrl = ''">
          ✕
        </button>
        <img class="ppass-lightbox__img" :src="previewUrl" alt="Просмотр фото" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { AuthRRButton, AuthRRField } from 'bibli/shared/ui/rr'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  PASSPORT_WIZARD_TOTAL,
  birthdayFromApi,
  birthdayToApi,
  createEmptyPassportForm,
  isMainPhotoValid,
  isPassportFormValid,
  isRegPhotoValid,
  maskBirthdayInput,
  maskPassportCode,
  maskPassportNumber,
  parsePassportWizardStep,
  passportCodeDigits,
  passportDigits,
  passportWizardPath,
} from './lib/passportWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import ProfileRrCheckbox from './personal/ProfileRrCheckbox.vue'
import ProfileDocThumb from './personal/ProfileDocThumb.vue'
import PassportCameraCapture from './passport/PassportCameraCapture.vue'
import exampleMain from './assets/activation/passport-examples/example-main.png'
import exampleReg from './assets/activation/passport-examples/example-3.png'
import tipEye from './assets/activation/passport-tips/tip-eye.svg'
import tipFlash from './assets/activation/passport-tips/tip-flash.svg'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const {
  getDocumentUrl,
  getUserData,
  getPassportData,
  getPassportFiles,
  SubmitPassportData,
  uploadPassportDocuments,
  getFmsUnitNamesByCode,
} = api


const props = defineProps({
  step: { type: Number, default: 1 },
})

const step = computed(() => parsePassportWizardStep(props.step))
const busy = ref(false)
const formError = ref('')
const viewOnly = ref(false)
const form = reactive(createEmptyPassportForm())
const issuedOptions = ref([])
const previewUrl = ref('')
const cameraOpen = ref(false)
const cameraVariant = ref('main')

let mainPreviewObjectUrl = null
let regPreviewObjectUrl = null

const photoTips = [
  { label: 'Убедитесь, что в кадре виден весь разворот и всё хорошо видно', icon: tipEye },
  { label: 'Кадр без бликов от вспышки, теней и пальцев на тексте', icon: tipFlash },
]

const regTips = [
  { label: 'Штамп полностью в кадре, адрес читается целиком', icon: tipEye },
  { label: 'Кадр без бликов от вспышки, теней и пальцев на тексте', icon: tipFlash },
]

const canContinueForm = computed(() => isPassportFormValid(form))
const initialLoaded = ref(false)

const shellTitle = computed(() => {
  if (viewOnly.value) return 'Паспорт'
  if (step.value === 1) return 'Сделайте фото паспорта'
  if (step.value === 2) return 'Сделайте фото страницы с штампом регистрации'
  if (step.value === 3) return 'Заполните данные'
  return 'Проверьте данные'
})

const shellSubtitle = computed(() => {
  if (viewOnly.value) return 'Изменение недоступно'
  if (step.value === 1) return 'Главная страница с фотографией'
  if (step.value === 2) return 'Если нет регистрации всё равно сфотографируйте 5-ю страницу'
  if (step.value === 3) return 'Перепишите с разворота паспорта'
  return ''
})

const reviewDocs = computed(() => [
  {
    key: 'main',
    label: 'Главная страница',
    url: form.mainPhotoPreviewUrl || (form.mainPhotoServerPath ? getDocumentUrl(form.mainPhotoServerPath) : ''),
  },
  {
    key: 'reg',
    label: 'Регистрация',
    url: form.regPhotoPreviewUrl || (form.regPhotoServerPath ? getDocumentUrl(form.regPhotoServerPath) : ''),
  },
])

watch(
  () => form.passportCode,
  async (code) => {
    if (form.issuedManual) return
    const digits = passportCodeDigits(code)
    if (digits.length !== 6) {
      issuedOptions.value = []
      return
    }
    try {
      const names = await getFmsUnitNamesByCode(digits)
      issuedOptions.value = names
      if (form.passportIssued && !names.includes(form.passportIssued)) {
        form.passportIssued = ''
      }
    } catch (err) {
      console.error('[passport-wizard] fms lookup failed', err)
      issuedOptions.value = []
    }
  },
)


watch(
  () => form.issuedManual,
  async (manual) => {
    if (manual) {
      issuedOptions.value = []
      return
    }
    const digits = passportCodeDigits(form.passportCode)
    if (digits.length !== 6) {
      issuedOptions.value = []
      return
    }
    try {
      issuedOptions.value = await getFmsUnitNamesByCode(digits)
    } catch (err) {
      console.error('[passport-wizard] fms lookup failed', err)
      issuedOptions.value = []
    }
  },
)

function apiError(err, fallback) {
  return parseApiErrorDetail(err, fallback) || fallback
}

function goToStep(n, { replace = false } = {}) {
  if (viewOnly.value && parsePassportWizardStep(n) !== PASSPORT_WIZARD_TOTAL) return
  formError.value = ''
  const next = parsePassportWizardStep(n)
  if (next === step.value) return
  void navigateTo(passportWizardPath(next), replace ? { replace: true } : undefined)
}

/** Уже выгруженные фото-шаги не показываем — сразу дальше. */
function skipCompletedPhotoSteps() {
  if (!initialLoaded.value || busy.value || viewOnly.value) return
  if (step.value === 1 && isMainPhotoValid(form)) {
    goToStep(isRegPhotoValid(form) ? 3 : 2, { replace: true })
    return
  }
  if (step.value === 2 && isRegPhotoValid(form)) {
    goToStep(3, { replace: true })
  }
}

function onBack() {
  if (viewOnly.value || step.value <= 1) {
    void navigateTo('/profile')
    return
  }
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
    return
  }
  void navigateTo(passportWizardPath(step.value - 1), { replace: true })
}

function enforceViewOnly(user) {
  const locked = isActivationStepLocked(user?.activation?.steps?.passport)
  viewOnly.value = locked
  if (locked && step.value !== PASSPORT_WIZARD_TOTAL) {
    void navigateTo(passportWizardPath(PASSPORT_WIZARD_TOTAL), { replace: true })
  }
}

function onPassportInput(event) {
  form.passport = maskPassportNumber(event.target.value)
}

function onPassportDateInput(event) {
  form.passportDate = maskBirthdayInput(event.target.value)
}

function onPassportCodeInput(event) {
  form.passportCode = maskPassportCode(event.target.value)
}

function openPreview(url) {
  if (url) previewUrl.value = url
}

function openMainCamera() {
  cameraVariant.value = 'main'
  cameraOpen.value = true
}

function openRegCamera() {
  cameraVariant.value = 'registration'
  cameraOpen.value = true
}

async function onCameraSave({ file }) {
  if (!file || busy.value) return
  formError.value = ''
  busy.value = true
  try {
    const localUrl = URL.createObjectURL(file)
    if (cameraVariant.value === 'main') {
      if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl)
      mainPreviewObjectUrl = localUrl
      form.mainPhotoFile = file
      form.mainPhotoPreviewUrl = localUrl
      await uploadPassportDocuments(file, null, null, null, null, null)
      const files = await getPassportFiles()
      form.mainPhotoServerPath = files?.file_passport || files?.data?.file_passport || null
      cameraOpen.value = false
      goToStep(2)
    } else {
      if (regPreviewObjectUrl) URL.revokeObjectURL(regPreviewObjectUrl)
      regPreviewObjectUrl = localUrl
      form.regPhotoFile = file
      form.regPhotoPreviewUrl = localUrl
      await uploadPassportDocuments(null, file, null, null, null, null)
      const files = await getPassportFiles()
      form.regPhotoServerPath =
        files?.file_passport_registration || files?.data?.file_passport_registration || null
      cameraOpen.value = false
      goToStep(3)
    }
  } catch (err) {
    formError.value = apiError(
      err,
      cameraVariant.value === 'main'
        ? 'Не удалось загрузить фото паспорта'
        : 'Не удалось загрузить фото регистрации',
    )
  } finally {
    busy.value = false
  }
}

async function submitFormStep() {
  if (!canContinueForm.value || busy.value) return
  formError.value = ''
  if (!birthdayToApi(form.birthday)) {
    formError.value = 'Сначала укажите дату рождения в блоке «Личные данные»'
    return
  }
  busy.value = true
  try {
    await SubmitPassportData(buildPayload())
    goToStep(4)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось сохранить данные паспорта')
  } finally {
    busy.value = false
  }
}

async function submitForReview() {
  if (busy.value) return
  formError.value = ''
  if (!isMainPhotoValid(form) || !isRegPhotoValid(form)) {
    formError.value = 'Загрузите фото главной страницы и страницы регистрации'
    return
  }
  if (!isPassportFormValid(form)) {
    formError.value = 'Заполните все поля паспорта'
    return
  }
  if (!birthdayToApi(form.birthday)) {
    formError.value = 'Сначала укажите дату рождения в блоке «Личные данные»'
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

function buildPayload() {
  const payload = {
    passport: passportDigits(form.passport),
    passport_issued: form.passportIssued.trim(),
    passport_date: birthdayToApi(form.passportDate),
    passport_code: passportCodeDigits(form.passportCode),
    birthday: birthdayToApi(form.birthday),
    birthday_place: form.birthdayPlace.trim(),
    registration_address: form.registrationAddress.trim(),
  }
  if (form.inn) payload.inn = form.inn
  if (form.bankAccount) payload.bank_account = form.bankAccount
  if (form.bankBik) payload.bank_bik = form.bankBik
  if (form.bankName) payload.bank_name = form.bankName
  return payload
}

async function loadInitial() {
  try {
    const [data, files, userRes] = await Promise.all([
      getPassportData(),
      getPassportFiles(),
      getUserData(),
    ])
    const row = data?.data || data || {}
    form.passport = maskPassportNumber(row.passport || '')
    form.passportDate = birthdayFromApi(row.passport_date)
    form.passportCode = maskPassportCode(row.passport_code || '')
    form.passportIssued = row.passport_issued || ''
    form.birthday = birthdayFromApi(row.birthday)
    form.birthdayPlace = row.birthday_place || ''
    form.registrationAddress = row.registration_address || ''
    form.inn = row.inn || ''
    form.bankAccount = row.bank_account || ''
    form.bankBik = row.bank_bik || ''
    form.bankName = row.bank_name || ''

    const fileRow = files?.data || files || {}
    if (fileRow.file_passport) {
      form.mainPhotoServerPath = fileRow.file_passport
      form.mainPhotoPreviewUrl = getDocumentUrl(fileRow.file_passport)
    } else {
      form.mainPhotoServerPath = null
      form.mainPhotoPreviewUrl = null
      form.mainPhotoFile = null
      if (mainPreviewObjectUrl) {
        URL.revokeObjectURL(mainPreviewObjectUrl)
        mainPreviewObjectUrl = null
      }
    }
    if (fileRow.file_passport_registration) {
      form.regPhotoServerPath = fileRow.file_passport_registration
      form.regPhotoPreviewUrl = getDocumentUrl(fileRow.file_passport_registration)
    } else {
      form.regPhotoServerPath = null
      form.regPhotoPreviewUrl = null
      form.regPhotoFile = null
      if (regPreviewObjectUrl) {
        URL.revokeObjectURL(regPreviewObjectUrl)
        regPreviewObjectUrl = null
      }
    }

    if (!form.issuedManual && passportCodeDigits(form.passportCode).length === 6) {
      issuedOptions.value = await getFmsUnitNamesByCode(form.passportCode)
    }

    enforceViewOnly(userRes?.data ?? userRes)
  } catch (err) {
    formError.value = apiError(err, 'Не удалось загрузить данные паспорта')
    console.error('[passport-wizard] load failed', err)
  } finally {
    initialLoaded.value = true
    skipCompletedPhotoSteps()
  }
}

watch(
  () => step.value,
  () => {
    skipCompletedPhotoSteps()
  },
)

onMounted(() => {
  void loadInitial()
})

const skipNextActivateReload = ref(true)
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
  formError.value = ''
  initialLoaded.value = false
  void loadInitial()
})

onBeforeUnmount(() => {
  if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl)
  if (regPreviewObjectUrl) URL.revokeObjectURL(regPreviewObjectUrl)
})
</script>

<style scoped>
.profile-passport-wizard,
.profile-passport-wizard *,
.profile-passport-wizard *::before,
.profile-passport-wizard *::after {
  box-sizing: border-box;
}

.profile-passport-wizard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.ppw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}

.ppass-hero {
  display: grid;
  place-items: center;
  padding: var(--rr-spacing-padding-xl);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-brand-secondary-default);
  overflow: hidden;
}

.ppass-hero__img {
  display: block;
  width: 100%;
  max-width: 130px;
  height: auto;
  border-radius: var(--rr-radius-m);
  object-fit: contain;
}

.ppass-hero__img--reg {
  max-width: 280px;
}

.ppass-tips__title {
  margin: 0 0 var(--rr-spacing-padding-m);
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
  text-align: center;
}

.ppass-tips__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}

.ppass-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rr-spacing-padding-m);
  padding: var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-l);
  background: var(--rr-backgrounds-quaternary);
  font-size: var(--rr-font-size-font-size-xs);
  line-height: 18px;
}

.ppass-tip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--rr-spacing-padding-4-xl);
  height: var(--rr-spacing-padding-4-xl);
  border-radius: var(--rr-radius-m);
  background: var(--rr-backgrounds-primary);
}

.ppass-tip__icon img {
  display: block;
  width: var(--rr-spacing-padding-xl);
  height: var(--rr-spacing-padding-xl);
  object-fit: contain;
}

.ppass-tip__text {
  color: var(--rr-labels-neutral-primary);
  text-align: center;
}

.ppass-form :deep(.auth-rr-field__label) {
  color: var(--rr-labels-neutral-secondary);
}

.ppass-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-l);
}

.ppass-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23787880' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--rr-spacing-padding-l) center;
  padding-right: 36px;
}

.ppass-review {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-l);
}

.ppass-card {
  padding: var(--rr-spacing-padding-l);
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-primary);
}

.ppass-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--rr-spacing-padding-l);
}

.ppass-card__head h2 {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  font-weight: 600;
}

.ppass-docs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rr-spacing-padding-m);
}


.ppass-link {
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

.ppass-link:hover {
  background: var(--rr-button-brand-secondary-background-hover, #d2dbfa);
}

.ppass-link:active {
  background: var(--rr-button-brand-secondary-background-active, #bbc9f7);
}

.ppass-error {
  margin: var(--rr-spacing-padding-m) 0 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  text-align: center;
}

.ppass-lightbox {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: grid;
  place-items: center;
  padding: var(--rr-spacing-padding-3-xl);
  background: rgba(16, 16, 18, 0.72);
}

.ppass-lightbox__img {
  max-width: min(100%, 480px);
  max-height: 80vh;
  border-radius: var(--rr-radius-l);
  object-fit: contain;
}

.ppass-lightbox__close {
  position: absolute;
  top: var(--rr-spacing-padding-xl);
  right: var(--rr-spacing-padding-xl);
  width: var(--rr-size-3-xl);
  height: var(--rr-size-3-xl);
  border: none;
  border-radius: var(--rr-radius-full);
  background: var(--rr-backgrounds-overlay-strong);
  cursor: pointer;
}
</style>
