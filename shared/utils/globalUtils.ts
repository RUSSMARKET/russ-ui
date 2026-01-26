/**
 * Глобальные утилиты для предотвращения ошибок
 */

/**
 * Безопасная проверка существования свойства объекта
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Безопасный вызов функции
 */
export function safeCall<T>(fn: any, ...args: any[]): T | null {
  if (typeof fn === 'function') {
    try {
      return fn(...args);
    } catch (error) {
      console.warn('Safe call failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Проверяет, является ли значение функцией
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * Проверяет, является ли значение объектом
 */
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Проверяет, является ли значение массивом
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Проверяет, является ли значение строкой
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Проверяет, является ли значение числом
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Проверяет, является ли значение булевым
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Проверяет, является ли значение null или undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Безопасное получение значения из localStorage
 */
export function safeLocalStorageGet(key: string, defaultValue: any = null): any {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Безопасная установка значения в localStorage
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Безопасное удаление значения из localStorage
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Безопасное выполнение кода только на клиенте
 */
export function safeClientExecute<T>(fn: () => T, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    return fn();
  } catch (error) {
    console.warn('Client execution failed:', error);
    return defaultValue;
  }
}

/**
 * Безопасное получение значения из sessionStorage
 */
export function safeSessionStorageGet(key: string, defaultValue: any = null): any {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to get sessionStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Безопасная установка значения в sessionStorage
 */
export function safeSessionStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Безопасное удаление значения из sessionStorage
 */
export function safeSessionStorageRemove(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Ожидание появления токена в localStorage
 */
export async function waitForToken(maxWaitMs: number = 3000, intervalMs: number = 150): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token) return resolve(token);
      if (Date.now() - startedAt >= maxWaitMs) return resolve(null);
      setTimeout(check, intervalMs);
    };
    check();
  });
}