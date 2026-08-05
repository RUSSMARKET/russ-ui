import { digitsOnly, isValidBik, validateRs } from 'bibli/shared/utils/russianBankAccount'

export const BANK_WIZARD_TOTAL = 2
export const BANK_WIZARD_BASE_PATH = '/profile/bank'

export function bankWizardPath(step: number): string {
  return `${BANK_WIZARD_BASE_PATH}/${step}`
}

export function parseBankWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > BANK_WIZARD_TOTAL) return 1
  return n
}

export interface BankWizardForm {
  bankBik: string
  bankAccount: string
  bankName: string
  photoFile: File | null
  photoPreviewUrl: string | null
  photoServerPath: string | null
  /** true если последний загруженный документ — PDF */
  photoIsPdf: boolean
  dataConfirmed: boolean
}

export function createEmptyBankForm(): BankWizardForm {
  return {
    bankBik: '',
    bankAccount: '',
    bankName: '',
    photoFile: null,
    photoPreviewUrl: null,
    photoServerPath: null,
    photoIsPdf: false,
    dataConfirmed: false,
  }
}

export function bankBikDigits(value: string): string {
  return digitsOnly(value).slice(0, 9)
}

export function bankAccountDigits(value: string): string {
  return digitsOnly(value).slice(0, 20)
}

export function isBankPhotoValid(form: BankWizardForm): boolean {
  return Boolean(form.photoFile || form.photoServerPath || form.photoPreviewUrl)
}

export function isBankFieldsValid(form: BankWizardForm): boolean {
  return (
    isValidBik(form.bankBik) &&
    validateRs(form.bankAccount, form.bankBik) &&
    form.bankName.trim().length > 0
  )
}

export function isBankReadyToSubmit(form: BankWizardForm): boolean {
  return isBankPhotoValid(form) && isBankFieldsValid(form) && form.dataConfirmed
}

/** Ошибка поля БИК для подсветки (пусто = без ошибки). */
export function getBankBikFieldError(bik: string, account: string, touched = false): string {
  const digits = bankBikDigits(bik)
  if (!digits) return ''
  if (digits.length < 9) {
    return touched ? 'БИК банка должен содержать 9 цифр' : ''
  }
  const acc = bankAccountDigits(account)
  if (acc.length === 20 && !validateRs(acc, digits)) {
    return 'Такой БИК не может существовать с этим счётом'
  }
  return ''
}

/** Ошибка поля расчётного счёта для подсветки (пусто = без ошибки). */
export function getBankAccountFieldError(account: string, bik: string, touched = false): string {
  const acc = bankAccountDigits(account)
  if (!acc) return ''
  if (acc.length < 20) {
    return touched ? 'Расчётный счёт должен содержать 20 цифр' : ''
  }
  const digits = bankBikDigits(bik)
  if (!isValidBik(digits)) {
    return 'Укажите корректный БИК банка'
  }
  if (!validateRs(acc, digits)) {
    return 'Такой расчётный счёт не может существовать с этим БИК'
  }
  return ''
}
