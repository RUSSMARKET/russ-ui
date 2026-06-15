import { onBeforeUnmount, onMounted } from 'vue';
import {
  isBelowSplitLayoutWidth,
  readAdaptivesBreakpoints,
} from 'bibli/shared/tokens/adaptives.js';
import { applyRussRedesign } from 'bibli/shared/theme/useRussRedesign';

type DatasetSnapshot = Record<string, string | undefined>;

function getVisualHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.visualViewport?.height ?? window.innerHeight;
}

function syncVisualHeightUnit(): void {
  const h = getVisualHeight();
  document.documentElement.style.setProperty('--vvh', `${h * 0.01}px`);
}

function syncLayoutMode(): void {
  const { splitMin } = readAdaptivesBreakpoints();
  const split = window.innerWidth >= splitMin;
  document.documentElement.dataset.rrLayout = split ? 'split' : 'stacked';
}

function syncViewportTokens(): void {
  const mobile = isBelowSplitLayoutWidth();
  document.documentElement.dataset.rrViewport = mobile ? 'mobile' : 'desktop';
}

function syncAuthRrViewport(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  syncVisualHeightUnit();
  syncLayoutMode();
  syncViewportTokens();
}

function onViewportChange(): void {
  syncAuthRrViewport();
  window.requestAnimationFrame(syncAuthRrViewport);
}

function snapshotRrDocumentState(): {
  hadDataRr: boolean;
  dataset: DatasetSnapshot;
  vvh: string;
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
  ] as const) {
    dataset[key] = root.dataset[key];
  }

  return {
    hadDataRr: root.hasAttribute('data-rr'),
    dataset,
    vvh: root.style.getPropertyValue('--vvh'),
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
}

/**
 * Включает Russ Redesign (токены --rr-*, data-rr-*) для auth callback shell.
 * Снимает атрибуты при unmount, чтобы не затронуть основное приложение.
 */
export function useAuthRrShell(): void {
  let snapshot: ReturnType<typeof snapshotRrDocumentState> | null = null;

  onMounted(() => {
    snapshot = snapshotRrDocumentState();
    applyRussRedesign({ enabled: true, colorMode: 'light', density: '100' });
    onViewportChange();

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('orientationchange', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('scroll', onViewportChange);

    if (snapshot) {
      restoreRrDocumentState(snapshot);
    }
  });
}
