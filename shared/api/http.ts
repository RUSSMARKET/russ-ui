import axios from 'axios'
import { User } from '@/entities';

let apiBaseURL = 'https://server.rusaifin.ru';
if (typeof window !== 'undefined') {
  const host = window.location.host;
  if (host.startsWith('dev.') || host.startsWith('localhost') || host.includes('192.168') || host.includes('172.20')) {
    apiBaseURL = 'https://dev.server.rusaifin.ru';
  }
  if (host.includes('yandex.')) {
    apiBaseURL = 'https://yandex.server.rusaifin.ru';
  }
}

export const http = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-type': 'application/json'
  }
});

http.interceptors.request.use(
  config => {
    const token = User.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || '';
      
      // Не делаем редирект для запросов страниц при инициализации навигации
      // Это обрабатывается в useNavigation
      const isPagesRequest = requestUrl.includes('/api/pages') || requestUrl.includes('/pages');
      
      if (status === 401 || status === 403) {
        // Для запросов страниц не делаем редирект здесь - это обрабатывается в useNavigation
        if (!isPagesRequest && typeof window !== 'undefined' && window.location.pathname !== '/auth') {
          User.logout();
          // Используем небольшую задержку, чтобы избежать конфликтов
          setTimeout(() => {
            window.location.href = '/auth';
          }, 100);
        }
        return Promise.reject(error);
      }
      const errorMessage = error.response.data?.data || error.response.data?.message || '';
      const errorString = errorMessage.toString().toLowerCase();
      
      if (errorString.includes('ключ не найден') || 
          errorString.includes('key not found') ||
          errorString.includes('пользователь заблокирован') ||
          errorString.includes('user blocked') ||
          errorString.includes('не верный ключ') ||
          errorString.includes('invalid key') ||
          errorString.includes('unauthorized') ||
          errorString.includes('не авторизован')) {
        
        // Для запросов страниц не делаем редирект здесь - это обрабатывается в useNavigation
        if (!isPagesRequest && typeof window !== 'undefined' && window.location.pathname !== '/auth') {
          User.logout();
          // Используем небольшую задержку, чтобы избежать конфликтов
          setTimeout(() => {
            window.location.href = '/auth';
          }, 100);
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);