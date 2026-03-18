/**
 * DeskScene.tsx
 *
 * Main 3D desk scene component for VibeForge "Desk View" mode.
 * Renders a perspective view of a desk surface with lighting, fog,
 * dot-grid overlay, and gyroscope-driven parallax.
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeskSceneProps {
  themeColors: {
    desk: string;
    accent: string;
    surface: string;
    ambient: string;
  };
  gyroscopeData?: { x: number; y: number };
  children?: React.ReactNode;
}

interface DeskSurfaceProps {
  color: string;
  gridColor: string;
}

interface GyroscopeCameraProps {
  gyroscopeData?: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple 2D hash-based noise for procedural wood grain.
 * Returns a value packed into a DataTexture.
 */
function createNoiseTexture(width: number, height: number): THREE.DataTexture {
  const size = width * height;
  const data = new Uint8Array(4 * size);

  for (let i = 0; i < size; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    // Layered noise for wood-like grain
    const grain =
      Math.sin(x * 0.05 + y * 0.02) * 0.3 +
      Math.sin(x * 0.12 + y * 0.08) * 0.15 +
      Math.sin((x + y) * 0.03) * 0.1;

    // Fine noise
    const fine =
      Math.sin(x * 1.7 + y * 2.3) * 0.04 +
      Math.sin(x * 3.1 - y * 1.9) * 0.03;

    const value = 128 + Math.floor((grain + fine) * 128);
    const clamped = Math.max(0, Math.min(255, value));

    const stride = i * 4;
    data[stride] = clamped;
    data[stride + 1] = clamped;
    data[stride + 2] = clamped;
    data[stride + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Generates a dot-grid texture matching the VibeForge dot-grid aesthetic.
 */
function createDotGridTexture(
  dotColor: string,
  size: number = 256,
  spacing: number = 16,
  dotRadius: number = 1.2,
): THREE.CanvasTexture {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Dot color with reduced opacity
  ctx.fillStyle = dotColor;
  ctx.globalAlpha = 0.25;

  for (let x = spacing / 2; x < size; x += spacing) {
    for (let y = spacing / 2; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas as unknown as HTMLCanvasElement);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

// ---------------------------------------------------------------------------
// Sub-components rendered inside the Canvas
// ---------------------------------------------------------------------------

/**
 * Animated camera that responds to device gyroscope for subtle parallax.
 */
function GyroscopeCamera({ gyroscopeData }: GyroscopeCameraProps) {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((_state, delta) => {
    if (!gyroscopeData) return;

    // Clamp gyroscope influence to small range
    const maxTilt = 0.06; // ~3.4 degrees
    const targetX = Math.max(-maxTilt, Math.min(maxTilt, gyroscopeData.y * 0.04));
    const targetY = Math.max(-maxTilt, Math.min(maxTilt, gyroscopeData.x * 0.04));

    // Smooth lerp
    const lerpFactor = 1 - Math.pow(0.05, delta);
    targetRotation.current.x += (targetX - targetRotation.current.x) * lerpFactor;
    targetRotation.current.y += (targetY - targetRotation.current.y) * lerpFactor;

    camera.rotation.x = -Math.PI / 6 + targetRotation.current.x;
    camera.rotation.y = targetRotation.current.y;
  });

  return null;
}

/**
 * The desk surface: a large plane with wood-grain noise and dot grid overlay.
 */
function DeskSurface({ color, gridColor }: DeskSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const noiseTexture = useMemo(() => createNoiseTexture(256, 256), []);
  const dotGridTexture = useMemo(() => createDotGridTexture(gridColor), [gridColor]);

  const deskColor = useMemo(() => new THREE.Color(color), [color]);

  // Blend the wood grain into the desk color
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: deskColor,
      map: noiseTexture,
      roughness: 0.85,
      metalness: 0.05,
      envMapIntensity: 0.3,
    });
  }, [deskColor, noiseTexture]);

  return (
    <group>
      {/* Main desk surface - shadow receiver */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        material={material}
      >
        <planeGeometry args={[30, 30]} />
      </mesh>

      {/* Dot-grid overlay rendered slightly above the desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial
          map={dotGridTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Shadow-receiving ground plane (invisible but catches shadows).
 */
function ShadowPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DeskScene: React.FC<DeskSceneProps> = ({
  themeColors,
  gyroscopeData,
  children,
}) => {
  const fogColor = useMemo(() => new THREE.Color(themeColors.desk), [themeColors.desk]);
  const ambientColor = useMemo(() => new THREE.Color(themeColors.ambient), [themeColors.ambient]);
  const accentColor = useMemo(() => new THREE.Color(themeColors.accent), [themeColors.accent]);

  // Determine light warmth from theme hue
  const directionalColor = useMemo(() => {
    const color = new THREE.Color(themeColors.accent);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Warm themes (hue 0-60 or 300-360) get warmer light; cool themes get cooler
    const isWarm = hsl.h < 0.17 || hsl.h > 0.83;
    return isWarm
      ? new THREE.Color('#FFF4E0') // warm white
      : new THREE.Color('#E8F0FF'); // cool white
  }, [themeColors.accent]);

  return (
    <Canvas
      shadows
      camera={{
        position: [0, 8, 10],
        rotation: [-Math.PI / 6, 0, 0],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true }}
      style={{ flex: 1 }}
    >
      {/* Fog / atmosphere */}
      <fog attach="fog" args={[fogColor, 15, 40]} />

      {/* Ambient fill light */}
      <ambientLight color={ambientColor} intensity={0.4} />

      {/* Main directional light with shadows */}
      <directionalLight
        color={directionalColor}
        intensity={0.8}
        position={[5, 10, 7]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />

      {/* Subtle accent-colored rim light */}
      <pointLight
        color={accentColor}
        intensity={0.15}
        position={[-6, 4, -4]}
        distance={20}
        decay={2}
      />

      {/* Parallax camera controller */}
      <GyroscopeCamera gyroscopeData={gyroscopeData} />

      {/* Desk surface with dot grid */}
      <DeskSurface color={themeColors.desk} gridColor={themeColors.surface} />

      {/* Invisible shadow catcher */}
      <ShadowPlane />

      {/* Consumer-provided 3D elements (cards, sticky notes, etc.) */}
      {children}
    </Canvas>
  );
};

export default DeskScene;
