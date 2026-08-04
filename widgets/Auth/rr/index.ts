/**
 * Auth RR surface: layout + callback + re-export of shared form kit.
 * Form controls: prefer `bibli/shared/ui/rr`.
 */
export { default as AuthRRLayout } from './AuthRRLayout.vue'
export { default as AuthCallbackStatusPage } from './AuthCallbackStatusPage.vue'

export {
  AuthRRButton,
  AuthRRField,
  AuthRRInputPhone,
  AuthRRInputPassword,
  AuthRRInputText,
  AuthRRStepProgress,
  AuthRROtpInput,
  AuthRRPasswordRules,
  RrButton,
  RrField,
  RrInputPhone,
  RrInputPassword,
  RrInputText,
  RrStepProgress,
  RrOtpInput,
  RrPasswordRules,
  getPasswordRulesList,
  getPasswordRulesState,
  isPasswordRulesValid,
  PASSWORD_SPECIAL_CHARS,
  CYRILLIC_NAME_ONLY_MESSAGE,
  validateCyrillicName,
} from 'bibli/shared/ui/rr'

export {
  authRrAssets,
  authRrBrand,
  authRrFlags,
  authRrHeroByVariant,
  authRrHeroDimensions,
  authRrIcons,
  getAuthRrHero,
  type AuthRrAssetKey,
  type AuthRrHeroMeta,
  type AuthRrHeroVariant,
  type AuthRrIconKey,
} from 'bibli/shared/assets/auth/rr'
