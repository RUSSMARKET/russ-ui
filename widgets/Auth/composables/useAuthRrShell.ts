import { onBeforeUnmount, onMounted } from 'vue';
import {
  isBelowSplitLayoutWidth,
  readAdaptivesBreakpoints,
} from 'bibli/shared/tokens/adaptives.js';
import { applyRussRedesign } from 'bibli/shared/theme/rr/useRussRedesign';

type DatasetSnapshot = Record<string, string | undefined>;

const COMPACT_LEVELS = ['', '1', '2', '3', '4'] as const;
const KEYBOARD_HEIGHT_RATIO = 0.78;
const KEYBOARD_GAP_PX = 120;

let lockedLayoutH = 0;

function getVisualHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.visualViewport?.height ?? window.innerHeight;
}

function getLayoutHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerHeight;
}

function measureOverflow(): boolean {
  const shell = document.querySelector('.auth-rr-shell');
  if (!shell) {
    return false;
  }
  if (shell.scrollHeight > shell.clientHeight + 1) {
    return true;
  }

  // Скролл живёт в .auth-rr-main (overflow-y: auto) — без этой проверки
  // compact не включается, и на десктопе остаётся полоса прокрутки.
  const main = document.querySelector('.auth-rr-main');
  return Boolean(main && main.scrollHeight > main.clientHeight + 1);
}

function syncVisualHeightUnit(): void {
  const layoutH = getLayoutHeight();
  const visualH = getVisualHeight();
  if (!lockedLayoutH || layoutH > lockedLayoutH) {
    lockedLayoutH = layoutH;
  }
  document.documentElement.style.setProperty('--vvh', `${lockedLayoutH * 0.01}px`);
  document.documentElement.style.setProperty('--auth-vvh-visual', `${visualH * 0.01}px`);
}

function syncKeyboardState(): void {
  const layoutH = lockedLayoutH || getLayoutHeight();
  const visualH = getVisualHeight();
  if (layoutH - visualH > KEYBOARD_GAP_PX) {
    document.documentElement.dataset.rrKeyboard = 'open';
    return;
  }
  const vv = window.visualViewport;
  if (vv && vv.height < window.innerHeight * KEYBOARD_HEIGHT_RATIO) {
    document.documentElement.dataset.rrKeyboard = 'open';
    return;
  }
  delete document.documentElement.dataset.rrKeyboard;
}

function syncLayoutMode(): void {
  const { splitMin } = readAdaptivesBreakpoints();
  const split = window.innerWidth >= splitMin;
  document.documentElement.dataset.rrLayout = split ? 'split' : 'stacked';
}

function syncViewportTokens(): void {
  document.documentElement.dataset.rrViewport = isBelowSplitLayoutWidth()
    ? 'mobile'
    : 'desktop';
}

function syncCompactLevel(forceStackedRetry = false): void {
  if (document.documentElement.dataset.rrKeyboard === 'open') {
    delete document.documentElement.dataset.rrCompact;
    delete document.documentElement.dataset.rrScroll;
    syncViewportTokens();
    return;
  }

  if (!forceStackedRetry) {
    delete document.documentElement.dataset.rrCompact;
    delete document.documentElement.dataset.rrScroll;
    syncViewportTokens();
  }

  for (const level of COMPACT_LEVELS) {
    if (level) {
      document.documentElement.dataset.rrCompact = level;
    } else if (!forceStackedRetry) {
      delete document.documentElement.dataset.rrCompact;
    }
    syncViewportTokens();
    if (!measureOverflow()) {
      delete document.documentElement.dataset.rrScroll;
      return;
    }
  }

  if (!forceStackedRetry && document.documentElement.dataset.rrLayout === 'split') {
    document.documentElement.dataset.rrLayout = 'stacked';
    syncViewportTokens();
    syncCompactLevel(true);
    return;
  }

  if (measureOverflow()) {
    document.documentElement.dataset.rrScroll = '1';
  } else {
    delete document.documentElement.dataset.rrScroll;
  }
}

function resetFormShift(): void {
  document.documentElement.style.setProperty('--auth-rr-shift-y', '0px');
}

function shiftFocusedFieldIntoView(target: HTMLElement): void {
  const field = target.closest?.(
    '.auth-rr-field, .auth-rr-button, .auth-rr-input, .auth-rr-callback-actions',
  ) as HTMLElement | null;
  if (!field) {
    resetFormShift();
    return;
  }

  resetFormShift();

  const main = document.querySelector('.auth-rr-main') as HTMLElement | null;
  const vv = window.visualViewport;
  if (!main || !vv) {
    field.scrollIntoView({ block: 'center', inline: 'nearest' });
    return;
  }

  const fieldRect = field.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const safeTop = Math.max(vv.offsetTop + 8, mainRect.top + 8);
  const safeBottom = vv.offsetTop + vv.height - 16;

  if (fieldRect.bottom > safeBottom) {
    main.scrollTop += Math.ceil(fieldRect.bottom - safeBottom);
  } else if (fieldRect.top < safeTop) {
    main.scrollTop -= Math.ceil(safeTop - fieldRect.top);
  }
}

function syncAuthRrViewport(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  syncVisualHeightUnit();
  syncKeyboardState();
  syncLayoutMode();
  syncCompactLevel();
}

function onViewportChange(): void {
  syncAuthRrViewport();
  window.requestAnimationFrame(syncAuthRrViewport);
}

function onFocusIn(event: FocusEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (!target.closest('.auth-rr-input__control, input, textarea, select, [contenteditable="true"]')) {
    return;
  }
  window.requestAnimationFrame(() => {
    syncAuthRrViewport();
    shiftFocusedFieldIntoView(target);
  });
}

function onFocusOut(): void {
  window.requestAnimationFrame(() => {
    resetFormShift();
    syncAuthRrViewport();
  });
}

function snapshotRrDocumentState(): {
  hadDataRr: boolean;
  dataset: DatasetSnapshot;
  vvh: string;
  shiftY: string;
} {
  const root = document.documentElement;
  const dataset: DatasetSnapshot = {};

  for (const key of [
    'colorMode',
    'rrDensity',
    'rrViewport',
    'rrLayout',
    'rrKeyboard',
    'rrCompact',
    'rrScroll',
  ] as const) {
    dataset[key] = root.dataset[key];
  }

  return {
    hadDataRr: root.hasAttribute('data-rr'),
    dataset,
    vvh: root.style.getPropertyValue('--vvh'),
    shiftY: root.style.getPropertyValue('--auth-rr-shift-y'),
  };
}

function restoreRrDocumentState(snapshot: ReturnType<typeof snapshotRrDocumentState>): void {
  const root = document.documentElement;

  if (snapshot.hadDataRr) {
    root.setAttribute('data-rr', '');
  } else {
    root.removeAttribute('data-rr');
  }

  for (const [key, value] of Object.entries(snapshot.dataset)) {
    if (value === undefined) {
      delete root.dataset[key as keyof typeof root.dataset];
    } else {
      root.dataset[key as keyof typeof root.dataset] = value;
    }
  }

  if (snapshot.vvh) {
    root.style.setProperty('--vvh', snapshot.vvh);
  } else {
    root.style.removeProperty('--vvh');
  }

  if (snapshot.shiftY) {
    root.style.setProperty('--auth-rr-shift-y', snapshot.shiftY);
  } else {
    root.style.removeProperty('--auth-rr-shift-y');
  }
}

/**
 * Включает Russ Redesign (токены --rr-*, data-rr-*) для auth callback shell.
 * Снимает атрибуты при unmount, чтобы не затронуть основное приложение.
 */
export function useAuthRrShell(): void {
  let snapshot: ReturnType<typeof snapshotRrDocumentState> | null = null;

  function onOrientationChange(): void {
    lockedLayoutH = 0;
    onViewportChange();
  }

  onMounted(() => {
    snapshot = snapshotRrDocumentState();
    applyRussRedesign({ enabled: true, colorMode: 'light', density: '100' });
    onViewportChange();

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onOrientationChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('orientationchange', onOrientationChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    resetFormShift();
    lockedLayoutH = 0;

    if (snapshot) {
      restoreRrDocumentState(snapshot);
    }
  });
}
