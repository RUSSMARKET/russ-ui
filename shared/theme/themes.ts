import type { ThemeConfig } from './types'

/**
 * Тема для проекта fintech (синяя цветовая схема)
 */
export const fintechTheme: ThemeConfig = {
  name: 'fintech',
  colors: {
    // Основные цвета (синие)
    primary: '#213e89',
    primaryDark: '#162954',
    primaryLight: '#1b3170',
    primaryHover: '#1b3170',
    primaryActive: '#162954',
    
    // Вторичные цвета
    secondary: '#6366f1',
    secondaryDark: '#4f46e5',
    secondaryLight: '#818cf8',
    
    // Акцентные цвета
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    accentLight: '#3b82f6',
    
    // Цвета текста
    textPrimary: '#1f2937',
    textSecondary: '#374151',
    textTertiary: '#6b7280',
    textInverse: '#ffffff',
    
    // Цвета фона
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Цвета границ
    border: '#e5e7eb',
    borderLight: '#e2e8f0',
    borderDark: '#d1d5db',
    
    // Статусные цвета
    success: '#22c55e',
    successLight: '#d1fae5',
    successDark: '#16a34a',
    
    error: '#dc3545',
    errorLight: '#fee2e2',
    errorDark: '#c82333',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#2563eb',
    
    // Нейтральные цвета
    neutral: '#6b7280',
    neutralLight: '#9ca3af',
    neutralDark: '#374151',
    
    // Дополнительные цвета
    label: '#6366f1',
    value: '#213e89',
    checkboxAccent: '#2563eb',
    focusRing: 'rgba(33, 62, 137, 0.2)',
    
    // Дополнительные оттенки текста
    textQuaternary: '#9ca3af',
    textMuted: '#64748b',
    
    // Дополнительные оттенки фона
    backgroundQuaternary: '#f9fafb',
    backgroundHover: '#f3f4f6',
    backgroundActive: '#e5e7eb',
    backgroundDisabled: '#f3f4f6',
    
    // Дополнительные оттенки границ
    borderQuaternary: '#ced4da',
    inputBorder: '#ced4da',
    inputBorderFocus: '#3b82f6',
    inputBorderError: '#D60000',
    
    // Цвета для инпутов
    inputBg: '#ffffff',
    inputBgDisabled: '#f3f4f6',
    inputBgHover: '#ffffff',
    inputText: '#374151',
    inputPlaceholder: '#6b7280',
    inputError: '#ef4444',
    inputErrorBg: '#ffd6d6',
    
    // Цвета для теней и оверлеев
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    
    // Специальные цвета
    yellow: '#fed521',
    yellowLight: '#fff3cd',
    orange: '#f39c12',
    orangeLight: '#ffeaa7',
    purple: '#8b5cf6',
    purpleLight: '#e0e7ff',
    
    // Дополнительные оттенки primary для градиентов
    primaryGradientStart: '#213e89',
    primaryGradientEnd: '#1a3069',
  }
}

/**
 * Тема для проекта rusaisklad (можно настроить под другую цветовую схему)
 * Пока используем другую палитру - например, зеленую или оранжевую
 */
export const rusaiskladTheme: ThemeConfig = {
  name: 'rusaisklad',
  colors: {
    // Основные цвета (например, зеленые или оранжевые - нужно уточнить)
    primary: '#059669', // emerald-600
    primaryDark: '#047857', // emerald-700
    primaryLight: '#10b981', // emerald-500
    primaryHover: '#047857',
    primaryActive: '#065f46', // emerald-800
    
    // Вторичные цвета
    secondary: '#10b981', // emerald-500
    secondaryDark: '#059669',
    secondaryLight: '#34d399', // emerald-400
    
    // Акцентные цвета
    accent: '#0d9488', // teal-600
    accentDark: '#0f766e',
    accentLight: '#14b8a6',
    
    // Цвета текста
    textPrimary: '#1f2937',
    textSecondary: '#374151',
    textTertiary: '#6b7280',
    textInverse: '#ffffff',
    
    // Цвета фона
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Цвета границ
    border: '#e5e7eb',
    borderLight: '#e2e8f0',
    borderDark: '#d1d5db',
    
    // Статусные цвета
    success: '#22c55e',
    successLight: '#d1fae5',
    successDark: '#16a34a',
    
    error: '#dc3545',
    errorLight: '#fee2e2',
    errorDark: '#c82333',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#0d9488', // teal-600
    infoLight: '#ccfbf1',
    infoDark: '#0f766e',
    
    // Нейтральные цвета
    neutral: '#6b7280',
    neutralLight: '#9ca3af',
    neutralDark: '#374151',
    
    // Дополнительные цвета
    label: '#059669',
    value: '#047857',
    checkboxAccent: '#0d9488',
    focusRing: 'rgba(5, 150, 105, 0.2)',
    
    // Дополнительные оттенки текста
    textQuaternary: '#9ca3af',
    textMuted: '#64748b',
    
    // Дополнительные оттенки фона
    backgroundQuaternary: '#f9fafb',
    backgroundHover: '#f3f4f6',
    backgroundActive: '#e5e7eb',
    backgroundDisabled: '#f3f4f6',
    
    // Дополнительные оттенки границ
    borderQuaternary: '#ced4da',
    inputBorder: '#ced4da',
    inputBorderFocus: '#14b8a6',
    inputBorderError: '#D60000',
    
    // Цвета для инпутов
    inputBg: '#ffffff',
    inputBgDisabled: '#f3f4f6',
    inputBgHover: '#ffffff',
    inputText: '#374151',
    inputPlaceholder: '#6b7280',
    inputError: '#ef4444',
    inputErrorBg: '#ffd6d6',
    
    // Цвета для теней и оверлеев
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    
    // Специальные цвета
    yellow: '#fed521',
    yellowLight: '#fff3cd',
    orange: '#f39c12',
    orangeLight: '#ffeaa7',
    purple: '#8b5cf6',
    purpleLight: '#e0e7ff',
    
    // Дополнительные оттенки primary для градиентов
    primaryGradientStart: '#059669',
    primaryGradientEnd: '#047857',
  }
}

/**
 * Реестр всех доступных тем
 */
export const themes: Record<string, ThemeConfig> = {
  fintech: fintechTheme,
  rusaisklad: rusaiskladTheme,
}

/**
 * Получить тему по имени
 */
export function getTheme(name: string): ThemeConfig {
  return themes[name] || fintechTheme
}
