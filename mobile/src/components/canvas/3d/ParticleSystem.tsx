/**
 * ParticleSystem.tsx
 *
 * Ambient particle effects for the 3D desk scene. Uses InstancedMesh for
 * performance-friendly rendering of 50-100 small particles.
 *
 * Supports multiple visual styles driven by the current theme:
 *   'dust'    — warm drifting motes
 *   'sparks'  — bright rising embers
 *   'snow'    — slow falling flakes
 *   'bubbles' — gently rising translucent spheres
 *   'none'    — no particles rendered
 *
 * Requires: @react-three/fiber, three, expo-gl
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParticleStyle = 'dust' | 'sparks' | 'snow' | 'bubbles' | 'none';

interface ParticleSystemProps {
  /** Visual style of the particles */
  particleStyle?: ParticleStyle;
  /** Base color for particles (hex string) */
  color?: string;
  /** Number of particles (clamped 0-100 for mobile perf) */
  count?: number;
  /** Bounding box half-extent for particle spread */
  spread?: number;
  /** Vertical range [min, max] for particle spawn */
  heightRange?: [number, number];
}

// ---------------------------------------------------------------------------
// Per-style defaults
// ---------------------------------------------------------------------------

interface StyleConfig {
  baseSpeed: number;
  sizeRange: [number, number];
  opacity: number;
  emissiveIntensity: number;
  direction: THREE.Vector3; // primary drift direction
  wobbleAmplitude: number;
  wobbleFrequency: number;
}

const STYLE_CONFIGS: Record<Exclude<ParticleStyle, 'none'>, StyleConfig> = {
  dust: {
    baseSpeed: 0.08,
    sizeRange: [0.015, 0.04],
    opacity: 0.4,
    emissiveIntensity: 0.0,
    direction: new THREE.Vector3(0.02, 0.03, 0.01),
    wobbleAmplitude: 0.3,
    wobbleFrequency: 0.4,
  },
  sparks: {
    baseSpeed: 0.2,
    sizeRange: [0.01, 0.025],
    opacity: 0.8,
    emissiveIntensity: 0.6,
    direction: new THREE.Vector3(0.0, 0.15, 0.0),
    wobbleAmplitude: 0.15,
    wobbleFrequency: 1.2,
  },
  snow: {
    baseSpeed: 0.06,
    sizeRange: [0.02, 0.05],
    opacity: 0.6,
    emissiveIntensity: 0.0,
    direction: new THREE.Vector3(0.01, -0.08, 0.005),
    wobbleAmplitude: 0.4,
    wobbleFrequency: 0.3,
  },
  bubbles: {
    baseSpeed: 0.04,
    sizeRange: [0.03, 0.07],
    opacity: 0.25,
    emissiveIntensity: 0.1,
    direction: new THREE.Vector3(0.0, 0.06, 0.0),
    wobbleAmplitude: 0.5,
    wobbleFrequency: 0.25,
  },
};

// ---------------------------------------------------------------------------
// Particle data structure
// ---------------------------------------------------------------------------

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  phase: number; // random phase offset for wobble
  speed: number; // individual speed multiplier
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function initParticle(
  spread: number,
  heightRange: [number, number],
  config: StyleConfig,
): ParticleData {
  return {
    position: new THREE.Vector3(
      randomRange(-spread, spread),
      randomRange(heightRange[0], heightRange[1]),
      randomRange(-spread, spread),
    ),
    velocity: config.direction.clone().multiplyScalar(randomRange(0.5, 1.5)),
    scale: randomRange(config.sizeRange[0], config.sizeRange[1]),
    phase: Math.random() * Math.PI * 2,
    speed: randomRange(0.6, 1.4),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleStyle = 'dust',
  color = '#FFFFFF',
  count = 60,
  spread = 8,
  heightRange = [0.3, 5],
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // Bail early if no particles
  if (particleStyle === 'none') return null;

  const clampedCount = Math.max(0, Math.min(100, count));
  const config = STYLE_CONFIGS[particleStyle];

  // Initialize particle data
  const particles = useMemo<ParticleData[]>(() => {
    const arr: ParticleData[] = [];
    for (let i = 0; i < clampedCount; i++) {
      arr.push(initParticle(spread, heightRange, config));
    }
    return arr;
    // Re-initialize when style or count changes
  }, [particleStyle, clampedCount, spread, heightRange[0], heightRange[1]]);

  // Material
  const material = useMemo(() => {
    const c = new THREE.Color(color);
    return new THREE.MeshStandardMaterial({
      color: c,
      emissive: config.emissiveIntensity > 0 ? c : new THREE.Color('#000000'),
      emissiveIntensity: config.emissiveIntensity,
      transparent: true,
      opacity: config.opacity,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: false,
    });
  }, [color, config.opacity, config.emissiveIntensity]);

  // Sphere geometry shared by all instances
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);

  // Set initial instance matrices
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < clampedCount; i++) {
      const p = particles[i];
      tempMatrix.makeScale(p.scale, p.scale, p.scale);
      tempMatrix.setPosition(p.position);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particles, clampedCount]);

  // Animate each frame
  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    const t = _state.clock.getElapsedTime();

    for (let i = 0; i < clampedCount; i++) {
      const p = particles[i];

      // Move along velocity
      const dt = delta * config.baseSpeed * p.speed;
      p.position.addScaledVector(p.velocity, dt * 60);

      // Add wobble (sinusoidal lateral drift)
      const wobbleX =
        Math.sin(t * config.wobbleFrequency + p.phase) *
        config.wobbleAmplitude *
        delta;
      const wobbleZ =
        Math.cos(t * config.wobbleFrequency * 0.7 + p.phase + 1.5) *
        config.wobbleAmplitude *
        delta;
      p.position.x += wobbleX;
      p.position.z += wobbleZ;

      // Wrap particles that leave the bounds
      if (p.position.y > heightRange[1] + 1) {
        p.position.y = heightRange[0] - 0.5;
        p.position.x = randomRange(-spread, spread);
        p.position.z = randomRange(-spread, spread);
      } else if (p.position.y < heightRange[0] - 1) {
        p.position.y = heightRange[1] + 0.5;
        p.position.x = randomRange(-spread, spread);
        p.position.z = randomRange(-spread, spread);
      }

      if (Math.abs(p.position.x) > spread + 1) {
        p.position.x = -Math.sign(p.position.x) * spread;
      }
      if (Math.abs(p.position.z) > spread + 1) {
        p.position.z = -Math.sign(p.position.z) * spread;
      }

      // Update instance matrix
      tempMatrix.makeScale(p.scale, p.scale, p.scale);
      tempMatrix.setPosition(p.position);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, clampedCount]}
      frustumCulled={false}
    />
  );
};

export default ParticleSystem;
