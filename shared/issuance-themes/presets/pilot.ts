import type { IssuanceShellVariant, IssuanceThemeTokens } from '../types';

/** Neutral gray theme for pilot / test products. */
export function pilotPreset(variant: IssuanceShellVariant = 'qr'): IssuanceThemeTokens {
  const isConsent = variant === 'consent';

  return {
    preset: 'pilot',
    variant,
    colors: {
      accent: 'var(--russ-neutral-dark)',
      background: isConsent ? 'var(--russ-bg-secondary)' : 'var(--russ-bg-tertiary)',
      surface: 'var(--russ-bg)',
      text: 'var(--russ-text-primary)',
      textSecondary: 'var(--russ-text-tertiary)',
      qrFrame: 'var(--russ-bg)',
      hover: 'var(--russ-bg-hover)',
      border: 'var(--russ-border-dark)',
    },
    branding: {
      headline: 'Тестовая выдача (pilot)',
      subheadline: null,
      showLogo: !isConsent,
      qrEmbedLogo: !isConsent,
    },
    layout: {
      fullscreen: false,
      showCloseButton: true,
      backgroundImage: null,
    },
  };
}
