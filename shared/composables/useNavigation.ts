import { ref, computed, type Ref } from 'vue'
import { User } from '@/entities'
import { useRolesStore } from '~/stores/roles'
import { fetchUserPages } from '@/shared/api'
import { encryptData, decryptData, isEncrypted, createUserEncryptionKey } from '@/shared/utils'

interface Page {
  id: number
  name: string
  code: string
  pivot: {
    role_id: number
    page_id: number
  }
}

let role: Ref<string | null> = ref(null)
let pages: Ref<Page[]> = ref([])
let hiddenPages: Ref<Page[]> = ref([])
let isLoading: Ref<boolean> = ref(false)
let isLoaded: Ref<boolean> = ref(false)
let isMiddlewareLoading: Ref<boolean> = ref(false) 
let hasError: Ref<boolean> = ref(false)
let rolesStore: ReturnType<typeof useRolesStore> | null = null
// Убрана переменная roleWatchDogTimer

// Глобальная функция для быстрой загрузки страниц после авторизации
// Используется сразу после сохранения страниц в localStorage
export const loadPagesAfterAuth = () => {
  if (!process.client) return false
  
  try {
    // Сначала устанавливаем роль из localStorage
    const userRoleString = localStorage.getItem('user_role_string')
    if (userRoleString) {
      role.value = userRoleString
    } else {
      const userRole = localStorage.getItem('user_role')
      if (userRole) {
        role.value = userRole
      }
    }
    
    // Устанавливаем isLoaded СРАЗУ, чтобы контент отобразился мгновенно
    isLoaded.value = true
    isMiddlewareLoading.value = false
    
    const savedPages = localStorage.getItem('user_pages')
    const savedHiddenPages = localStorage.getItem('user_hidden_pages')
    
    if (savedPages && savedHiddenPages) {
      // Проверяем, зашифрованы ли страницы
      const pagesEncrypted = isEncrypted(savedPages)
      const hiddenEncrypted = isEncrypted(savedHiddenPages)
      
      if (!pagesEncrypted && !hiddenEncrypted) {
        // Если не зашифрованы - загружаем СИНХРОННО
        try {
          const parsedPages = JSON.parse(savedPages)
          const parsedHidden = JSON.parse(savedHiddenPages)
          
          if (Array.isArray(parsedPages) && Array.isArray(parsedHidden)) {
            // Устанавливаем страницы напрямую в глобальное состояние
            pages.value = parsedPages
            hiddenPages.value = parsedHidden
            return true
          }
        } catch (parseError) {
          console.warn('Ошибка парсинга страниц из localStorage:', parseError)
        }
      }
    }
  } catch (error) {
    console.warn('Ошибка при загрузке страниц из localStorage:', error)
  }
  
  return false
}

const ICON_MAPPING: Record<string, string> = {
  'home': 'pi pi-home', 
  'project': 'pi pi-folder', 
  'products': 'pi pi-briefcase', 
  'agents': 'pi pi-user',
  'kpi': 'pi pi-calculator',
  'requests': 'pi pi-list-check',
  'education': 'pi pi-graduation-cap',
  'onboarding': 'pi pi-user-plus',
  'logging': 'pi pi-database',
  'reporting': 'pi pi-comments',
  'tasks': 'pi pi-check-circle',
  'clients': 'pi pi-users',
  'upload': 'pi pi-upload',
  'income': 'pi pi-credit-card',
  'inventory': 'pi pi-box',
  'documents': 'pi pi-file',
  'ai': 'pi pi-android',
  'rating': 'pi pi-chart-bar',
  'chats': 'pi pi-comments'
}

const URL_MAPPING: Record<string, string> = {
  'home': '/',
  'project': '/project/',
  'products': '/products/',
  'agents': '/agents/',
  'kpi': '/kpi/',
  'requests': '/requests/',
  'education': '/education/',
  'onboarding': '/onboarding/',
  'tasks': '/tasks/',
  'clients': '/clients/',
  'upload': '/upload/',
  'income': '/income/',
  'inventory': '/inventory/',
  'documents': '/documents/',
  'ai': '/rating/',
  'rating': '/rating/',
  'chats': '/chats/'
}

const PUBLIC_PATHS = ['/', '/auth', '/forgot_password', '/profile', '/options']

// Время жизни кэша страниц: 24 часа
const PAGES_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах

const saveEncryptedPages = async (pages: Page[], hiddenPages: Page[], token: string) => {
  if (!token) {
    throw new Error('Токен отсутствует, невозможно зашифровать страницы')
  }
  
  try {
    // Очищаем старые данные перед сохранением новых
    localStorage.removeItem('user_pages')
    localStorage.removeItem('user_hidden_pages')
    localStorage.removeItem('user_pages_timestamp')
    
    const encryptionKey = createUserEncryptionKey(token)
    
    const pagesData = JSON.stringify(pages)
    const hiddenPagesData = JSON.stringify(hiddenPages)
    
    const encryptedPages = await encryptData(pagesData, encryptionKey)
    const encryptedHiddenPages = await encryptData(hiddenPagesData, encryptionKey)
    
    localStorage.setItem('user_pages', encryptedPages)
    localStorage.setItem('user_hidden_pages', encryptedHiddenPages)
    // Сохраняем timestamp для проверки срока жизни кэша
    localStorage.setItem('user_pages_timestamp', Date.now().toString())
    
  } catch (error) {
    console.error('Ошибка при шифровании страниц:', error)
    throw new Error('Не удалось зашифровать страницы для сохранения')
  }
}

const loadDecryptedPages = async (token: string): Promise<{ pages: Page[], hiddenPages: Page[], needsReencryption?: boolean }> => {
  try {
    const savedPages = localStorage.getItem('user_pages')
    const savedHiddenPages = localStorage.getItem('user_hidden_pages')
    const savedTimestamp = localStorage.getItem('user_pages_timestamp')
    
    if (!savedPages || !savedHiddenPages) {
      return { pages: [], hiddenPages: [] }
    }
    
    // Проверяем срок жизни кэша (24 часа)
    if (savedTimestamp) {
      const cacheAge = Date.now() - parseInt(savedTimestamp, 10)
      if (cacheAge > PAGES_CACHE_TTL) {
        // Кэш устарел, очищаем его
        localStorage.removeItem('user_pages')
        localStorage.removeItem('user_hidden_pages')
        localStorage.removeItem('user_pages_timestamp')
        return { pages: [], hiddenPages: [] }
      }
    }
    
    if (isEncrypted(savedPages) && isEncrypted(savedHiddenPages)) {
      const encryptionKey = createUserEncryptionKey(token)
      
      const decryptedPagesData = await decryptData(savedPages, encryptionKey)
      const decryptedHiddenPagesData = await decryptData(savedHiddenPages, encryptionKey)
      
      const pages = JSON.parse(decryptedPagesData)
      const hiddenPages = JSON.parse(decryptedHiddenPagesData)
      
      return { pages, hiddenPages }
    } else {
      const pages = JSON.parse(savedPages)
      const hiddenPages = JSON.parse(savedHiddenPages)
      
      return { pages, hiddenPages, needsReencryption: true }
    }
  } catch (error) {
    console.error('Ошибка при дешифровании страниц:', error)
    return { pages: [], hiddenPages: [] }
  }
}

export const useNavigation = () => {
  if (!rolesStore) {
    rolesStore = useRolesStore()
  }

  const isKnownRole = (roleCode: string) => {
    // @ts-ignore - игнорируем строгую проверку типов для roleCode
    return Object.values(rolesStore!.ROLES).includes(roleCode)
  }

  const isAllowedPath = (roleCode: string, path: string) => {
    if (!rolesStore) return false
    
    if (path === '/') {
      return true
    }

    if (rolesStore.isNewUser(roleCode)) {
      return path === '/profile'
    }
    
    if (PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
      return true
    }
    
    if (path.startsWith('/admin')) {
      return rolesStore.isAdmin(roleCode)
    }
    
    if (pages.value.length === 0 && hiddenPages.value.length === 0) {
      return PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))
    }
    
    const normalize = (p: string) => p.replace(/\/+$/, '')
    const currentPath = normalize(path)
    
    const allPages = [...pages.value, ...hiddenPages.value]
    
    return allPages.some(page => {
      const pagePath = URL_MAPPING[page.code] || `/${page.code}/`
      const normalizedPagePath = normalize(pagePath)
      return currentPath === normalizedPagePath || (normalizedPagePath !== '' && currentPath.startsWith(normalizedPagePath))
    })
  }

  const loadPages = async () => {
    if (isLoading.value) {
      return
    }
    
    isLoading.value = true
    hasError.value = false
    
    try {
      const token = User.getToken()
      if (!token) {
        console.warn('Токен отсутствует, невозможно загрузить страницы')
        pages.value = []
        hiddenPages.value = []
        return
      }
      
      // Всегда делаем запрос к API при входе и перезаписываем страницы
      try {
        const response = await fetchUserPages()
        
        if (response.status && response.pages) {
          pages.value = response.pages
          hiddenPages.value = response.hidden || []
          
          try {
            await saveEncryptedPages(pages.value, hiddenPages.value, token)
          } catch (encryptionError) {
            console.error('Ошибка при шифровании страниц с API:', encryptionError)
            // Не очищаем страницы при ошибке шифрования, они уже загружены
          }
        } else {
          console.warn('API вернул некорректный ответ')
          // При ошибке API пытаемся загрузить из кэша как fallback
          const { pages: loadedPages, hiddenPages: loadedHiddenPages } = await loadDecryptedPages(token)
          pages.value = loadedPages
          hiddenPages.value = loadedHiddenPages
        }
      } catch (apiError: any) {
        console.error('Ошибка при запросе страниц с API:', apiError)
        
        // Проверяем, является ли ошибка критической (401/403 - невалидный токен)
        const isAuthError = apiError?.response?.status === 401 || apiError?.response?.status === 403
        
        if (isAuthError) {
          // Если токен невалидный, очищаем данные и не пытаемся загружать из кэша
          console.warn('Токен невалидный или истек при загрузке страниц. Очищаем данные пользователя.')
          const { User } = await import('@/entities')
          
          // Проверяем, что токен действительно невалидный (не временная сетевая ошибка)
          // Если это повторная попытка после инициализации, значит токен точно невалидный
          const currentToken = User.getToken()
          if (!currentToken || currentToken === token) {
            // Токен действительно невалидный или отсутствует
            User.logout()
            pages.value = []
            hiddenPages.value = []
            hasError.value = true
            
            // Редирект на авторизацию только если мы не на публичной странице
            if (process.client && !window.location.pathname.startsWith('/auth')) {
              // Используем небольшую задержку, чтобы избежать конфликтов с другими редиректами
              setTimeout(() => {
                window.location.href = '/auth'
              }, 100)
            }
            return
          }
          // Если токен изменился, возможно это временная ошибка, пробуем загрузить из кэша
        }
        
        // При других ошибках API пытаемся загрузить из кэша как fallback
        try {
          const { pages: loadedPages, hiddenPages: loadedHiddenPages } = await loadDecryptedPages(token)
          pages.value = loadedPages
          hiddenPages.value = loadedHiddenPages
        } catch (cacheError) {
          console.error('Ошибка при загрузке из кэша:', cacheError)
          hasError.value = true
          pages.value = []
          hiddenPages.value = []
        }
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке страниц:', error)
      hasError.value = true
      pages.value = []
      hiddenPages.value = []
    } finally {
      isLoading.value = false
    }
  }

  const initializeNavigation = async () => {
    if (isLoading.value) {
      return
    }
    
    hasError.value = false
    
    // Устанавливаем isLoaded СРАЗУ в начале функции
    // Это позволяет контенту отобразиться мгновенно, не дожидаясь всех проверок
    isLoaded.value = true
    isMiddlewareLoading.value = false
    
    try {
      // Убеждаемся, что User инициализирован
      if (process.client) {
        User.init()
      }
      
      const userRole = User.getRole()
      role.value = userRole !== null ? String(userRole) : null
      
      // Если роль не найдена, но токен есть, быстро проверяем еще раз
      if (!role.value && process.client) {
        const token = localStorage.getItem('access_token')
        if (token) {
          // Без задержки - просто повторная инициализация
          User.init()
          const retryUserRole = User.getRole()
          role.value = retryUserRole !== null ? String(retryUserRole) : null
        }
      }

      if (!role.value) {
        pages.value = []
        hiddenPages.value = []
        return
      }

      if (rolesStore!.isNewUser(role.value)) {
        pages.value = []
        hiddenPages.value = []
        return
      }

      const token = User.getToken()
      if (!token) {
        pages.value = []
        hiddenPages.value = []
        return
      }

      // СНАЧАЛА быстро загружаем страницы из localStorage (если они есть в виде JSON)
      // Это работает мгновенно, так как не требует дешифрования
      // Это критично для быстрой загрузки после авторизации
      const savedPages = localStorage.getItem('user_pages')
      const savedHiddenPages = localStorage.getItem('user_hidden_pages')
      
      if (savedPages && savedHiddenPages) {
        // Проверяем, зашифрованы ли страницы
        const pagesEncrypted = isEncrypted(savedPages)
        const hiddenEncrypted = isEncrypted(savedHiddenPages)
        
        if (!pagesEncrypted && !hiddenEncrypted) {
          // Если не зашифрованы - загружаем СИНХРОННО (это происходит при авторизации)
          // Это работает мгновенно, без await
          try {
            const parsedPages = JSON.parse(savedPages)
            const parsedHidden = JSON.parse(savedHiddenPages)
            
            if (Array.isArray(parsedPages) && Array.isArray(parsedHidden)) {
              pages.value = parsedPages
              hiddenPages.value = parsedHidden
              // Страницы уже загружены синхронно, можно выходить
              // Загрузка из API произойдет в фоне позже
              return
            }
          } catch (parseError) {
            // Если ошибка парсинга, продолжаем загрузку через decrypt
            console.warn('Ошибка парсинга страниц из localStorage:', parseError)
          }
        }
      }

      // Если страницы зашифрованы или их нет, загружаем через decrypt (асинхронно)
      // Это происходит при обновлении страницы, когда страницы уже зашифрованы
      loadDecryptedPages(token)
        .then(({ pages: cachedPages, hiddenPages: cachedHiddenPages }) => {
          if (cachedPages.length > 0 || cachedHiddenPages.length > 0) {
            pages.value = cachedPages
            hiddenPages.value = cachedHiddenPages
          }
        })
        .catch(cacheError => {
          // Игнорируем ошибки загрузки из кэша - это не критично
          console.warn('Не удалось загрузить страницы из кэша:', cacheError)
        })

      // Загружаем страницы из API в фоне, не блокируя UI
      // Используем небольшую задержку, чтобы контент успел отобразиться
      setTimeout(() => {
        loadPages().catch(error => {
          console.error('Ошибка при загрузке страниц из API:', error)
        })
      }, 200)
    } catch (error) {
      console.error('Ошибка при инициализации навигации:', error)
      pages.value = []
      hiddenPages.value = []
      isLoaded.value = true
      isMiddlewareLoading.value = false
    }
  }

  const getNavItems = (roleCode: string | null) => {
    if (!rolesStore) {
      return { main: [], more: [] }
    }
    
    if (pages.value.length > 0) {
      const allNavItems = pages.value.map(page => ({
        to: URL_MAPPING[page.code] || `/${page.code}/`,
        icon: ICON_MAPPING[page.code] || 'pi pi-clock', 
        label: page.name,
        key: page.code
      }))
      
      const hiddenNavItems = hiddenPages.value.map(page => ({
        to: URL_MAPPING[page.code] || `/${page.code}/`,
        icon: ICON_MAPPING[page.code] || 'pi pi-clock', 
        label: page.name,
        key: page.code
      }))
      
      if (rolesStore.isAdmin(roleCode)) {
        if (hiddenPages.value.length > 0) {
          return {
            main: allNavItems,
            more: hiddenNavItems
          }
        }
        
        if (allNavItems.length > 5) {
          const mainItems = allNavItems.slice(0, 5)
          const moreItems = allNavItems.slice(5)
          return {
            main: mainItems,
            more: moreItems
          }
        }
        
        return {
          main: allNavItems,
          more: []
        }
      }
      
      return {
        main: allNavItems,
        more: []
      }
    }
    
    return { main: [], more: [] }
  }

  // Убрана функция startRoleWatchDog для упрощения логики

  const resetNavigation = () => {
    // Убрана логика roleWatchDogTimer
    role.value = null
    pages.value = []
    hiddenPages.value = []
    isLoading.value = false
    isLoaded.value = false
    isMiddlewareLoading.value = false
    hasError.value = false
    
    if (process.client) {
      localStorage.removeItem('user_pages')
      localStorage.removeItem('user_hidden_pages')
      localStorage.removeItem('user_pages_timestamp')
    }
  }

  const refreshPages = async () => {
    if (isLoading.value) {
      return
    }
    
    isLoading.value = true
    hasError.value = false
    
    try {
      const token = User.getToken()
      if (!token) {
        console.warn('Токен отсутствует, невозможно обновить страницы')
        hasError.value = true
        return
      }
      
      const response = await fetchUserPages()
      
      if (response.status && response.pages) {
        pages.value = response.pages
        hiddenPages.value = response.hidden || []
        
        try {
          await saveEncryptedPages(pages.value, hiddenPages.value, token)
        } catch (encryptionError) {
          console.error('Ошибка при шифровании обновленных страниц:', encryptionError)
          pages.value = []
          hiddenPages.value = []
          throw encryptionError
        }
      } else {
        console.warn('API вернул некорректный ответ при обновлении страниц')
        hasError.value = true
      }
    } catch (error: any) {
      console.error('Ошибка при обновлении страниц с API:', error)
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  const reencryptExistingPages = async () => {
    if (isLoading.value) {
      return
    }
    
    isLoading.value = true
    hasError.value = false
    
    try {
      const token = User.getToken()
      if (!token) {
        console.warn('Токен отсутствует, невозможно перешифровать страницы')
        hasError.value = true
        return
      }
      
      const { pages: loadedPages, hiddenPages: loadedHiddenPages, needsReencryption } = await loadDecryptedPages(token)
      
      if (needsReencryption && loadedPages.length > 0) {
        try {
          await saveEncryptedPages(loadedPages, loadedHiddenPages, token)
          
          pages.value = loadedPages
          hiddenPages.value = loadedHiddenPages
        } catch (error) {
          console.error('Ошибка при перешифровании существующих страниц:', error)
          hasError.value = true
        }
      } else {
      }
    } catch (error: any) {
      console.error('Ошибка при проверке шифрования страниц:', error)
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  // Убраны слушатели storage и интервалы для упрощения логики

  // Функция для быстрой загрузки страниц из localStorage (синхронно)
  // Используется сразу после авторизации, когда страницы еще не зашифрованы
  const loadPagesFromLocalStorage = () => {
    if (!process.client) return false
    
    try {
      const savedPages = localStorage.getItem('user_pages')
      const savedHiddenPages = localStorage.getItem('user_hidden_pages')
      
      if (savedPages && savedHiddenPages) {
        // Проверяем, зашифрованы ли страницы
        const pagesEncrypted = isEncrypted(savedPages)
        const hiddenEncrypted = isEncrypted(savedHiddenPages)
        
        if (!pagesEncrypted && !hiddenEncrypted) {
          // Если не зашифрованы - загружаем СИНХРОННО
          try {
            const parsedPages = JSON.parse(savedPages)
            const parsedHidden = JSON.parse(savedHiddenPages)
            
            if (Array.isArray(parsedPages) && Array.isArray(parsedHidden)) {
              pages.value = parsedPages
              hiddenPages.value = parsedHidden
              return true
            }
          } catch (parseError) {
            console.warn('Ошибка парсинга страниц из localStorage:', parseError)
          }
        }
      }
    } catch (error) {
      console.warn('Ошибка при загрузке страниц из localStorage:', error)
    }
    
    return false
  }

  return {
    role: computed(() => role.value),
    pages: computed(() => pages.value),
    hiddenPages: computed(() => hiddenPages.value),
    isLoading: computed(() => isLoading.value),
    isLoaded: computed(() => isLoaded.value),
    isMiddlewareLoading: computed(() => isMiddlewareLoading.value),
    hasError: computed(() => hasError.value),
    isKnownRole,
    isAllowedPath,
    PUBLIC_PATHS,
    initializeNavigation,
    getNavItems,
    loadPages,
    loadPagesFromLocalStorage,
    resetNavigation,
    refreshPages,
    reencryptExistingPages,
    // Убрана функция startRoleWatchDog
  }
}
