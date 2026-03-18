/**
 * RoomView.tsx
 *
 * Premium 3D room environment for VibeForge "Room View" mode.
 * Renders a 3-wall room (back + 2 sides, no ceiling) with a canvas board
 * on the back wall and a desk in front. Elements are pinned to the board
 * or placed on the desk surface.
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label?: string;
  kind: string;
  /** If true, element is placed on the desk instead of the board */
  onDesk?: boolean;
}

export interface RoomTheme {
  /** Floor material color */
  floorColor: string;
  /** Floor material type hint */
  floorType: 'wood' | 'concrete' | 'carpet' | 'tile';
  /** Wall color */
  wallColor: string;
  /** Board (back wall canvas area) color */
  boardColor: string;
  /** Desk surface color */
  deskColor: string;
  /** Ambient light color */
  ambientColor: string;
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Main directional light color */
  lightColor: string;
  /** Main directional light intensity */
  lightIntensity: number;
  /** Fog color */
  fogColor: string;
  /** Background color */
  backgroundColor: string;
}

interface Props {
  elements: RoomElement[];
  themeColors: RoomTheme;
  onElementTap?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Theme presets (used as fallback)
// ---------------------------------------------------------------------------

const DEFAULT_THEME: RoomTheme = {
  floorColor: '#8B6F47',
  floorType: 'wood',
  wallColor: '#E8E0D4',
  boardColor: '#F5F0E8',
  deskColor: '#5C4A32',
  ambientColor: '#FFF8F0',
  ambientIntensity: 0.5,
  lightColor: '#FFF4E0',
  lightIntensity: 1.0,
  fogColor: '#E8E0D4',
  backgroundColor: '#D8D0C4',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Create a procedural floor texture based on the floor type.
 */
function createFloorTexture(
  type: RoomTheme['floorType'],
  baseColor: string,
  width: number = 256,
  height: number = 256,
): THREE.DataTexture {
  const size = width * height;
  const data = new Uint8Array(4 * size);
  const color = new THREE.Color(baseColor);

  for (let i = 0; i < size; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    let variation = 0;

    switch (type) {
      case 'wood': {
        // Wood grain pattern
        const grain =
          Math.sin(x * 0.04 + y * 0.015) * 0.12 +
          Math.sin(x * 0.1 + y * 0.06) * 0.06 +
          Math.sin((x + y) * 0.025) * 0.08;
        const fine = Math.sin(x * 1.5 + y * 2.1) * 0.02;
        variation = grain + fine;
        break;
      }
      case 'concrete': {
        // Concrete noise
        const noise =
          Math.sin(x * 0.3 + y * 0.7) * 0.04 +
          Math.sin(x * 1.1 - y * 0.9) * 0.03 +
          Math.sin(x * 2.3 + y * 1.7) * 0.02;
        variation = noise;
        break;
      }
      case 'carpet': {
        // Carpet weave pattern
        const weave =
          Math.sin(x * 0.8) * Math.sin(y * 0.8) * 0.03 +
          Math.sin(x * 3.1 + y * 2.7) * 0.015;
        variation = weave;
        break;
      }
      case 'tile': {
        // Tile grid with grout lines
        const tileSize = 32;
        const groutWidth = 2;
        const isGrout =
          x % tileSize < groutWidth || y % tileSize < groutWidth;
        variation = isGrout ? -0.15 : Math.sin(x * 0.5 + y * 0.5) * 0.02;
        break;
      }
    }

    const r = Math.max(0, Math.min(255, Math.floor((color.r + variation) * 255)));
    const g = Math.max(0, Math.min(255, Math.floor((color.g + variation) * 255)));
    const b = Math.max(0, Math.min(255, Math.floor((color.b + variation) * 255)));

    const stride = i * 4;
    data[stride] = r;
    data[stride + 1] = g;
    data[stride + 2] = b;
    data[stride + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

// ---------------------------------------------------------------------------
// Room geometry components
// ---------------------------------------------------------------------------

/** Floor plane */
function Floor({
  color,
  floorType,
}: {
  color: string;
  floorType: RoomTheme['floorType'];
}) {
  const floorTexture = useMemo(
    () => createFloorTexture(floorType, color),
    [floorType, color],
  );

  const floorColor = useMemo(() => hexToThreeColor(color), [color]);

  const roughness = useMemo(() => {
    switch (floorType) {
      case 'wood':
        return 0.7;
      case 'concrete':
        return 0.9;
      case 'carpet':
        return 0.95;
      case 'tile':
        return 0.3;
      default:
        return 0.7;
    }
  }, [floorType]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[16, 12]} />
      <meshStandardMaterial
        color={floorColor}
        map={floorTexture}
        roughness={roughness}
        metalness={floorType === 'tile' ? 0.1 : 0.02}
      />
    </mesh>
  );
}

/** Back wall */
function BackWall({ color }: { color: string }) {
  const wallColor = useMemo(() => hexToThreeColor(color), [color]);

  return (
    <mesh position={[0, 4, -6]} receiveShadow>
      <planeGeometry args={[16, 8]} />
      <meshStandardMaterial
        color={wallColor}
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  );
}

/** Side wall (left or right) */
function SideWall({
  color,
  side,
}: {
  color: string;
  side: 'left' | 'right';
}) {
  const wallColor = useMemo(() => hexToThreeColor(color), [color]);
  const xPos = side === 'left' ? -8 : 8;
  const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

  return (
    <mesh position={[xPos, 4, 0]} rotation={[0, rotY, 0]} receiveShadow>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial
        color={wallColor}
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  );
}

/** The canvas board mounted on the back wall */
function Board({ color }: { color: string }) {
  const boardColor = useMemo(() => hexToThreeColor(color), [color]);

  return (
    <group position={[0, 4.2, -5.95]}>
      {/* Board frame (slightly darker border) */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[10.4, 5.6, 0.06]} />
        <meshStandardMaterial
          color={boardColor}
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* Board surface */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[10, 5.2]} />
        <meshStandardMaterial
          color={boardColor}
          roughness={0.4}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}

/** Simple desk geometry */
function Desk({ color }: { color: string }) {
  const deskColor = useMemo(() => hexToThreeColor(color), [color]);

  const topMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: deskColor,
        roughness: 0.5,
        metalness: 0.05,
      }),
    [deskColor],
  );

  const legMaterial = useMemo(() => {
    const c = deskColor.clone().multiplyScalar(0.7);
    return new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.6,
      metalness: 0.1,
    });
  }, [deskColor]);

  const deskY = 1.0;
  const deskZ = -1.5;
  const topWidth = 6;
  const topDepth = 2.5;
  const topThickness = 0.08;
  const legWidth = 0.12;
  const legHeight = deskY;

  return (
    <group>
      {/* Desk top surface */}
      <mesh
        position={[0, deskY, deskZ]}
        material={topMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[topWidth, topThickness, topDepth]} />
      </mesh>

      {/* Four legs */}
      {[
        [-topWidth / 2 + 0.2, deskY / 2, deskZ - topDepth / 2 + 0.2],
        [topWidth / 2 - 0.2, deskY / 2, deskZ - topDepth / 2 + 0.2],
        [-topWidth / 2 + 0.2, deskY / 2, deskZ + topDepth / 2 - 0.2],
        [topWidth / 2 - 0.2, deskY / 2, deskZ + topDepth / 2 - 0.2],
      ].map((pos, i) => (
        <mesh
          key={`leg-${i}`}
          position={pos as [number, number, number]}
          material={legMaterial}
          castShadow
        >
          <boxGeometry args={[legWidth, legHeight, legWidth]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Element rendering
// ---------------------------------------------------------------------------

/** Element pinned to the back-wall board */
function BoardElement({
  element,
  onTap,
}: {
  element: RoomElement;
  onTap?: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Map element canvas coords to board space
  // Board is 10 x 5.2 centered at (0, 4.2, -5.94)
  const boardWidth = 10;
  const boardHeight = 5.2;
  const canvasRange = 4000; // CANVAS_SIZE

  const position = useMemo<[number, number, number]>(() => {
    const nx = (element.x / canvasRange) * boardWidth - boardWidth / 2;
    const ny = -(element.y / canvasRange) * boardHeight + boardHeight / 2;
    return [nx, 4.2 + ny, -5.9];
  }, [element.x, element.y]);

  const scale = useMemo<[number, number, number]>(() => {
    const sw = (element.width / canvasRange) * boardWidth;
    const sh = (element.height / canvasRange) * boardHeight;
    return [Math.max(sw, 0.2), Math.max(sh, 0.15), 1];
  }, [element.width, element.height]);

  const color = useMemo(() => hexToThreeColor(element.color), [element.color]);

  return (
    <group>
      {/* Pin dot */}
      <mesh position={[position[0], position[1] + scale[1] / 2 + 0.08, position[2] + 0.03]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#CC3333" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Card */}
      <mesh
        ref={meshRef}
        position={position}
        scale={scale}
        onClick={() => onTap?.(element.id)}
        castShadow
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Element placed on the desk surface */
function DeskElement({
  element,
  onTap,
}: {
  element: RoomElement;
  onTap?: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Desk top is at y=1.0, z=-1.5, extends 6 wide and 2.5 deep
  const deskWidth = 5.5;
  const deskDepth = 2.0;
  const deskY = 1.04; // slightly above desk
  const deskZ = -1.5;
  const canvasRange = 4000;

  const position = useMemo<[number, number, number]>(() => {
    const nx = (element.x / canvasRange) * deskWidth - deskWidth / 2;
    const nz = (element.y / canvasRange) * deskDepth - deskDepth / 2;
    return [nx, deskY, deskZ + nz];
  }, [element.x, element.y]);

  const elWidth = useMemo(
    () => Math.max((element.width / canvasRange) * deskWidth, 0.3),
    [element.width],
  );
  const elDepth = useMemo(
    () => Math.max((element.height / canvasRange) * deskDepth, 0.2),
    [element.height],
  );

  const color = useMemo(() => hexToThreeColor(element.color), [element.color]);

  // Gentle hover float
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.position.y =
        deskY + 0.04 + Math.sin(t * 0.8 + element.x * 0.01) * 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={() => onTap?.(element.id)}
      castShadow
    >
      <planeGeometry args={[elWidth, elDepth]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.02}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Room lighting
// ---------------------------------------------------------------------------

function RoomLighting({ theme }: { theme: RoomTheme }) {
  const ambientColor = useMemo(
    () => hexToThreeColor(theme.ambientColor),
    [theme.ambientColor],
  );
  const lightColor = useMemo(
    () => hexToThreeColor(theme.lightColor),
    [theme.lightColor],
  );

  return (
    <>
      <ambientLight color={ambientColor} intensity={theme.ambientIntensity} />

      {/* Overhead directional light */}
      <directionalLight
        color={lightColor}
        intensity={theme.lightIntensity}
        position={[2, 7, 3]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-bias={-0.002}
      />

      {/* Fill light from front-right */}
      <pointLight
        position={[5, 3, 4]}
        intensity={0.3}
        color={lightColor}
        distance={15}
        decay={2}
      />

      {/* Subtle back wall wash */}
      <pointLight
        position={[0, 6, -4]}
        intensity={0.2}
        color="#FFFFFF"
        distance={10}
        decay={2}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Camera controller
// ---------------------------------------------------------------------------

function RoomCameraController({
  rotationX,
  rotationY,
}: {
  rotationX: Animated.SharedValue<number>;
  rotationY: Animated.SharedValue<number>;
}) {
  const { camera } = useThree();

  // Fixed orbit around a point in the room
  const target = useMemo(() => new THREE.Vector3(0, 3, -2), []);
  const radius = 10;

  useFrame(() => {
    const rx = rotationX.value;
    const ry = rotationY.value;

    // Clamp vertical rotation to prevent going under floor or over ceiling
    const clampedRx = Math.max(-0.1, Math.min(Math.PI / 4, rx));

    camera.position.x = target.x + radius * Math.sin(ry) * Math.cos(clampedRx);
    camera.position.y = target.y + radius * Math.sin(clampedRx);
    camera.position.z = target.z + radius * Math.cos(ry) * Math.cos(clampedRx);
    camera.lookAt(target);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Room scene (rendered inside Canvas)
// ---------------------------------------------------------------------------

interface RoomSceneProps {
  elements: RoomElement[];
  theme: RoomTheme;
  onElementTap?: (id: string) => void;
  rotationX: Animated.SharedValue<number>;
  rotationY: Animated.SharedValue<number>;
}

function RoomScene({
  elements,
  theme,
  onElementTap,
  rotationX,
  rotationY,
}: RoomSceneProps) {
  const boardElements = useMemo(
    () => elements.filter((el) => !el.onDesk),
    [elements],
  );
  const deskElements = useMemo(
    () => elements.filter((el) => el.onDesk),
    [elements],
  );

  return (
    <>
      <RoomCameraController rotationX={rotationX} rotationY={rotationY} />
      <RoomLighting theme={theme} />

      {/* Fog */}
      <fog attach="fog" args={[theme.fogColor, 12, 30]} />

      {/* Room geometry */}
      <Floor color={theme.floorColor} floorType={theme.floorType} />
      <BackWall color={theme.wallColor} />
      <SideWall color={theme.wallColor} side="left" />
      <SideWall color={theme.wallColor} side="right" />

      {/* Board on back wall */}
      <Board color={theme.boardColor} />

      {/* Desk */}
      <Desk color={theme.deskColor} />

      {/* Elements pinned to the board */}
      {boardElements.map((el) => (
        <BoardElement key={el.id} element={el} onTap={onElementTap} />
      ))}

      {/* Elements on the desk */}
      {deskElements.map((el) => (
        <DeskElement key={el.id} element={el} onTap={onElementTap} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// RoomView - Main exported component
// ---------------------------------------------------------------------------

export default function RoomView({
  elements,
  themeColors = DEFAULT_THEME,
  onElementTap,
}: Props) {
  // Shared values for gesture-driven camera orbit
  const rotationX = useSharedValue<number>(0.25);
  const rotationY = useSharedValue<number>(0);

  const prevTranslateX = useSharedValue<number>(0);
  const prevTranslateY = useSharedValue<number>(0);

  // Pan gesture for looking around the room
  const panGesture = Gesture.Pan()
    .onStart(() => {
      prevTranslateX.value = 0;
      prevTranslateY.value = 0;
    })
    .onUpdate((e) => {
      const dx = e.translationX - prevTranslateX.value;
      const dy = e.translationY - prevTranslateY.value;
      prevTranslateX.value = e.translationX;
      prevTranslateY.value = e.translationY;

      rotationY.value += dx * 0.004;
      rotationX.value += dy * 0.004;
    })
    .onEnd((e) => {
      rotationY.value = withDecay({
        velocity: e.velocityX * 0.001,
        deceleration: 0.997,
      });
    });

  const bgColor = useMemo(
    () => hexToThreeColor(themeColors.backgroundColor),
    [themeColors.backgroundColor],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <Canvas
            shadows
            style={{ flex: 1 }}
            camera={{
              position: [0, 5, 8],
              fov: 50,
              near: 0.1,
              far: 50,
            }}
            gl={{ antialias: true }}
          >
            <color
              attach="background"
              args={[bgColor.r, bgColor.g, bgColor.b]}
            />
            <RoomScene
              elements={elements}
              theme={themeColors}
              onElementTap={onElementTap}
              rotationX={rotationX}
              rotationY={rotationY}
            />
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
