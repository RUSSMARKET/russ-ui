export const INN_WIZARD_TOTAL = 3
export const INN_WIZARD_BASE_PATH = '/profile/inn'

export function innWizardPath(step: number): string {
  return `${INN_WIZARD_BASE_PATH}/${step}`
}

export function parseInnWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > INN_WIZARD_TOTAL) return 1
  return n
}

export interface InnWizardForm {
  inn: string
  photoFile: File | null
  photoPreviewUrl: string | null
  photoServerPath: string | null
  dataConfirmed: boolean
  /** Existing passport fields kept for PUT compatibility */
  passport: string
  passportIssued: string
  passportDate: string
  passportCode: string
  birthday: string
  birthdayPlace: string
  registrationAddress: string
  bankAccount: string
  bankBik: string
  bankName: string
}

export function createEmptyInnForm(): InnWizardForm {
  return {
    inn: '',
    photoFile: null,
    photoPreviewUrl: null,
    photoServerPath: null,
    dataConfirmed: false,
    passport: '',
    passportIssued: '',
    passportDate: '',
    passportCode: '',
    birthday: '',
    birthdayPlace: '',
    registrationAddress: '',
    bankAccount: '',
    bankBik: '',
    bankName: '',
  }
}

export function innDigits(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 12)
}

export function maskInn(raw: string): string {
  return innDigits(raw)
}

export function isInnValid(form: InnWizardForm): boolean {
  return innDigits(form.inn).length === 12
}

export function isInnPhotoValid(form: InnWizardForm): boolean {
  return Boolean(form.photoFile || form.photoServerPath || form.photoPreviewUrl)
}

export function isInnReadyToSubmit(form: InnWizardForm): boolean {
  return isInnPhotoValid(form) && isInnValid(form) && form.dataConfirmed
}
