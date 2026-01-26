import { computed } from 'vue'

/**
 * Композабл для проверки, является ли текущий хост Яндексом
 * @returns {ComputedRef<boolean>} true, если хост содержит 'yandex.'
 */
export function useYandexHost() {
  const isYandexHost = computed(() => {
    if (typeof window === 'undefined') return false
    return window.location.host.includes('yandex.')
  })

  return {
    isYandexHost
  }
}
