/**
 * Composable для проверки обновлений приложения
 * Решает проблему с кешированием на Android устройствах
 */
export const useAppUpdate = () => {
  const LAST_CHECK_KEY = 'app_update_last_check'
  const CHECK_INTERVAL = 2 * 60 * 60 * 1000 // Проверяем каждые 2 часа
  const RELOAD_COOLDOWN = 30 * 1000 // Не перезагружаем чаще, чем раз в 30 секунд

  const checkForUpdates = async (force = false): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    // Проверяем, не слишком ли часто мы проверяем
    if (!force) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
      if (lastCheck) {
        const timeSinceLastCheck = Date.now() - parseInt(lastCheck, 10)
        if (timeSinceLastCheck < CHECK_INTERVAL) {
          return false
        }
      }
    }

    try {
      // Получаем текущую версию из манифеста с принудительным обходом кеша
      const timestamp = Date.now()
      const manifestResponse = await fetch(`/site.webmanifest?t=${timestamp}`, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!manifestResponse.ok) {
        console.warn('Не удалось загрузить манифест для проверки обновлений')
        return false
      }

      const manifest = await manifestResponse.json()
      const serverVersion = manifest.version || manifest.start_url?.match(/v=([^&]+)/)?.[1] || '1.0.0'

      // Получаем сохраненную версию из localStorage
      const storedVersion = localStorage.getItem('app_version')
      
      // Если версия еще не сохранена (первый заход), просто сохраняем текущую версию без перезагрузки
      if (!storedVersion) {
        console.log(`Первая загрузка, сохраняем версию: ${serverVersion}`)
        localStorage.setItem('app_version', serverVersion)
        localStorage.setItem(LAST_CHECK_KEY, Date.now().toString())
        return false
      }

      // Сохраняем время последней проверки
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString())

      // Если версии отличаются, значит есть обновление
      if (serverVersion !== storedVersion) {
        console.log(`Обнаружено обновление: ${storedVersion} -> ${serverVersion}`)
        
        // Сохраняем новую версию
        localStorage.setItem('app_version', serverVersion)
        
        // Очищаем кеш браузера
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
            console.log('Кеш браузера очищен')
          } catch (cacheError) {
            console.warn('Ошибка при очистке кеша:', cacheError)
          }
        }

        return true
      }

      return false
    } catch (error) {
      console.error('Ошибка при проверке обновлений:', error)
      return false
    }
  }

  const forceReload = () => {
    if (typeof window !== 'undefined') {
      // Проверяем, не перезагружали ли мы недавно
      const lastReload = sessionStorage.getItem('app_last_reload')
      if (lastReload) {
        const timeSinceLastReload = Date.now() - parseInt(lastReload, 10)
        if (timeSinceLastReload < RELOAD_COOLDOWN) {
          console.log('Перезагрузка пропущена: слишком рано после последней перезагрузки')
          return
        }
      }

      sessionStorage.setItem('app_last_reload', Date.now().toString())
      
      // Принудительная перезагрузка с очисткой кеша
      // Используем location.reload(true) для старых браузеров или просто reload()
      if (navigator.userAgent.includes('Android')) {
        // Для Android используем более агрессивный метод
        window.location.href = window.location.href.split('?')[0] + '?reload=' + Date.now()
      } else {
        window.location.reload()
      }
    }
  }

  const checkAndReload = async (force = false) => {
    const hasUpdate = await checkForUpdates(force)
    if (hasUpdate) {
      // Небольшая задержка для завершения текущих операций
      setTimeout(() => {
        forceReload()
      }, 1000)
    }
  }

  return {
    checkForUpdates,
    forceReload,
    checkAndReload
  }
}

