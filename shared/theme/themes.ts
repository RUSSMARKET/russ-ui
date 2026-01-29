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
 * Тема для проекта rusaisklad (склад) — серая палитра
 * Зелёные оттенки заменены на серые по значению и яркости
 */
export const rusaiskladTheme: ThemeConfig = {
  name: 'rusaisklad',
  colors: {
    // Основные цвета (серые: primary ~ gray-500, dark ~ gray-600/700, light ~ gray-400)
    primary: '#6b7280',       // gray-500
    primaryDark: '#4b5563',   // gray-600
    primaryLight: '#9ca3af',  // gray-400
    primaryHover: '#4b5563',
    primaryActive: '#374151', // gray-700
    
    // Вторичные цвета
    secondary: '#9ca3af',     // gray-400
    secondaryDark: '#6b7280', // gray-500
    secondaryLight: '#d1d5db', // gray-300
    
    // Акцентные цвета
    accent: '#6b7280',       // gray-500
    accentDark: '#4b5563',    // gray-600
    accentLight: '#9ca3af',   // gray-400
    
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
    
    // Статусные цвета (success/error/warning оставлены для семантики)
    success: '#22c55e',
    successLight: '#d1fae5',
    successDark: '#16a34a',
    
    error: '#dc3545',
    errorLight: '#fee2e2',
    errorDark: '#c82333',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#6b7280',         // gray-500 вместо teal
    infoLight: '#f3f4f6',    // gray-100
    infoDark: '#4b5563',     // gray-600
    
    // Нейтральные цвета
    neutral: '#6b7280',
    neutralLight: '#9ca3af',
    neutralDark: '#374151',
    
    // Дополнительные цвета
    label: '#6b7280',
    value: '#4b5563',
    checkboxAccent: '#6b7280',
    focusRing: 'rgba(107, 114, 128, 0.2)',
    
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
    inputBorderFocus: '#9ca3af',  // gray-400
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
    primaryGradientStart: '#6b7280',  // gray-500
    primaryGradientEnd: '#4b5563',     // gray-600
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
