/**
 * Connector3D.tsx
 *
 * A 3D ribbon/tube connector between two points on the desk.
 * Features a curved TubeGeometry path, emissive glow material, and
 * an animated pulsing opacity that flows along the tube.
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Connector3DProps {
  /** Start position in world space [x, y, z] */
  start: [number, number, number];
  /** End position in world space [x, y, z] */
  end: [number, number, number];
  /** Connector color (hex string) */
  color?: string;
  /** Tube radius */
  radius?: number;
  /** Number of tube segments along the path */
  segments?: number;
  /** Height of the arc's midpoint above the start/end plane */
  arcHeight?: number;
  /** Enable the animated flow pulse */
  animated?: boolean;
  /** Pulse speed multiplier */
  pulseSpeed?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a smooth cubic Bezier curve between two 3D points with a gentle
 * upward arc. The two control points are placed 1/3 and 2/3 along the
 * segment, raised by `arcHeight`.
 */
function createConnectorCurve(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  arcHeight: number,
): THREE.CubicBezierCurve3 {
  const midY = Math.max(startPos.y, endPos.y) + arcHeight;

  const cp1 = new THREE.Vector3(
    startPos.x + (endPos.x - startPos.x) * 0.33,
    midY,
    startPos.z + (endPos.z - startPos.z) * 0.33,
  );

  const cp2 = new THREE.Vector3(
    startPos.x + (endPos.x - startPos.x) * 0.66,
    midY,
    startPos.z + (endPos.z - startPos.z) * 0.66,
  );

  return new THREE.CubicBezierCurve3(startPos, cp1, cp2, endPos);
}

/**
 * Creates a gradient alpha texture for the flow/pulse effect.
 * A bright band moves across a mostly-transparent strip.
 */
function createFlowTexture(width: number = 256): THREE.DataTexture {
  const data = new Uint8Array(4 * width);

  for (let i = 0; i < width; i++) {
    const t = i / width;
    // Smooth falloff ramp with a brighter center band
    const alpha = Math.pow(Math.sin(t * Math.PI), 0.6) * 255;

    const stride = i * 4;
    data[stride] = 255;
    data[stride + 1] = 255;
    data[stride + 2] = 255;
    data[stride + 3] = Math.floor(alpha);
  }

  const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Connector3D: React.FC<Connector3DProps> = ({
  start,
  end,
  color = '#4A6CF7',
  radius = 0.025,
  segments = 32,
  arcHeight = 0.6,
  animated = true,
  pulseSpeed = 0.4,
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Build the curve
  const startVec = useMemo(() => new THREE.Vector3(...start), [start[0], start[1], start[2]]);
  const endVec = useMemo(() => new THREE.Vector3(...end), [end[0], end[1], end[2]]);

  const curve = useMemo(
    () => createConnectorCurve(startVec, endVec, arcHeight),
    [startVec, endVec, arcHeight],
  );

  // TubeGeometry along the curve
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, segments, radius, 8, false),
    [curve, segments, radius],
  );

  // Flow texture for pulsing effect
  const flowTexture = useMemo(() => createFlowTexture(), []);

  // Emissive material with glow
  const connectorColor = useMemo(() => new THREE.Color(color), [color]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: connectorColor,
      emissive: connectorColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2,
      metalness: 0.3,
      alphaMap: animated ? flowTexture : undefined,
      depthWrite: false,
    });
  }, [connectorColor, animated, flowTexture]);

  // Glow halo — a slightly larger, more transparent tube for bloom-like effect
  const glowGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, segments, radius * 2.5, 8, false),
    [curve, segments, radius],
  );

  const glowMaterial = useMemo(() => {
    const c = new THREE.Color(color);
    return new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, [color]);

  // Animate the flow texture offset for the pulse effect
  useFrame((_state, delta) => {
    if (!animated || !material.alphaMap) return;

    material.alphaMap.offset.x += delta * pulseSpeed;
    if (material.alphaMap.offset.x > 1) {
      material.alphaMap.offset.x -= 1;
    }
    material.alphaMap.needsUpdate = true;

    // Subtle opacity breathing
    const t = _state.clock.getElapsedTime();
    material.opacity = 0.6 + Math.sin(t * 1.5) * 0.15;
  });

  return (
    <group>
      {/* Core tube */}
      <mesh geometry={tubeGeometry} material={material} />

      {/* Outer glow tube */}
      <mesh geometry={glowGeometry} material={glowMaterial} />
    </group>
  );
};

export default Connector3D;
