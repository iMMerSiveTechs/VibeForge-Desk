import React, { useMemo } from 'react';
import { View } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ElementRect extends Rect {
  id: string;
}

export interface GuideLine {
  orientation: 'horizontal' | 'vertical';
  /** Position on the cross-axis (x for vertical lines, y for horizontal lines) */
  position: number;
  /** Start of the line on the main axis */
  start: number;
  /** End of the line on the main axis */
  end: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideLine[];
}

export interface AlignmentGuidesProps {
  activeElement: { x: number; y: number; w: number; h: number } | null;
  otherElements: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  snapThreshold?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SNAP_THRESHOLD = 8;
const GUIDE_COLOR = '#007AFF';
const GUIDE_OPACITY = 0.75;
const GUIDE_EXTENSION = 20; // extend guides past element edges for visibility

// ---------------------------------------------------------------------------
// Helper: compute edges & center for a rect
// ---------------------------------------------------------------------------

function edges(r: Rect) {
  return {
    left: r.x,
    right: r.x + r.w,
    top: r.y,
    bottom: r.y + r.h,
    centerX: r.x + r.w / 2,
    centerY: r.y + r.h / 2,
  };
}

// ---------------------------------------------------------------------------
// snapToGuides – pure function, can be used outside the component
// ---------------------------------------------------------------------------

export function snapToGuides(
  element: Rect,
  others: ElementRect[],
  threshold: number = DEFAULT_SNAP_THRESHOLD,
): SnapResult {
  const guides: GuideLine[] = [];
  let snappedX = element.x;
  let snappedY = element.y;

  // Track smallest deltas so we snap to the closest match
  let bestDx: number | null = null;
  let bestDy: number | null = null;

  const active = edges(element);

  for (const other of others) {
    const target = edges(other);

    // -----------------------------------------------------------------------
    // Vertical alignment checks (adjust x) – produces vertical guide lines
    // -----------------------------------------------------------------------
    const verticalChecks: Array<{ activeVal: number; targetVal: number; label: string }> = [
      { activeVal: active.left, targetVal: target.left, label: 'left-left' },
      { activeVal: active.left, targetVal: target.right, label: 'left-right' },
      { activeVal: active.right, targetVal: target.left, label: 'right-left' },
      { activeVal: active.right, targetVal: target.right, label: 'right-right' },
      { activeVal: active.centerX, targetVal: target.centerX, label: 'center-center-x' },
    ];

    for (const check of verticalChecks) {
      const delta = targetVal(check) - activeVal(check);
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold) {
        if (bestDx === null || absDelta < Math.abs(bestDx)) {
          bestDx = delta;
        }

        // Build guide line spanning both elements vertically
        const minY = Math.min(active.top, target.top) - GUIDE_EXTENSION;
        const maxY = Math.max(active.bottom, target.bottom) + GUIDE_EXTENSION;

        guides.push({
          orientation: 'vertical',
          position: check.targetVal,
          start: minY,
          end: maxY,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Horizontal alignment checks (adjust y) – produces horizontal guide lines
    // -----------------------------------------------------------------------
    const horizontalChecks: Array<{ activeVal: number; targetVal: number; label: string }> = [
      { activeVal: active.top, targetVal: target.top, label: 'top-top' },
      { activeVal: active.top, targetVal: target.bottom, label: 'top-bottom' },
      { activeVal: active.bottom, targetVal: target.top, label: 'bottom-top' },
      { activeVal: active.bottom, targetVal: target.bottom, label: 'bottom-bottom' },
      { activeVal: active.centerY, targetVal: target.centerY, label: 'center-center-y' },
    ];

    for (const check of horizontalChecks) {
      const delta = targetVal(check) - activeVal(check);
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold) {
        if (bestDy === null || absDelta < Math.abs(bestDy)) {
          bestDy = delta;
        }

        const minX = Math.min(active.left, target.left) - GUIDE_EXTENSION;
        const maxX = Math.max(active.right, target.right) + GUIDE_EXTENSION;

        guides.push({
          orientation: 'horizontal',
          position: check.targetVal,
          start: minX,
          end: maxX,
        });
      }
    }
  }

  // Apply the best snap offsets
  if (bestDx !== null) {
    snappedX = element.x + bestDx;
  }
  if (bestDy !== null) {
    snappedY = element.y + bestDy;
  }

  // Filter guides to only include those matching the snapped position
  const filteredGuides = guides.filter((g) => {
    if (g.orientation === 'vertical' && bestDx !== null) {
      const snappedEdges = edges({ ...element, x: snappedX });
      return (
        Math.abs(g.position - snappedEdges.left) < 1 ||
        Math.abs(g.position - snappedEdges.right) < 1 ||
        Math.abs(g.position - snappedEdges.centerX) < 1
      );
    }
    if (g.orientation === 'horizontal' && bestDy !== null) {
      const snappedEdges = edges({ ...element, y: snappedY });
      return (
        Math.abs(g.position - snappedEdges.top) < 1 ||
        Math.abs(g.position - snappedEdges.bottom) < 1 ||
        Math.abs(g.position - snappedEdges.centerY) < 1
      );
    }
    return false;
  });

  // Deduplicate guides that are at the same position & orientation
  const seen = new Set<string>();
  const uniqueGuides: GuideLine[] = [];
  for (const g of filteredGuides) {
    const key = `${g.orientation}-${Math.round(g.position)}`;
    if (!seen.has(key)) {
      seen.add(key);
      // Merge overlapping spans for the same key
      const existing = uniqueGuides.find(
        (u) => u.orientation === g.orientation && Math.abs(u.position - g.position) < 1,
      );
      if (existing) {
        existing.start = Math.min(existing.start, g.start);
        existing.end = Math.max(existing.end, g.end);
      } else {
        uniqueGuides.push({ ...g });
      }
    }
  }

  return { x: snappedX, y: snappedY, guides: uniqueGuides };
}

// Small helpers to keep the check-object pattern ergonomic
function activeVal(c: { activeVal: number }): number {
  return c.activeVal;
}
function targetVal(c: { targetVal: number }): number {
  return c.targetVal;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlignmentGuides({
  activeElement,
  otherElements,
  snapThreshold = DEFAULT_SNAP_THRESHOLD,
}: AlignmentGuidesProps) {
  const guides = useMemo(() => {
    if (!activeElement) return [];
    const result = snapToGuides(activeElement, otherElements, snapThreshold);
    return result.guides;
  }, [activeElement, otherElements, snapThreshold]);

  if (!activeElement || guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, index) => {
        if (guide.orientation === 'vertical') {
          return (
            <View
              key={`v-${index}-${Math.round(guide.position)}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: guide.position,
                top: guide.start,
                width: 1,
                height: guide.end - guide.start,
                backgroundColor: GUIDE_COLOR,
                opacity: GUIDE_OPACITY,
                zIndex: 9999,
              }}
            />
          );
        }

        // horizontal
        return (
          <View
            key={`h-${index}-${Math.round(guide.position)}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: guide.start,
              top: guide.position,
              width: guide.end - guide.start,
              height: 1,
              backgroundColor: GUIDE_COLOR,
              opacity: GUIDE_OPACITY,
              zIndex: 9999,
            }}
          />
        );
      })}
    </>
  );
}
