/**
 * Auth widget barrel.
 *
 * Prefer explicit trees:
 *   `bibli/widgets/Auth/legacy` — AuthLayout, OidcRedirectAuthPage
 *   `bibli/widgets/Auth/rr`     — AuthRR* + AuthCallbackStatusPage
 */
export { default as OidcRedirectAuthPage } from './legacy/OidcRedirectAuthPage.vue'
export { default as AuthLayout } from './legacy/AuthLayout.vue'
export { default as AuthCallbackStatusPage } from './rr/AuthCallbackStatusPage.vue'
export { AuthRRLayout } from './rr'
export { useAuthRrShell } from './composables/useAuthRrShell'
export * from './lib'
export type { OidcRedirectAuthPolicy } from './types'
