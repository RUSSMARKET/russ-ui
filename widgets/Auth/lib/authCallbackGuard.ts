/** OAuth callback route — suppress global recovery while login is in progress. */

export const OAUTH_CALLBACK_CODE_KEY = 'oauth_callback_code';
export const OAUTH_CALLBACK_STATE_KEY = 'oauth_callback_state';
export const OAUTH_CALLBACK_BUSY_KEY = 'oauth_callback_busy';
export const OAUTH_CALLBACK_PAGE_ACTIVE_KEY = 'oauth_callback_page_active';
export const AUTH_EARLY_REDIRECT_FLAG = 'auth_early_redirect_pending';

export function isAuthFlowPath(path?: string): boolean {
  if (typeof path !== 'string' || path === '') {
    if (typeof window === 'undefined') {
      return false;
    }
    path = window.location.pathname;
  }
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/auth' || normalized.startsWith('/auth/');
}

export function isAuthCallbackPath(path?: string): boolean {
  if (typeof path !== 'string' || path === '') {
    if (typeof window === 'undefined') {
      return false;
    }
    path = window.location.pathname;
  }
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/auth/callback';
}

export function hasOAuthCallbackParamsInUrl(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  try {
    const params = new URLSearchParams(target.defaultView?.location?.search ?? '');
    return Boolean(params.get('code') || params.get('error'));
  } catch {
    return false;
  }
}

export function hasOAuthCallbackParamsInStorage(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return Boolean(sessionStorage.getItem(OAUTH_CALLBACK_CODE_KEY));
  } catch {
    return false;
  }
}

export function hasOAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return hasOAuthCallbackParamsInUrl() || hasOAuthCallbackParamsInStorage();
}

export function setOAuthCallbackBusy(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(OAUTH_CALLBACK_BUSY_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearOAuthCallbackBusy(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(OAUTH_CALLBACK_BUSY_KEY);
  } catch {
    // ignore
  }
}

export function isOAuthCallbackBusy(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(OAUTH_CALLBACK_BUSY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOAuthCallbackPageActive(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearOAuthCallbackPageActive(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function isOAuthCallbackPageActive(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isEarlyAuthRedirectPending(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(AUTH_EARLY_REDIRECT_FLAG) === '1';
  } catch {
    return false;
  }
}

function isBootstrapShellVisible(doc: Document): boolean {
  const shell = doc.getElementById('app-bootstrap-shell');
  if (!shell) return false;
  const style = shell.style;
  return style.display !== 'none';
}

export function isAuthEntryContentPresent(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  if (typeof target.querySelector !== 'function' || typeof target.getElementById !== 'function') {
    return false;
  }

  const authTemplate = target.querySelector('.auth-template');
  if (authTemplate && authTemplate.children.length > 0) {
    return true;
  }

  if (target.querySelector('.auth-page')) {
    return true;
  }

  if (isBootstrapShellVisible(target)) {
    return true;
  }

  return isEarlyAuthRedirectPending();
}

export function shouldSuppressGlobalRecovery(path?: string): boolean {
  const resolvedPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '');

  if (isAuthCallbackPath(resolvedPath)) {
    if (isAuthCallbackContentPresent()) {
      return true;
    }
    return isOAuthCallbackPageActive() || isOAuthCallbackBusy();
  }

  if (resolvedPath.replace(/\/+$/, '') === '/auth') {
    return isAuthEntryContentPresent();
  }

  return false;
}

export function isAuthCallbackContentPresent(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  if (typeof target.querySelector !== 'function' || typeof target.getElementById !== 'function') {
    return false;
  }
  return Boolean(
    target.querySelector('.auth-rr-callback-status')
      || target.querySelector('.auth-rr-callback-actions')
      || target.querySelector('.auth-rr-spinner')
      || target.getElementById('app-bootstrap-shell'),
  );
}

/** Reload on callback error screen only when PKCE can be retried (bfcache / iOS). */
export function shouldOfferCallbackReload(
  stage: string,
  hasCode: boolean,
  hasState: boolean,
  hasVerifier: boolean,
): boolean {
  return stage === 'no_payload' && hasCode && hasState && hasVerifier;
}
