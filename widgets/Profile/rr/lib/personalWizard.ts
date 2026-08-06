export const PERSONAL_WIZARD_TOTAL = 5
export const PERSONAL_WIZARD_BASE_PATH = '/profile/personal'

const OTP_EMAIL_STORAGE_KEY = 'profile.personal.otpEmail'
const OTP_RESEND_AT_STORAGE_KEY = 'profile.personal.otpResendAt'

export function personalWizardPath(step: number): string {
  return `${PERSONAL_WIZARD_BASE_PATH}/${step}`
}

export function parsePersonalWizardStep(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > PERSONAL_WIZARD_TOTAL) return 1
  return n
}

/** Почта, на которую ушёл OTP — переживает remount при смене /personal/:step. */
export function readPendingOtpEmail(): string {
  if (typeof sessionStorage === 'undefined') return ''
  try {
    return String(sessionStorage.getItem(OTP_EMAIL_STORAGE_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function writePendingOtpEmail(email: string): void {
  if (typeof sessionStorage === 'undefined') return
  const value = String(email || '').trim()
  try {
    if (value) sessionStorage.setItem(OTP_EMAIL_STORAGE_KEY, value)
    else sessionStorage.removeItem(OTP_EMAIL_STORAGE_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export function clearPendingOtpEmail(): void {
  writePendingOtpEmail('')
  clearOtpResendAt()
}

/** Unix ms, когда снова можно запросить код. */
export function readOtpResendAt(): number {
  if (typeof sessionStorage === 'undefined') return 0
  try {
    const raw = Number(sessionStorage.getItem(OTP_RESEND_AT_STORAGE_KEY) || 0)
    return Number.isFinite(raw) ? raw : 0
  } catch {
    return 0
  }
}

export function writeOtpResendAt(timestampMs: number): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (timestampMs > Date.now()) {
      sessionStorage.setItem(OTP_RESEND_AT_STORAGE_KEY, String(timestampMs))
    } else {
      sessionStorage.removeItem(OTP_RESEND_AT_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function clearOtpResendAt(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(OTP_RESEND_AT_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function remainingOtpResendSeconds(now = Date.now()): number {
  const at = readOtpResendAt()
  if (!at) return 0
  return Math.max(0, Math.ceil((at - now) / 1000))
}

export type PersonalGender = 'm' | 'f' | null

export interface PersonalWizardForm {
  name: string
  surname: string
  patronymic: string
  noPatronymic: boolean
  gender: PersonalGender
  birthday: string
  phone: string
  email: string
  telegram: string
  emailVerified: boolean
  photoFile: File | null
  photoPreviewUrl: string | null
  photoServerPath: string | null
  dataConfirmed: boolean
}

export function createEmptyPersonalForm(): PersonalWizardForm {
  return {
    name: '',
    surname: '',
    patronymic: '',
    noPatronymic: false,
    gender: null,
    birthday: '',
    phone: '',
    email: '',
    telegram: '',
    emailVerified: false,
    photoFile: null,
    photoPreviewUrl: null,
    photoServerPath: null,
    dataConfirmed: false,
  }
}

/** ДД.ММ.ГГГГ → YYYY-MM-DD */
export function birthdayToApi(value: string): string | null {
  const m = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = Number(dd)
  const mo = Number(mm)
  const y = Number(yyyy)
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${yyyy}-${mm}-${dd}`
}

/** YYYY-MM-DD или ISO → ДД.ММ.ГГГГ */
export function birthdayFromApi(value: string | null | undefined): string {
  if (!value) return ''
  const m = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  const dmy = String(value).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dmy) return value.trim()
  return ''
}

export function maskBirthdayInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('.')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 1)
  return `${visible}*****@${domain}`
}

export function isIdentityStepValid(form: PersonalWizardForm): boolean {
  if (!form.name.trim() || !form.surname.trim()) return false
  if (!form.noPatronymic && !form.patronymic.trim()) return false
  if (!form.gender) return false
  return birthdayToApi(form.birthday) !== null
}

export function normalizePhoneForRrInput(value: string | null | undefined): string {
  let digits = String(value || '').replace(/\D/g, '')
  while (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1)
  }
  return digits.slice(0, 10)
}

export function isContactsStepValid(form: PersonalWizardForm): boolean {
  if (normalizePhoneForRrInput(form.phone).length !== 10) return false
  const email = form.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const tg = form.telegram.replace(/^@+/, '').trim()
  return tg.length >= 5
}

export function isPhotoStepValid(form: PersonalWizardForm): boolean {
  return Boolean(form.photoServerPath)
}

export function getPersonalNameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return value.trim() ? '' : 'Укажите имя'
}

export function getPersonalSurnameFieldError(value: string, touched = false): string {
  if (!touched) return ''
  return value.trim() ? '' : 'Укажите фамилию'
}

export function getPersonalPatronymicFieldError(
  value: string,
  noPatronymic: boolean,
  touched = false,
): string {
  if (!touched || noPatronymic) return ''
  return value.trim() ? '' : 'Укажите отчество или отметьте «Нет отчества»'
}

export function getPersonalBirthdayFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const raw = value.trim()
  if (!raw) return 'Укажите дату рождения'
  if (!birthdayToApi(raw)) return 'Укажите дату в формате ДД.ММ.ГГГГ'
  return ''
}

export function getPersonalEmailFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const email = value.trim()
  if (!email) return 'Укажите почту'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Укажите корректный email'
  return ''
}

export function getPersonalTelegramFieldError(value: string, touched = false): string {
  if (!touched) return ''
  const tg = value.replace(/^@+/, '').trim()
  if (!tg) return 'Укажите ник в Telegram'
  if (tg.length < 5) return 'Ник должен содержать минимум 5 символов'
  return ''
}
