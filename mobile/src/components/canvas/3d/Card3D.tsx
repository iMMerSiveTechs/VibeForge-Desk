/**
 * Card3D.tsx
 *
 * A 3D card that floats above the desk surface. Supports hover/select
 * animations, theme-driven materials, and shadow casting.
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Card3DProps {
  /** World-space position [x, y, z] */
  position: [number, number, number];
  /** Card dimensions [width, height] */
  size?: [number, number];
  /** Card face color (hex string) */
  color?: string;
  /** Whether the card is currently selected/focused */
  selected?: boolean;
  /** Base elevation above desk (Y offset) */
  elevation?: number;
  /** Corner radius factor (0-1, mapped to bevel) */
  cornerRadius?: number;
  /** Optional opacity override */
  opacity?: number;
  /** Optional callback when card is tapped */
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a rounded rectangle shape for extrusion.
 */
function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  return shape;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Card3D: React.FC<Card3DProps> = ({
  position,
  size = [2.4, 1.6],
  color = '#FFFFFF',
  selected = false,
  elevation = 0.15,
  cornerRadius = 0.12,
  opacity = 1,
  onPress,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentY = useRef(position[1] + elevation);
  const currentScale = useRef(1);

  // Geometry: thin extruded rounded rect
  const geometry = useMemo(() => {
    const shape = createRoundedRectShape(size[0], size[1], cornerRadius);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [size[0], size[1], cornerRadius]);

  // Material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.4,
      metalness: 0.02,
      transparent: opacity < 1,
      opacity,
    });
  }, [color, opacity]);

  // Shadow edge (darker underside for depth cue)
  const shadowMaterial = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.3);
    return new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0.2,
    });
  }, [color]);

  // Animate hover / selection
  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    const targetY = position[1] + elevation + (selected ? 0.5 : 0);
    const targetScale = selected ? 1.04 : 1;
    const lerpSpeed = 1 - Math.pow(0.02, delta);

    currentY.current += (targetY - currentY.current) * lerpSpeed;
    currentScale.current += (targetScale - currentScale.current) * lerpSpeed;

    meshRef.current.position.y = currentY.current;
    meshRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Main card face */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, position[1] + elevation, 0]}
        castShadow
        receiveShadow
        onPointerDown={onPress ? () => onPress() : undefined}
      />

      {/* Soft shadow plane directly under the card */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        material={shadowMaterial}
      >
        <planeGeometry args={[size[0] * 0.95, size[1] * 0.95]} />
      </mesh>
    </group>
  );
};

export default Card3D;
