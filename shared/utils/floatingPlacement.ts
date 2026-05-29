export type FloatingPlacement = 'above' | 'below';

export interface FloatingViewport {
  top: number;
  left: number;
  width: number;
  height: number;
  padding: number;
}

export interface ComputeFloatingPlacementOptions {
  estimatedHeight: number;
  maxHeight: number;
  minHeight?: number;
  padding?: number;
  containerRect?: DOMRect | null;
  minWidth?: number;
}

export interface ComputeFloatingPlacementResult {
  placement: FloatingPlacement;
  viewport: FloatingViewport;
  maxHeight: number;
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

function getVisualViewportSnapshot(padding: number): FloatingViewport {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: 0, height: 0, padding };
  }

  const vv = window.visualViewport;
  if (!vv) {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      padding,
    };
  }

  return {
    top: vv.offsetTop || 0,
    left: vv.offsetLeft || 0,
    width: vv.width || window.innerWidth,
    height: vv.height || window.innerHeight,
    padding,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const MOBILE_FILTERS_MODAL_SELECTOR = '.mobile-filters-modal';
const MOBILE_FILTERS_CONTENT_SELECTOR = '.mobile-filters-content';

/**
 * Visible scroll bounds of the mobile filters bottom sheet (not the full modal chrome).
 */
export function getMobileFiltersBounds(anchor: Element): DOMRect | null {
  const modal = anchor.closest(MOBILE_FILTERS_MODAL_SELECTOR);
  if (!modal) return null;
  const scrollEl = modal.querySelector(MOBILE_FILTERS_CONTENT_SELECTOR);
  return (scrollEl ?? modal).getBoundingClientRect();
}

/**
 * Computes best placement (above/below) and constrained maxHeight for a fixed-position floating panel.
 * Uses VisualViewport when available to keep the panel inside the actually visible area (browser bars, keyboard).
 */
export function computeFloatingPlacement(
  anchorRect: DOMRect,
  options: ComputeFloatingPlacementOptions,
): ComputeFloatingPlacementResult {
  const padding = options.padding ?? 8;
  const viewport = getVisualViewportSnapshot(padding);

  const viewportTop = viewport.top + padding;
  const viewportBottom = viewport.top + viewport.height - padding;

  const verticalTop = options.containerRect ? options.containerRect.top : viewportTop;
  const verticalBottom = options.containerRect ? options.containerRect.bottom : viewportBottom;

  const spaceAbove = Math.max(0, anchorRect.top - verticalTop);
  const spaceBelow = Math.max(0, verticalBottom - anchorRect.bottom);

  const desiredHeight = Math.min(options.estimatedHeight, options.maxHeight);
  const minOpen = Math.min(desiredHeight, 80) + padding;
  const fitsBelow = spaceBelow >= minOpen;
  const fitsAbove = spaceAbove >= minOpen;

  let placement: FloatingPlacement;
  if (fitsBelow && fitsAbove) {
    placement = spaceBelow >= spaceAbove ? 'below' : 'above';
  } else if (fitsBelow) {
    placement = 'below';
  } else if (fitsAbove) {
    placement = 'above';
  } else {
    placement = spaceBelow >= spaceAbove ? 'below' : 'above';
  }

  if (placement === 'above' && spaceAbove < padding && spaceBelow > spaceAbove) {
    placement = 'below';
  } else if (placement === 'below' && spaceBelow < padding && spaceAbove > spaceBelow) {
    placement = 'above';
  }

  const available = placement === 'above' ? spaceAbove : spaceBelow;
  const maxHeight = Math.min(
    options.maxHeight,
    Math.max(0, available - padding),
  );

  const viewportLeft = viewport.left + padding;
  const viewportRight = viewport.left + viewport.width - padding;

  const minWidth = options.minWidth ?? 0;
  let width = Math.max(anchorRect.width, minWidth);
  width = Math.min(width, Math.max(0, viewportRight - viewportLeft));

  let left = anchorRect.left;
  left = clamp(left, viewportLeft, viewportRight - width);

  if (placement === 'above') {
    return {
      placement,
      viewport,
      maxHeight,
      left,
      width,
      bottom: (typeof window !== 'undefined' ? window.innerHeight : viewport.top + viewport.height) - anchorRect.top + padding,
    };
  }

  return {
    placement,
    viewport,
    maxHeight,
    left,
    width,
    top: anchorRect.bottom + padding,
  };
}

export interface BuildFixedFloatingStylesOptions {
  padding?: number;
  containerRect?: DOMRect | null;
  zIndex?: number;
}

/**
 * Builds fixed-position inline styles for a teleported dropdown/calendar.
 * When opening above, clamps top to the container top so the panel stays in the sheet.
 */
export function buildFixedFloatingStyles(
  anchorRect: DOMRect,
  result: ComputeFloatingPlacementResult,
  options: BuildFixedFloatingStylesOptions = {},
): Record<string, string | number> {
  const padding = options.padding ?? 8;
  const zIndex = options.zIndex ?? 100000;
  const boundsTop = options.containerRect?.top ?? padding;

  const base = {
    position: 'fixed' as const,
    left: `${result.left}px`,
    width: `${result.width}px`,
    maxHeight: `${result.maxHeight}px`,
    overflowY: 'auto' as const,
    zIndex,
  };

  if (result.placement === 'above') {
    const idealTop = anchorRect.top - padding - result.maxHeight;
    return {
      ...base,
      top: `${Math.max(boundsTop + padding, idealTop)}px`,
      bottom: 'auto',
    };
  }

  return {
    ...base,
    top: `${result.top ?? anchorRect.bottom + padding}px`,
    bottom: 'auto',
  };
}

