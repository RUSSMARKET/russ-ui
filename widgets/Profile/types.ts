import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type ProfileNavigateOptions = { replace?: boolean }

export type ProfileNavigate = (
  to: string,
  options?: ProfileNavigateOptions,
) => void | Promise<void>

/** App-provided profile HTTP + document URL helpers. */
export interface ProfileApi {
  getUserData: () => Promise<any>
  getPassportData: () => Promise<any>
  getPersonalData: () => Promise<any>
  clearPersonalData: () => Promise<any>
  submitContactData: (data: {
    name: string
    surname: string
    patronymic: string | null
    telegram_username?: string | null
    gender?: 'm' | 'f' | null
    birthday?: string | null
  }) => Promise<any>
  SubmitPassportData: (data: Record<string, unknown>) => Promise<any>
  uploadPassportDocuments: (
    passport: File | null,
    passport_registration: File | null,
    agent_with_passport: File | null,
    file_inn: File | null,
    file_snils: File | null,
    file_banking_details: File | null,
  ) => Promise<any>
  sendUserEmailCode: (email: string) => Promise<any>
  sendUserEmailCodeVerify: (email: string, code: string) => Promise<any>
  confirmProfileData: () => Promise<any>
  getAgentTypes: () => Promise<any>
  setAgentType: (account_type: string) => Promise<any>
  getSelfEmployedData: () => Promise<any>
  submitSelfEmployedData: (data: {
    file_self_employed: File
    file_income_statement: File
  }) => Promise<any>
  submitSelfEmployedForm: (form: {
    file_self_employed: File
    file_income_statement: File
  }) => Promise<any>
  getIndividualEntrepreneurData: () => Promise<any>
  submitIndividualEntrepreneurData: (data: Record<string, unknown>) => Promise<any>
  submitIndividualEntrepreneurForm: (form: Record<string, unknown>) => Promise<any>
  getPassportFiles: () => Promise<any>
  getDocumentUrl: (file: string | null | undefined) => string
  getFmsUnitNamesByCode: (code: string) => Promise<string[]>
}

export interface ProfileUserSync {
  setName: (name: string) => void
  setSurname: (surname: string) => void
  setPatronymic: (patronymic: string) => void
}

/** Extra deps only needed by ProfileLegacy. */
export interface ProfileLegacyExtras {
  user: ProfileUserSync
  isNewUser: Ref<boolean> | ComputedRef<boolean>
  processImageFile: (file: File) => Promise<File>
  getFmsUnitNamesByCode: (code: string) => Promise<string[]>
  getUploadUserMessage: (
    error: unknown,
    context?: string,
  ) => { summary: string; detail: string }
  /** Absolute/base URL used to build `/document/:id` links in legacy. */
  getLegacyDocumentUrl: (fileId: string) => string
}

export const PROFILE_API_KEY: InjectionKey<ProfileApi> = Symbol('profileApi')
export const PROFILE_NAVIGATE_KEY: InjectionKey<ProfileNavigate> = Symbol(
  'profileNavigate',
)
export const PROFILE_LEGACY_EXTRAS_KEY: InjectionKey<ProfileLegacyExtras> =
  Symbol('profileLegacyExtras')
