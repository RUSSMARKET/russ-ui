/**
 * Russ Redesign form kit (--rr-*).
 * Canonical import for apps: `bibli/shared/ui/rr`
 *
 * Auth-only shell stays in `bibli/widgets/Auth/rr` (Layout, Callback).
 */
export { default as AuthRRButton } from './AuthRRButton.vue'
export { default as AuthRRField } from './AuthRRField.vue'
export { default as AuthRRInputPhone } from './AuthRRInputPhone.vue'
export { default as AuthRRInputPassword } from './AuthRRInputPassword.vue'
export { default as AuthRRInputText } from './AuthRRInputText.vue'
export { default as AuthRRStepProgress } from './AuthRRStepProgress.vue'
export { default as AuthRROtpInput } from './AuthRROtpInput.vue'
export { default as AuthRRPasswordRules } from './AuthRRPasswordRules.vue'

/** Shorter aliases */
export { default as RrButton } from './AuthRRButton.vue'
export { default as RrField } from './AuthRRField.vue'
export { default as RrInputPhone } from './AuthRRInputPhone.vue'
export { default as RrInputPassword } from './AuthRRInputPassword.vue'
export { default as RrInputText } from './AuthRRInputText.vue'
export { default as RrStepProgress } from './AuthRRStepProgress.vue'
export { default as RrOtpInput } from './AuthRROtpInput.vue'
export { default as RrPasswordRules } from './AuthRRPasswordRules.vue'

export {
  getPasswordRulesList,
  getPasswordRulesState,
  isPasswordRulesValid,
  PASSWORD_SPECIAL_CHARS,
} from './composables/usePasswordRules.js'
export {
  CYRILLIC_NAME_ONLY_MESSAGE,
  validateCyrillicName,
} from './composables/useCyrillicNameValidation.js'
export {
  extractUserDigits,
  localMaskGhost,
  useRuPhoneMask,
} from './composables/useRuPhoneMask.js'
export {
  cellsToDigits,
  useAuthRrOtp,
  OTP_LENGTH,
} from './composables/useAuthRrOtp.js'
