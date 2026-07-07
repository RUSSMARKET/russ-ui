import { getPresetTokens } from './presets';
import type {
  IssuanceShellVariant,
  IssuanceThemeTokens,
  MergeThemeOptions,
  ThemeOverrides,
  ThemePreset,
} from './types';

function cloneTokens(tokens: IssuanceThemeTokens): IssuanceThemeTokens {
  return {
    ...tokens,
    colors: { ...tokens.colors },
    branding: { ...tokens.branding },
    layout: { ...tokens.layout },
  };
}

/** v1 whitelist: only Yandex QR accepts headline + background overrides. */
function applyWhitelistedOverrides(
  preset: ThemePreset,
  variant: IssuanceShellVariant,
  tokens: IssuanceThemeTokens,
  overrides: ThemeOverrides | null | undefined,
): IssuanceThemeTokens {
  if (!overrides || variant === 'consent') {
    return tokens;
  }

  if (preset !== 'yandex' || variant !== 'qr') {
    return tokens;
  }

  const merged = cloneTokens(tokens);

  if (overrides.colors?.background) {
    merged.colors.background = overrides.colors.background;
  }

  if (overrides.branding?.headline !== undefined) {
    merged.branding.headline = overrides.branding.headline;
  }

  return merged;
}

export function mergeTheme(
  preset: ThemePreset,
  overrides?: ThemeOverrides | null,
  options: MergeThemeOptions = {},
): IssuanceThemeTokens {
  const variant = options.variant ?? 'qr';
  const base = getPresetTokens(preset, variant);

  if (options.ignoreOverrides || variant === 'consent') {
    return base;
  }

  return applyWhitelistedOverrides(preset, variant, base, overrides);
}
