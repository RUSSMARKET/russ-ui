import { describe, expect, it } from 'vitest';
import { mergeTheme } from './mergeTheme';

describe('mergeTheme', () => {
  it('returns platform preset tokens by default', () => {
    const theme = mergeTheme('platform');

    expect(theme.preset).toBe('platform');
    expect(theme.variant).toBe('qr');
    expect(theme.colors.background).toBe('var(--russ-bg-blue-light)');
    expect(theme.branding.qrEmbedLogo).toBe(true);
  });

  it('uses white background for platform consent variant', () => {
    const theme = mergeTheme('platform', null, { variant: 'consent' });

    expect(theme.variant).toBe('consent');
    expect(theme.colors.background).toBe('var(--russ-bg)');
    expect(theme.branding.showLogo).toBe(false);
  });

  it('applies yandex v1 overrides for headline and background only', () => {
    const theme = mergeTheme('yandex', {
      colors: {
        accent: '#ff0000',
        background: '#112233',
        surface: '#ffffff',
      },
      branding: {
        headline: 'Custom headline',
        subheadline: 'Ignored subheadline',
        showLogo: false,
      },
    });

    expect(theme.colors.background).toBe('#112233');
    expect(theme.branding.headline).toBe('Custom headline');
    expect(theme.colors.accent).toBe('var(--russ-yellow)');
    expect(theme.branding.subheadline).toBeNull();
    expect(theme.branding.showLogo).toBe(true);
  });

  it('ignores overrides for non-yandex presets', () => {
    const theme = mergeTheme('platform', {
      colors: { background: '#000000' },
      branding: { headline: 'Should not apply' },
    });

    expect(theme.colors.background).toBe('var(--russ-bg-blue-light)');
    expect(theme.branding.headline).toBeNull();
  });

  it('ignores overrides for consent shell regardless of preset', () => {
    const theme = mergeTheme(
      'yandex',
      {
        colors: { background: '#112233' },
        branding: { headline: 'Consent headline' },
      },
      { variant: 'consent' },
    );

    expect(theme.variant).toBe('consent');
    expect(theme.colors.background).toBe('var(--russ-yellow)');
    expect(theme.branding.headline).toBe('Получите подарки от Яндекса');
  });

  it('returns pilot gray tokens for test products', () => {
    const theme = mergeTheme('pilot');

    expect(theme.preset).toBe('pilot');
    expect(theme.colors.background).toBe('var(--russ-bg-tertiary)');
    expect(theme.branding.headline).toContain('pilot');
  });
});
