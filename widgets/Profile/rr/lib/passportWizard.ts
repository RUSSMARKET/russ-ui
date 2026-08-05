import { birthdayFromApi, birthdayToApi, maskBirthdayInput } from './personalWizard'

export const PASSPORT_WIZARD_TOTAL = 4
export const PASSPORT_WIZARD_BASE_PATH = '/profile/passport'

export function passportWizardPath(step: number): string {
  return `${PASSPORT_WIZARD_BASE_PATH}/${step}`
}

export function parsePassportWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > PASSPORT_WIZARD_TOTAL) return 1
  return n
}

export interface PassportWizardForm {
  passport: string
  passportDate: string
  passportCode: string
  passportIssued: string
  issuedManual: boolean
  birthday: string
  birthdayPlace: string
  registrationAddress: string
  sameAsResidence: boolean
  residenceAddress: string
  mainPhotoFile: File | null
  mainPhotoPreviewUrl: string | null
  mainPhotoServerPath: string | null
  regPhotoFile: File | null
  regPhotoPreviewUrl: string | null
  regPhotoServerPath: string | null
  /** Existing inn/bank kept for PUT compatibility when present */
  inn: string
  bankAccount: string
  bankBik: string
  bankName: string
}

export function createEmptyPassportForm(): PassportWizardForm {
  return {
    passport: '',
    passportDate: '',
    passportCode: '',
    passportIssued: '',
    issuedManual: false,
    birthday: '',
    birthdayPlace: '',
    registrationAddress: '',
    sameAsResidence: true,
    residenceAddress: '',
    mainPhotoFile: null,
    mainPhotoPreviewUrl: null,
    mainPhotoServerPath: null,
    regPhotoFile: null,
    regPhotoPreviewUrl: null,
    regPhotoServerPath: null,
    inn: '',
    bankAccount: '',
    bankBik: '',
    bankName: '',
  }
}

/** #### ###### */
export function maskPassportNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)} ${digits.slice(4)}`
}

export function passportDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

/** ###-### */
export function maskPassportCode(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 3) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

export function passportCodeDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 6)
}

export { birthdayFromApi, birthdayToApi, maskBirthdayInput }

export function isPassportFormValid(form: PassportWizardForm): boolean {
  if (passportDigits(form.passport).length !== 10) return false
  if (!birthdayToApi(form.passportDate)) return false
  if (passportCodeDigits(form.passportCode).length !== 6) return false
  if (!form.passportIssued.trim()) return false
  if (!form.birthdayPlace.trim()) return false
  if (!form.registrationAddress.trim()) return false
  if (!form.sameAsResidence && !form.residenceAddress.trim()) return false
  return true
}

export function isPassportReadyToSubmit(form: PassportWizardForm): boolean {
  return isPassportFormValid(form) && Boolean(birthdayToApi(form.birthday))
}

export function isMainPhotoValid(form: PassportWizardForm): boolean {
  return Boolean(form.mainPhotoFile || form.mainPhotoServerPath || form.mainPhotoPreviewUrl)
}

export function isRegPhotoValid(form: PassportWizardForm): boolean {
  return Boolean(form.regPhotoFile || form.regPhotoServerPath || form.regPhotoPreviewUrl)
}

export function formatPassportDateForApi(value: string): string | null {
  return birthdayToApi(value)
}
