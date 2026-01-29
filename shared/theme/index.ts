/**
 * Система тем для russ-ui
 * 
 * Использование:
 * 
 * 1. Импортируйте CSS переменные в ваш проект:
 *    import '@russ-ui/bibli/shared/theme/theme.css'
 * 
 * 2. Используйте composable в компонентах:
 *    import { useTheme } from '@russ-ui/bibli/shared/theme'
 *    const { setTheme, colors } = useTheme('fintech')
 * 
 * 3. Или установите тему глобально в app.vue:
 *    import { useTheme } from '@russ-ui/bibli/shared/theme'
 *    useTheme('fintech') // или 'rusaisklad'
 */

export * from './types'
export * from './themes'
export * from './useTheme'
export * from './utils'
