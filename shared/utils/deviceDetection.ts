/**
 * Утилиты для определения типа устройства
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape' | 'unknown';
}

/**
 * Определяет информацию об устройстве
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isEdge: false,
      hasTouch: false,
      orientation: 'unknown'
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;

  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
  const isFirefox = /firefox/.test(userAgent);
  const isEdge = /edge/.test(userAgent);

  const isIOS = /ipad|iphone|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  const width = window.innerWidth;
  const height = window.innerHeight;

  let orientation: 'portrait' | 'landscape' | 'unknown' = 'unknown';
  if (width > height) {
    orientation = 'landscape';
  } else if (height > width) {
    orientation = 'portrait';
  }

  let isMobile = false;
  let isTablet = false;
  let isDesktop = true;

  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    isMobile = true;
    isDesktop = false;
  }

  if (width <= 768 || (hasTouch && maxTouchPoints > 2)) {
    isMobile = true;
    isDesktop = false;
  }

  if (width > 768 && width <= 1024 && hasTouch) {
    isTablet = true;
    isMobile = false;
    isDesktop = false;
  }

  if (isIOS && maxTouchPoints > 2 && width > 768) {
    isTablet = true;
    isMobile = false;
    isDesktop = false;
  }

  if (window.matchMedia) {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const tabletQuery = window.matchMedia('(min-width: 769px) and (max-width: 1024px)');
    
    if (mobileQuery.matches) {
      isMobile = true;
      isDesktop = false;
    } else if (tabletQuery.matches && hasTouch) {
      isTablet = true;
      isMobile = false;
      isDesktop = false;
    }
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    hasTouch,
    orientation
  };
}

/**
 * Проверяет, является ли устройство мобильным
 */
export function isMobileDevice(): boolean {
  return getDeviceInfo().isMobile;
}

/**
 * Проверяет, является ли устройство планшетом
 */
export function isTabletDevice(): boolean {
  return getDeviceInfo().isTablet;
}

/**
 * Проверяет, является ли устройство десктопом
 */
export function isDesktopDevice(): boolean {
  return getDeviceInfo().isDesktop;
}

/**
 * Проверяет, является ли устройство iOS
 */
export function isIOSDevice(): boolean {
  return getDeviceInfo().isIOS;
}

/**
 * Проверяет, является ли устройство Android
 */
export function isAndroidDevice(): boolean {
  return getDeviceInfo().isAndroid;
}

/**
 * Проверяет, поддерживает ли устройство touch события
 */
export function hasTouchSupport(): boolean {
  return getDeviceInfo().hasTouch;
}

/**
 * Получает текущую ориентацию устройства
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' | 'unknown' {
  return getDeviceInfo().orientation;
}

/**
 * Создает реактивную переменную для отслеживания изменений устройства
 */
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue';

export function useDeviceDetection() {
  const deviceInfo = ref<DeviceInfo>(getDeviceInfo());

  const updateDeviceInfo = () => {
    deviceInfo.value = getDeviceInfo();
  };

  onMounted(() => {
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateDeviceInfo);
    window.removeEventListener('orientationchange', updateDeviceInfo);
  });

  return {
    deviceInfo: readonly(deviceInfo),
    isMobile: computed(() => deviceInfo.value.isMobile),
    isTablet: computed(() => deviceInfo.value.isTablet),
    isDesktop: computed(() => deviceInfo.value.isDesktop),
    isIOS: computed(() => deviceInfo.value.isIOS),
    isAndroid: computed(() => deviceInfo.value.isAndroid),
    hasTouch: computed(() => deviceInfo.value.hasTouch),
    orientation: computed(() => deviceInfo.value.orientation)
  };
}
