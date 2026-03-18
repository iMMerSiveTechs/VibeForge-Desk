import React from 'react';
import { Canvas, Path, Skia, Circle as SkiaCircle } from '@shopify/react-native-skia';
import type { PinboardStroke, PinboardElement } from '@/lib/state/store';

interface ActiveStroke {
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

interface Props {
  strokes: PinboardStroke[];
  activeStroke: ActiveStroke | null;
  width: number;
  height: number;
  arrows?: Array<PinboardElement & { type: 'arrow' }>;
}

// ---------------------------------------------------------------------------
// Dot Grid (Skia-rendered, no View overhead)
// ---------------------------------------------------------------------------

const SkiaDotGrid = React.memo(function SkiaDotGrid({ width, height }: { width: number; height: number }) {
  const SPACING = 40;
  const dots = React.useMemo(() => {
    const result: Array<{ x: number; y: number }> = [];
    for (let x = 0; x <= width; x += SPACING) {
      for (let y = 0; y <= height; y += SPACING) {
        result.push({ x, y });
      }
    }
    return result;
  }, [width, height]);
  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
      pointerEvents="none"
    >
      {dots.map((d, i) => (
        <SkiaCircle key={i} cx={d.x} cy={d.y} r={1.2} color="rgba(255,255,255,0.13)" />
      ))}
    </Canvas>
  );
});

// ---------------------------------------------------------------------------
// Arrow head helper
// ---------------------------------------------------------------------------

function arrowHeadPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size = 12,
): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const p1x = x2 - size * Math.cos(angle - Math.PI / 6);
  const p1y = y2 - size * Math.sin(angle - Math.PI / 6);
  const p2x = x2 - size * Math.cos(angle + Math.PI / 6);
  const p2y = y2 - size * Math.sin(angle + Math.PI / 6);
  return `M${x2} ${y2} L${p1x} ${p1y} L${p2x} ${p2y} Z`;
}

// ---------------------------------------------------------------------------
// InkLayer
// ---------------------------------------------------------------------------

export { SkiaDotGrid };

export default function InkLayer({ strokes, activeStroke, width, height, arrows }: Props) {
  const strokePaths = React.useMemo(() =>
    strokes.map((stroke) => {
      if (stroke.points.length < 2) return null;
      const pathStr = stroke.points.reduce(
        (acc, p, i) => (i === 0 ? `M${p.x} ${p.y}` : `${acc} L${p.x} ${p.y}`),
        '',
      );
      return { stroke, path: Skia.Path.MakeFromSVGString(pathStr) };
    }),
    [strokes],
  );

  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }} pointerEvents="none">
      {/* Ink strokes */}
      {strokePaths.map((entry) => {
        if (!entry || !entry.path) return null;
        const { stroke, path } = entry;
        return (
          <Path
            key={stroke.id}
            path={path}
            color={stroke.tool === 'highlighter' ? stroke.color + '66' : stroke.color}
            style="stroke"
            strokeWidth={stroke.width}
            strokeCap="round"
            strokeJoin="round"
          />
        );
      })}

      {/* Active (in-progress) stroke */}
      {activeStroke && activeStroke.points.length >= 2
        ? (() => {
            const pathStr = activeStroke.points.reduce(
              (acc, p, i) => (i === 0 ? `M${p.x} ${p.y}` : `${acc} L${p.x} ${p.y}`),
              '',
            );
            const path = Skia.Path.MakeFromSVGString(pathStr);
            if (!path) return null;
            return (
              <Path
                path={path}
                color={
                  activeStroke.tool === 'highlighter'
                    ? activeStroke.color + '66'
                    : activeStroke.color
                }
                style="stroke"
                strokeWidth={activeStroke.width}
                strokeCap="round"
                strokeJoin="round"
              />
            );
          })()
        : null}

      {/* Arrow elements */}
      {(arrows ?? []).map((arrow) => {
        const d = arrow.data as {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
          color: string;
          strokeWidth: number;
          arrowStyle: 'straight' | 'curved';
        };
        if (!d) return null;

        let linePathStr: string;
        if (d.arrowStyle === 'curved') {
          const midX = (d.startX + d.endX) / 2;
          const midY = (d.startY + d.endY) / 2;
          const dx = d.endX - d.startX;
          const dy = d.endY - d.startY;
          const cpX = midX - dy * 0.25;
          const cpY = midY + dx * 0.25;
          linePathStr = `M${d.startX} ${d.startY} Q${cpX} ${cpY} ${d.endX} ${d.endY}`;
        } else {
          linePathStr = `M${d.startX} ${d.startY} L${d.endX} ${d.endY}`;
        }

        const headStr = arrowHeadPath(d.startX, d.startY, d.endX, d.endY);
        const linePath = Skia.Path.MakeFromSVGString(linePathStr);
        const headPath = Skia.Path.MakeFromSVGString(headStr);

        if (!linePath || !headPath) return null;

        return (
          <React.Fragment key={arrow.id}>
            <Path
              path={linePath}
              color={d.color ?? '#ffffff'}
              style="stroke"
              strokeWidth={d.strokeWidth ?? 2}
              strokeCap="round"
              strokeJoin="round"
            />
            <Path
              path={headPath}
              color={d.color ?? '#ffffff'}
              style="fill"
            />
          </React.Fragment>
        );
      })}
    </Canvas>
  );
}
