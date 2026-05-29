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

/**
 * Computes best placement (above/below) and constrained maxHeight for a fixed-position floating panel.
 * Uses VisualViewport when available to keep the panel inside the actually visible area (browser bars, keyboard).
 */
export function computeFloatingPlacement(
  anchorRect: DOMRect,
  options: ComputeFloatingPlacementOptions,
): ComputeFloatingPlacementResult {
  const padding = options.padding ?? 8;
  const minHeight = options.minHeight ?? 120;
  const viewport = getVisualViewportSnapshot(padding);

  const viewportTop = viewport.top + padding;
  const viewportBottom = viewport.top + viewport.height - padding;

  const verticalTop = options.containerRect ? options.containerRect.top : viewportTop;
  const verticalBottom = options.containerRect ? options.containerRect.bottom : viewportBottom;

  const spaceAbove = anchorRect.top - verticalTop;
  const spaceBelow = verticalBottom - anchorRect.bottom;

  const preferAbove =
    spaceBelow < spaceAbove || spaceBelow < options.estimatedHeight + padding;
  const placement: FloatingPlacement = preferAbove ? 'above' : 'below';

  const available = placement === 'above' ? spaceAbove : spaceBelow;
  const maxHeight = clamp(
    available,
    minHeight,
    Math.max(minHeight, options.maxHeight),
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

