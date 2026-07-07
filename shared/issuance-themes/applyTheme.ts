import type { IssuanceThemeTokens } from './types';

const TOKEN_CSS_MAP: Record<keyof IssuanceThemeTokens['colors'], string> = {
  accent: '--issuance-accent',
  background: '--issuance-bg',
  surface: '--issuance-surface',
  text: '--issuance-text',
  textSecondary: '--issuance-text-secondary',
  qrFrame: '--issuance-qr-frame',
  hover: '--issuance-hover',
  border: '--issuance-border',
};

export function applyTheme(element: HTMLElement, tokens: IssuanceThemeTokens): void {
  for (const [key, cssVar] of Object.entries(TOKEN_CSS_MAP)) {
    const value = tokens.colors[key as keyof IssuanceThemeTokens['colors']];
    element.style.setProperty(cssVar, value);
  }

  element.classList.add('issuance-shell');
  element.classList.add(`issuance-shell--${tokens.preset}`);
  element.classList.add(`issuance-shell--${tokens.variant}`);

  if (tokens.layout.fullscreen) {
    element.classList.add('issuance-shell--fullscreen');
  } else {
    element.classList.remove('issuance-shell--fullscreen');
  }

  if (tokens.layout.backgroundImage) {
    element.style.setProperty('--issuance-bg-image', `url(${tokens.layout.backgroundImage})`);
  } else {
    element.style.removeProperty('--issuance-bg-image');
  }
}

export function clearTheme(element: HTMLElement): void {
  for (const cssVar of Object.values(TOKEN_CSS_MAP)) {
    element.style.removeProperty(cssVar);
  }

  element.style.removeProperty('--issuance-bg-image');
  element.classList.remove(
    'issuance-shell',
    'issuance-shell--fullscreen',
    ...(Array.from(element.classList).filter((cls) => cls.startsWith('issuance-shell--'))),
  );
}
