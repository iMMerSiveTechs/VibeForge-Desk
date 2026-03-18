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
  useAnimatedStyle,
  withDecay,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpatialElement {
  id: string;
  x: number;
  y: number;
  zOrder: number;
  width: number;
  height: number;
  color: string;
  label?: string;
  kind: string;
}

export interface SpatialConnection {
  id: string;
  fromId: string;
  toId: string;
  color?: string;
}

export interface SpatialTheme {
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  pointLightColor: string;
  pointLightIntensity: number;
  backgroundColor: string;
}

interface Props {
  elements: SpatialElement[];
  connections: SpatialConnection[];
  themeColors: SpatialTheme;
  onElementTap?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert hex color string to THREE.Color */
function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Convert 2D canvas coords + z-order to 3D spatial position */
function toSpatialPosition(
  x: number,
  y: number,
  zOrder: number,
  canvasScale: number = 0.01,
  depthScale: number = 0.8,
): [number, number, number] {
  return [
    (x - 2000) * canvasScale,
    -(y - 2000) * canvasScale,
    -zOrder * depthScale,
  ];
}

// ---------------------------------------------------------------------------
// ThemeLighting - Atmosphere driven by theme
// ---------------------------------------------------------------------------

function ThemeLighting({ theme }: { theme: SpatialTheme }) {
  return (
    <>
      <ambientLight intensity={theme.ambientIntensity} />
      <pointLight
        position={[5, 8, 5]}
        intensity={theme.pointLightIntensity}
        color={theme.pointLightColor}
        castShadow
      />
      <pointLight
        position={[-4, 3, -6]}
        intensity={theme.pointLightIntensity * 0.4}
        color={theme.pointLightColor}
      />
      <fog
        attach="fog"
        args={[theme.fogColor, theme.fogNear, theme.fogFar]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// ElementBillboard - A flat plane representing a canvas element
// ---------------------------------------------------------------------------

interface BillboardProps {
  element: SpatialElement;
  onTap?: (id: string) => void;
}

function ElementBillboard({ element, onTap }: BillboardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const position = useMemo<[number, number, number]>(
    () => toSpatialPosition(element.x, element.y, element.zOrder),
    [element.x, element.y, element.zOrder],
  );

  const scale = useMemo<[number, number, number]>(
    () => [element.width * 0.01, element.height * 0.01, 1],
    [element.width, element.height],
  );

  const color = useMemo(() => hexToThreeColor(element.color), [element.color]);

  // Billboard behavior: always face camera
  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  // Gentle float animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const offset = element.zOrder * 0.5;
      meshRef.current.position.y =
        position[1] + Math.sin(t * 0.6 + offset) * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={() => onTap?.(element.id)}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Connector3D - Tube connection between two elements
// ---------------------------------------------------------------------------

interface Connector3DProps {
  from: SpatialElement;
  to: SpatialElement;
  color: string;
}

function Connector3D({ from, to, color }: Connector3DProps) {
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...toSpatialPosition(from.x, from.y, from.zOrder));
    const end = new THREE.Vector3(...toSpatialPosition(to.x, to.y, to.zOrder));
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    // Add some upward curve
    mid.y += 0.5;
    return new THREE.QuadraticBezierCurve3D(start, mid, end);
  }, [from.x, from.y, from.zOrder, to.x, to.y, to.zOrder]);

  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 20, 0.02, 8, false),
    [curve],
  );

  const tubeColor = useMemo(() => hexToThreeColor(color), [color]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial
        color={tubeColor}
        transparent
        opacity={0.6}
        roughness={0.3}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// CameraController - Orbit controls via gesture handler
// ---------------------------------------------------------------------------

function CameraController({
  rotationX,
  rotationY,
  zoom,
}: {
  rotationX: Animated.SharedValue<number>;
  rotationY: Animated.SharedValue<number>;
  zoom: Animated.SharedValue<number>;
}) {
  const { camera } = useThree();
  const radius = 12;

  useFrame(() => {
    const rx = rotationX.value;
    const ry = rotationY.value;
    const z = zoom.value;

    const r = radius / z;
    const clampedRx = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rx));

    camera.position.x = r * Math.sin(ry) * Math.cos(clampedRx);
    camera.position.y = r * Math.sin(clampedRx);
    camera.position.z = r * Math.cos(ry) * Math.cos(clampedRx);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// GridFloor - Subtle reference grid
// ---------------------------------------------------------------------------

function GridFloor({ color }: { color: string }) {
  const gridColor = useMemo(() => hexToThreeColor(color), [color]);

  return (
    <gridHelper
      args={[40, 40, gridColor, gridColor]}
      position={[0, -5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// ---------------------------------------------------------------------------
// SpatialScene - Inner scene rendered inside the Canvas
// ---------------------------------------------------------------------------

interface SceneProps {
  elements: SpatialElement[];
  connections: SpatialConnection[];
  theme: SpatialTheme;
  onElementTap?: (id: string) => void;
  rotationX: Animated.SharedValue<number>;
  rotationY: Animated.SharedValue<number>;
  zoom: Animated.SharedValue<number>;
}

function SpatialScene({
  elements,
  connections,
  theme,
  onElementTap,
  rotationX,
  rotationY,
  zoom,
}: SceneProps) {
  // Build a map for quick element lookups
  const elementMap = useMemo(() => {
    const map = new Map<string, SpatialElement>();
    elements.forEach((el) => map.set(el.id, el));
    return map;
  }, [elements]);

  return (
    <>
      <CameraController
        rotationX={rotationX}
        rotationY={rotationY}
        zoom={zoom}
      />
      <ThemeLighting theme={theme} />
      <GridFloor color={theme.fogColor} />

      {/* Connections */}
      {connections.map((conn) => {
        const fromEl = elementMap.get(conn.fromId);
        const toEl = elementMap.get(conn.toId);
        if (!fromEl || !toEl) return null;
        return (
          <Connector3D
            key={conn.id}
            from={fromEl}
            to={toEl}
            color={conn.color ?? '#ffffff'}
          />
        );
      })}

      {/* Element billboards */}
      {elements.map((el) => (
        <ElementBillboard key={el.id} element={el} onTap={onElementTap} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// SpatialView - Main exported component
// ---------------------------------------------------------------------------

const DEFAULT_THEME: SpatialTheme = {
  fogColor: '#19141B',
  fogNear: 8,
  fogFar: 30,
  ambientIntensity: 0.4,
  pointLightColor: '#ffffff',
  pointLightIntensity: 1.2,
  backgroundColor: '#19141B',
};

export default function SpatialView({
  elements,
  connections,
  themeColors = DEFAULT_THEME,
  onElementTap,
}: Props) {
  // Shared values for gesture-driven orbit
  const rotationX = useSharedValue<number>(0.3);
  const rotationY = useSharedValue<number>(0.5);
  const zoom = useSharedValue<number>(1);

  // Track previous touch for delta calculations
  const prevTranslateX = useSharedValue<number>(0);
  const prevTranslateY = useSharedValue<number>(0);

  // Pan gesture for orbiting
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

      rotationY.value += dx * 0.005;
      rotationX.value += dy * 0.005;
    })
    .onEnd((e) => {
      // Momentum
      rotationY.value = withDecay({
        velocity: e.velocityX * 0.002,
        deceleration: 0.997,
      });
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      zoom.value = Math.max(0.3, Math.min(3, e.scale));
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const bgColor = useMemo(
    () => hexToThreeColor(themeColors.backgroundColor),
    [themeColors.backgroundColor],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composed}>
        <View style={{ flex: 1 }}>
          <Canvas
            style={{ flex: 1 }}
            camera={{ position: [0, 3, 12], fov: 55, near: 0.1, far: 100 }}
            gl={{ antialias: true }}
          >
            <color attach="background" args={[bgColor.r, bgColor.g, bgColor.b]} />
            <SpatialScene
              elements={elements}
              connections={connections}
              theme={themeColors}
              onElementTap={onElementTap}
              rotationX={rotationX}
              rotationY={rotationY}
              zoom={zoom}
            />
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
