/**
 * Проверяет доступность localStorage
 * В режиме инкогнито localStorage может быть недоступен
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Безопасно получает значение из localStorage
 * Возвращает null если localStorage недоступен или ключ не найден
 */
export const safeGetLocalStorage = (key: string): string | null => {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Ошибка при получении ${key} из localStorage:`, e);
    return null;
  }
};

/**
 * Безопасно устанавливает значение в localStorage
 * Возвращает true если операция успешна, false если localStorage недоступен
 */
export const safeSetLocalStorage = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage недоступен. Данные не сохранены.');
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Ошибка при сохранении ${key} в localStorage:`, e);
    return false;
  }
};

/**
 * Безопасно удаляет значение из localStorage
 * Возвращает true если операция успешна, false если localStorage недоступен
 */
export const safeRemoveLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Ошибка при удалении ${key} из localStorage:`, e);
    return false;
  }
};
