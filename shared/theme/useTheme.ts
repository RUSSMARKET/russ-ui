import { ref, computed, onMounted } from 'vue'
import type { ThemeConfig, ThemeName } from './types'
import { getTheme, fintechTheme } from './themes'
import { applyTheme } from './utils'

/**
 * Composable для управления темой приложения
 */
export function useTheme(initialTheme?: ThemeName) {
  // Определяем начальную тему: из параметра, localStorage или по умолчанию
  let startTheme: ThemeName = 'fintech'
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('russ-ui-theme')
    startTheme = (initialTheme || savedTheme || 'fintech') as ThemeName
  } else if (initialTheme) {
    startTheme = initialTheme
  }

  const currentThemeName = ref<ThemeName>(startTheme)
  const currentTheme = ref<ThemeConfig>(getTheme(startTheme))

  // Применяем тему сразу при инициализации
  if (typeof window !== 'undefined') {
    applyTheme(currentTheme.value)
  }

  /**
   * Применить тему
   */
  const setTheme = (themeName: ThemeName) => {
    const theme = getTheme(themeName)
    currentThemeName.value = themeName
    currentTheme.value = theme
    applyTheme(theme)
    
    // Сохраняем выбор в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('russ-ui-theme', themeName)
    }
  }

  /**
   * Инициализация темы при монтировании (для случаев, когда composable используется в компоненте)
   */
  onMounted(() => {
    // Проверяем, не изменилась ли сохраненная тема
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('russ-ui-theme')
      if (savedTheme && savedTheme !== currentThemeName.value) {
        setTheme(savedTheme as ThemeName)
      } else {
        // Убеждаемся, что тема применена
        applyTheme(currentTheme.value)
      }
    }
  })

  /**
   * Вычисляемые свойства для удобного доступа к цветам
   */
  const colors = computed(() => currentTheme.value.colors)

  return {
    theme: currentTheme,
    themeName: currentThemeName,
    colors,
    setTheme,
  }
}
