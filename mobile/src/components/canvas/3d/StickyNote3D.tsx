/**
 * StickyNote3D.tsx
 *
 * A 3D sticky note with a curled bottom-right corner and paper-like material.
 * Supports text rendered via CanvasTexture for crisp label rendering.
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StickyNote3DProps {
  /** World-space position [x, y, z] */
  position: [number, number, number];
  /** Sticky note color (hex) */
  color?: string;
  /** Text to display on the note */
  text?: string;
  /** Note size [width, height] */
  size?: [number, number];
  /** Rotation around Y axis in radians */
  rotationY?: number;
  /** Whether selected / lifted */
  selected?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a plane geometry with a curled bottom-right corner.
 * The curl is achieved by displacing vertices near the corner upward and
 * slightly inward.
 */
function createCurledNoteGeometry(
  width: number,
  height: number,
  segments: number = 16,
): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  const posAttr = geometry.attributes.position;
  const hw = width / 2;
  const hh = height / 2;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);

    // Distance from bottom-right corner (normalized 0-1)
    const dx = (x - hw) / width; // 0 at center, 0.5 at right
    const dy = (y + hh) / height; // 0 at bottom, 1 at top

    // Only affect bottom-right quadrant
    const cornerDist = Math.sqrt(
      Math.pow(Math.max(0, dx + 0.3), 2) + Math.pow(Math.max(0, 0.3 - dy), 2),
    );

    if (cornerDist > 0 && dx > 0 && dy < 0.35) {
      const curlAmount = Math.pow(cornerDist * 2.2, 2);
      const clampedCurl = Math.min(curlAmount, 0.15);

      // Lift the corner up (Z in plane space, will become Y after rotation)
      posAttr.setZ(i, clampedCurl);

      // Slight inward pull to simulate paper bending
      posAttr.setX(i, x - clampedCurl * 0.3);
      posAttr.setY(i, y + clampedCurl * 0.2);
    }
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Renders text onto a CanvasTexture for use as a material map.
 */
function createTextTexture(
  text: string,
  bgColor: string,
  textColor: string = '#333333',
  width: number = 512,
  height: number = 512,
): THREE.CanvasTexture {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Add subtle paper grain
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 3000; i++) {
    const gx = Math.random() * width;
    const gy = Math.random() * height;
    ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#FFFFFF';
    ctx.fillRect(gx, gy, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Text rendering
  if (text) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.textBaseline = 'top';

    // Word wrap
    const maxWidth = width - 60;
    const lineHeight = 36;
    const words = text.split(' ');
    let line = '';
    let yPos = 40;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, 30, yPos);
        line = word;
        yPos += lineHeight;
        if (yPos > height - 80) break; // Stop if we run out of space
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, 30, yPos);
    }
  }

  const texture = new THREE.CanvasTexture(canvas as unknown as HTMLCanvasElement);
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StickyNote3D: React.FC<StickyNote3DProps> = ({
  position,
  color = '#FFEC5C',
  text = '',
  size = [1.6, 1.6],
  rotationY = 0,
  selected = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentY = useRef(position[1] + 0.08);
  const currentRotZ = useRef(0);

  // Curled geometry
  const geometry = useMemo(
    () => createCurledNoteGeometry(size[0], size[1]),
    [size[0], size[1]],
  );

  // Text texture
  const textTexture = useMemo(
    () => createTextTexture(text, color),
    [text, color],
  );

  // Paper-like material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textTexture,
      color: new THREE.Color(color),
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }, [color, textTexture]);

  // Back side material (slightly darker)
  const backMaterial = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.85);
    return new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.BackSide,
    });
  }, [color]);

  // Animate lift and subtle rotation on select
  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const targetY = position[1] + 0.08 + (selected ? 0.4 : 0);
    const targetRotZ = selected ? 0.03 : 0;
    const lerp = 1 - Math.pow(0.03, delta);

    currentY.current += (targetY - currentY.current) * lerp;
    currentRotZ.current += (targetRotZ - currentRotZ.current) * lerp;

    groupRef.current.position.y = currentY.current;
    groupRef.current.rotation.z = currentRotZ.current;
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + 0.08, position[2]]}
      rotation={[0, rotationY, 0]}
    >
      {/* Front face with text */}
      <mesh
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
      />

      {/* Back face */}
      <mesh
        geometry={geometry}
        material={backMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Shadow on desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}>
        <planeGeometry args={[size[0] * 0.9, size[1] * 0.9]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
    </group>
  );
};

export default StickyNote3D;
