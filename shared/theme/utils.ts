import type { ThemeConfig } from './types'

/**
 * Применить тему к документу через CSS переменные
 */
export function applyTheme(theme: ThemeConfig): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const colors = theme.colors

  // Основные цвета
  root.style.setProperty('--russ-primary', colors.primary)
  root.style.setProperty('--russ-primary-dark', colors.primaryDark)
  root.style.setProperty('--russ-primary-light', colors.primaryLight)
  root.style.setProperty('--russ-primary-hover', colors.primaryHover)
  root.style.setProperty('--russ-primary-active', colors.primaryActive)
  
  // Вторичные цвета
  root.style.setProperty('--russ-secondary', colors.secondary)
  root.style.setProperty('--russ-secondary-dark', colors.secondaryDark)
  root.style.setProperty('--russ-secondary-light', colors.secondaryLight)
  
  // Акцентные цвета
  root.style.setProperty('--russ-accent', colors.accent)
  root.style.setProperty('--russ-accent-dark', colors.accentDark)
  root.style.setProperty('--russ-accent-light', colors.accentLight)
  
  // Цвета текста
  root.style.setProperty('--russ-text-primary', colors.textPrimary)
  root.style.setProperty('--russ-text-secondary', colors.textSecondary)
  root.style.setProperty('--russ-text-tertiary', colors.textTertiary)
  root.style.setProperty('--russ-text-inverse', colors.textInverse)
  
  // Цвета фона
  root.style.setProperty('--russ-bg', colors.background)
  root.style.setProperty('--russ-bg-secondary', colors.backgroundSecondary)
  root.style.setProperty('--russ-bg-tertiary', colors.backgroundTertiary)
  
  // Цвета границ
  root.style.setProperty('--russ-border', colors.border)
  root.style.setProperty('--russ-border-light', colors.borderLight)
  root.style.setProperty('--russ-border-dark', colors.borderDark)
  
  // Статусные цвета
  root.style.setProperty('--russ-success', colors.success)
  root.style.setProperty('--russ-success-light', colors.successLight)
  root.style.setProperty('--russ-success-dark', colors.successDark)
  
  root.style.setProperty('--russ-error', colors.error)
  root.style.setProperty('--russ-error-light', colors.errorLight)
  root.style.setProperty('--russ-error-dark', colors.errorDark)
  
  root.style.setProperty('--russ-warning', colors.warning)
  root.style.setProperty('--russ-warning-light', colors.warningLight)
  root.style.setProperty('--russ-warning-dark', colors.warningDark)
  
  root.style.setProperty('--russ-info', colors.info)
  root.style.setProperty('--russ-info-light', colors.infoLight)
  root.style.setProperty('--russ-info-dark', colors.infoDark)
  
  // Нейтральные цвета
  root.style.setProperty('--russ-neutral', colors.neutral)
  root.style.setProperty('--russ-neutral-light', colors.neutralLight)
  root.style.setProperty('--russ-neutral-dark', colors.neutralDark)
  
  // Дополнительные цвета
  root.style.setProperty('--russ-label', colors.label)
  root.style.setProperty('--russ-value', colors.value)
  root.style.setProperty('--russ-checkbox-accent', colors.checkboxAccent)
  root.style.setProperty('--russ-focus-ring', colors.focusRing)
  
  // Дополнительные оттенки текста
  root.style.setProperty('--russ-text-quaternary', colors.textQuaternary)
  root.style.setProperty('--russ-text-muted', colors.textMuted)
  
  // Дополнительные оттенки фона
  root.style.setProperty('--russ-bg-quaternary', colors.backgroundQuaternary)
  root.style.setProperty('--russ-bg-hover', colors.backgroundHover)
  root.style.setProperty('--russ-bg-active', colors.backgroundActive)
  root.style.setProperty('--russ-bg-disabled', colors.backgroundDisabled)
  
  // Дополнительные оттенки границ
  root.style.setProperty('--russ-border-quaternary', colors.borderQuaternary)
  root.style.setProperty('--russ-input-border', colors.inputBorder)
  root.style.setProperty('--russ-input-border-focus', colors.inputBorderFocus)
  root.style.setProperty('--russ-input-border-error', colors.inputBorderError)
  
  // Цвета для инпутов
  root.style.setProperty('--russ-input-bg', colors.inputBg)
  root.style.setProperty('--russ-input-bg-disabled', colors.inputBgDisabled)
  root.style.setProperty('--russ-input-bg-hover', colors.inputBgHover)
  root.style.setProperty('--russ-input-text', colors.inputText)
  root.style.setProperty('--russ-input-placeholder', colors.inputPlaceholder)
  root.style.setProperty('--russ-input-error', colors.inputError)
  root.style.setProperty('--russ-input-error-bg', colors.inputErrorBg)
  
  // Цвета для теней и оверлеев
  root.style.setProperty('--russ-overlay', colors.overlay)
  root.style.setProperty('--russ-overlay-light', colors.overlayLight)
  root.style.setProperty('--russ-shadow-color', colors.shadowColor)
  
  // Специальные цвета
  root.style.setProperty('--russ-yellow', colors.yellow)
  root.style.setProperty('--russ-yellow-light', colors.yellowLight)
  root.style.setProperty('--russ-orange', colors.orange)
  root.style.setProperty('--russ-orange-light', colors.orangeLight)
  root.style.setProperty('--russ-purple', colors.purple)
  root.style.setProperty('--russ-purple-light', colors.purpleLight)
  
  // Дополнительные оттенки primary для градиентов
  root.style.setProperty('--russ-primary-gradient-start', colors.primaryGradientStart)
  root.style.setProperty('--russ-primary-gradient-end', colors.primaryGradientEnd)
  
  // Дополнительные фоновые цвета
  root.style.setProperty('--russ-bg-blue-tint', colors.primaryLight === '#1b3170' ? '#e8edff' : '#e0f2f1')
  root.style.setProperty('--russ-bg-blue-light', colors.primaryLight === '#1b3170' ? '#f5f7ff' : '#f0fdf4')
  root.style.setProperty('--russ-bg-blue-lighter', colors.primaryLight === '#1b3170' ? '#e0e7ff' : '#d1fae5')
  root.style.setProperty('--russ-bg-gray-light', '#f4f7fb')
  
  // Дополнительные цвета для статусов
  root.style.setProperty('--russ-success-text', '#065f46')
  root.style.setProperty('--russ-success-border', '#34d399')
  root.style.setProperty('--russ-warning-text', '#92400e')
  root.style.setProperty('--russ-error-text', '#991b1b')
  root.style.setProperty('--russ-info-text', colors.infoDark === '#2563eb' ? '#1e40af' : '#0f766e')
  root.style.setProperty('--russ-info-border', colors.infoLight === '#dbeafe' ? '#bfdbfe' : '#99f6e4')
  
  // Цвета для акцентов в инпутах
  const accentRgb = colors.accent === '#2563eb' ? '29, 76, 210' : '5, 150, 105'
  root.style.setProperty('--russ-accent-tint-12', `rgba(${accentRgb}, 0.12)`)
  root.style.setProperty('--russ-accent-tint-18', `rgba(${accentRgb}, 0.18)`)
  root.style.setProperty('--russ-accent-tint-40', `rgba(${accentRgb}, 0.4)`)
  
  // Цвета для теней с акцентом
  const primaryRgb = colors.primary === '#213e89' ? '33, 62, 137' : '5, 150, 105'
  const accentRgbForShadow = colors.accent === '#2563eb' ? '37, 99, 235' : '14, 184, 166'
  const secondaryRgb = colors.secondary === '#6366f1' ? '99, 102, 241' : '16, 185, 129'
  root.style.setProperty('--russ-shadow-primary', `rgba(${primaryRgb}, 0.1)`)
  root.style.setProperty('--russ-shadow-primary-light', `rgba(${primaryRgb}, 0.06)`)
  root.style.setProperty('--russ-shadow-accent', `rgba(${accentRgbForShadow}, 0.2)`)
  root.style.setProperty('--russ-shadow-accent-light', `rgba(${accentRgbForShadow}, 0.1)`)
  root.style.setProperty('--russ-shadow-secondary', `rgba(${secondaryRgb}, 0.1)`)
}

/**
 * Получить значение CSS переменной
 */
export function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
