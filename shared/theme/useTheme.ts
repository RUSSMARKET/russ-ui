import { ref, computed, onMounted } from 'vue'
import type { ColorScheme, ThemeConfig, ThemeName } from './types'
import { getTheme, fintechTheme } from './themes'
import { applyTheme, resolveThemeColors } from './utils'

const STORAGE_THEME = 'russ-ui-theme'
const STORAGE_SCHEME = 'russ-ui-color-scheme'

function readStoredScheme(): ColorScheme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  const raw = localStorage.getItem(STORAGE_SCHEME)
  return raw === 'dark' ? 'dark' : 'light'
}

/**
 * Composable для управления темой приложения (бренд fintech / rusaisklad и светлая / тёмная схема)
 */
export function useTheme(initialTheme?: ThemeName) {
  let startTheme: ThemeName = 'fintech'
  let startScheme: ColorScheme = 'light'
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem(STORAGE_THEME)
    startTheme = (initialTheme || savedTheme || 'fintech') as ThemeName
    startScheme = readStoredScheme()
  } else if (initialTheme) {
    startTheme = initialTheme
  }

  const currentThemeName = ref<ThemeName>(startTheme)
  const colorScheme = ref<ColorScheme>(startScheme)
  const currentTheme = ref<ThemeConfig>(getTheme(startTheme))

  if (typeof window !== 'undefined') {
    applyTheme(currentTheme.value, colorScheme.value)
  }

  const setTheme = (themeName: ThemeName) => {
    const theme = getTheme(themeName)
    currentThemeName.value = themeName
    currentTheme.value = theme
    applyTheme(theme, colorScheme.value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THEME, themeName)
    }
  }

  const setColorScheme = (scheme: ColorScheme) => {
    colorScheme.value = scheme
    applyTheme(currentTheme.value, scheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SCHEME, scheme)
    }
  }

  const toggleColorScheme = () => {
    setColorScheme(colorScheme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(STORAGE_THEME)
      if (savedTheme && savedTheme !== currentThemeName.value) {
        const theme = getTheme(savedTheme)
        currentThemeName.value = savedTheme as ThemeName
        currentTheme.value = theme
      }
      const scheme = readStoredScheme()
      if (scheme !== colorScheme.value) {
        colorScheme.value = scheme
      }
      applyTheme(currentTheme.value, colorScheme.value)
    }
  })

  const colors = computed(() => resolveThemeColors(currentTheme.value, colorScheme.value))

  return {
    theme: currentTheme,
    themeName: currentThemeName,
    colorScheme,
    colors,
    setTheme,
    setColorScheme,
    toggleColorScheme,
  }
}
