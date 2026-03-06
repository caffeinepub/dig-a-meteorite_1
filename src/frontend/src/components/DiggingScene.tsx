import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Coins,
  FlaskConical,
  Package,
  RotateCcw,
  ShoppingBag,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import CreditsMachine from "./CreditsMachine";
import FuseMachine from "./FuseMachine";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";
import InventoryPanel from "./InventoryPanel";
import MuseumInterior from "./MuseumInterior";
import RebirthPanel from "./RebirthPanel";
import SellShop from "./SellShop";

type ActivePanel = "fuse" | "coins" | "shop" | "rebirth" | "inventory" | null;

// ─── Earth Layer Component ───────────────────────────────────────────────────
function EarthLayer({
  y,
  width,
  color,
  height = 0.4,
}: {
  y: number;
  width: number;
  color: string;
  height?: number;
}) {
  return (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[width, height, width * 0.7]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

// ─── Particle System ─────────────────────────────────────────────────────────
function DirtParticle({
  position,
  onDone,
}: {
  position: [number, number, number];
  onDone: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const velocity = useRef([
    (Math.random() - 0.5) * 0.15,
    Math.random() * 0.12 + 0.05,
    (Math.random() - 0.5) * 0.15,
  ]);
  const lifetime = useRef(0);

  useFrame((_state, delta) => {
    if (!mesh.current) return;
    lifetime.current += delta;
    velocity.current[1] -= delta * 0.3; // gravity

    mesh.current.position.x += velocity.current[0];
    mesh.current.position.y += velocity.current[1];
    mesh.current.position.z += velocity.current[2];
    mesh.current.rotation.x += delta * 3;
    mesh.current.rotation.z += delta * 2;

    if (lifetime.current > 1.2) onDone();
    mesh.current.scale.setScalar(Math.max(0, 1 - lifetime.current / 1.2));
  });

  const colors = ["#5c3a1e", "#7a4a28", "#8b6340", "#4a2e14"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <mesh ref={mesh} position={position} castShadow>
      <boxGeometry args={[0.06, 0.06, 0.06]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

// ─── Meteorite in Ground ─────────────────────────────────────────────────────
function MeteoriteGlow({
  baseSize,
  visible,
}: {
  baseSize: number;
  visible: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_state, delta) => {
    t.current += delta;
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.5;
      mesh.current.rotation.x += delta * 0.2;
      const scale = 0.9 + Math.sin(t.current * 2) * 0.1;
      mesh.current.scale.setScalar(scale);
    }
    if (light.current) {
      light.current.intensity = 1 + Math.sin(t.current * 3) * 0.5;
    }
  });

  if (!visible) return null;

  const x = (Math.random() - 0.5) * baseSize * 0.6;

  return (
    <group position={[x, -0.35, 0]}>
      <mesh ref={mesh}>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <pointLight ref={light} color="#8b5cf6" intensity={1.5} distance={3} />
    </group>
  );
}

// ─── Dig Crater Effect ────────────────────────────────────────────────────────
function DigCrater({ active }: { active: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_state, delta) => {
    if (!active || !mesh.current) return;
    t.current += delta;
    const scale = Math.max(0, 1 - t.current * 1.5);
    mesh.current.scale.setScalar(scale);
  });

  if (!active) return null;

  return (
    <mesh ref={mesh} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.5, 16]} />
      <meshStandardMaterial
        color="#5c3a1e"
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Player Character ─────────────────────────────────────────────────────────
function PlayerCharacter({
  isDigging,
  isWalking,
  groupRef,
}: {
  isDigging: boolean;
  isWalking: boolean;
  groupRef?: React.RefObject<THREE.Group | null>;
}) {
  const torsoRef = useRef<THREE.Mesh>(null);
  const rightArmGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const armAngle = useRef(0);

  useFrame((_state, delta) => {
    t.current += delta;

    // Idle breathing — subtle y-scale pulse on torso
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(t.current * 1.8) * 0.025;
    }

    // Dig swing animation on right arm group
    if (rightArmGroupRef.current) {
      const targetAngle = isDigging ? -1.2 : 0;
      armAngle.current += (targetAngle - armAngle.current) * (delta * 10);
      rightArmGroupRef.current.rotation.x = armAngle.current;
    }

    // Walking leg animation
    if (leftLegRef.current && rightLegRef.current) {
      if (isWalking) {
        leftLegRef.current.rotation.x = Math.sin(t.current * 6) * 0.4;
        rightLegRef.current.rotation.x =
          Math.sin(t.current * 6 + Math.PI) * 0.4;
      } else {
        leftLegRef.current.rotation.x +=
          (0 - leftLegRef.current.rotation.x) * delta * 10;
        rightLegRef.current.rotation.x +=
          (0 - rightLegRef.current.rotation.x) * delta * 10;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.65, 0]}>
      {/* Head */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#e8b88a" roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.07, 0.88, 0.17]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#2c1a0e" />
      </mesh>
      <mesh position={[0.07, 0.88, 0.17]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#2c1a0e" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.185, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3b1f0a" roughness={1} />
      </mesh>

      {/* Torso — blue shirt */}
      <mesh ref={torsoRef} position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.32, 0.42, 0.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.22, 0.36, 0]} castShadow>
        <boxGeometry args={[0.1, 0.38, 0.12]} />
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.22, 0.14, 0]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color="#e8b88a" roughness={0.8} />
      </mesh>

      {/* Right Arm Group — swings with pickaxe */}
      <group ref={rightArmGroupRef} position={[0.22, 0.55, 0]}>
        {/* Right Arm */}
        <mesh position={[0, -0.19, 0]} castShadow>
          <boxGeometry args={[0.1, 0.38, 0.12]} />
          <meshStandardMaterial color="#2563eb" roughness={0.8} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.41, 0]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#e8b88a" roughness={0.8} />
        </mesh>

        {/* Pickaxe handle */}
        <mesh position={[0.04, -0.6, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.04, 0.42, 0.04]} />
          <meshStandardMaterial color="#7c5230" roughness={0.95} />
        </mesh>
        {/* Pickaxe head */}
        <mesh
          position={[0.04, -0.84, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <boxGeometry args={[0.08, 0.28, 0.06]} />
          <meshStandardMaterial
            color="#6b7280"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Legs — brown pants */}
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.09, 0.0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.34, 0.14]} />
        <meshStandardMaterial color="#7c4a14" roughness={0.9} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.09, 0.0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.34, 0.14]} />
        <meshStandardMaterial color="#7c4a14" roughness={0.9} />
      </mesh>

      {/* Boots */}
      <mesh position={[-0.09, -0.19, 0.02]}>
        <boxGeometry args={[0.13, 0.1, 0.17]} />
        <meshStandardMaterial color="#2c1a0e" roughness={1} />
      </mesh>
      <mesh position={[0.09, -0.19, 0.02]}>
        <boxGeometry args={[0.13, 0.1, 0.17]} />
        <meshStandardMaterial color="#2c1a0e" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Museum 3D Building ───────────────────────────────────────────────────────
function Museum3DBuilding({ onEnter }: { onEnter: () => void }) {
  return (
    <group position={[30, 0, 0]}>
      {/* Main body */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 6, 10]} />
        <meshStandardMaterial
          color="#f5f5f0"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 6.75, 0]} castShadow>
        <boxGeometry args={[13, 1.5, 11]} />
        <meshStandardMaterial color="#8b8b8b" roughness={0.6} />
      </mesh>

      {/* Columns — 4 at front */}
      {[-3.5, -1.2, 1.2, 3.5].map((x) => (
        <mesh key={x} position={[x, 3, -5]} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 6, 12]} />
          <meshStandardMaterial color="#e8e8e0" roughness={0.5} />
        </mesh>
      ))}

      {/* Column capitals */}
      {[-3.5, -1.2, 1.2, 3.5].map((x) => (
        <mesh key={`cap-${x}`} position={[x, 6.1, -5]}>
          <boxGeometry args={[0.55, 0.3, 0.55]} />
          <meshStandardMaterial color="#e0e0d8" roughness={0.5} />
        </mesh>
      ))}

      {/* Door — dark wood */}
      <mesh position={[0, 1.8, -5.01]}>
        <boxGeometry args={[1.8, 3.2, 0.05]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1.8, -5.02]}>
        <boxGeometry args={[2.0, 3.5, 0.04]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.9} />
      </mesh>

      {/* Sign backing */}
      <mesh position={[0, 5.8, -5.02]}>
        <boxGeometry args={[5, 0.8, 0.08]} />
        <meshStandardMaterial color="#2c2c5e" roughness={0.6} />
      </mesh>

      {/* Front entrance light */}
      <pointLight
        position={[0, 4.5, -4]}
        color="#fff8e7"
        intensity={2}
        distance={10}
      />

      {/* Steps */}
      <mesh position={[0, 0.15, -5.6]}>
        <boxGeometry args={[8, 0.3, 1.2]} />
        <meshStandardMaterial color="#d8d8d0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.35, -5.0]}>
        <boxGeometry args={[8, 0.1, 0.8]} />
        <meshStandardMaterial color="#d0d0c8" roughness={0.7} />
      </mesh>

      {/* Invisible trigger zone at entrance */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        position={[0, 1, -5]}
        onClick={onEnter}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[3, 3, 1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── Fuse Machine Building ────────────────────────────────────────────────────
function FuseMachineBuilding({
  onEnterFuse,
}: {
  onEnterFuse: () => void;
}) {
  const t = useRef(0);
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_state, delta) => {
    t.current += delta;
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 1.5;
      sphereRef.current.position.y = 3.5 + Math.sin(t.current * 2) * 0.15;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(t.current * 3) * 0.8;
    }
  });

  return (
    <group position={[-22, 0, -12]}>
      {/* Base cylinder */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 1.5, 12]} />
        <meshStandardMaterial color="#2d1b69" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Cauldron body */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.0, 1.2, 12]} />
        <meshStandardMaterial
          color="#4c1d95"
          roughness={0.5}
          metalness={0.4}
          emissive="#3b0764"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Cauldron rim */}
      <mesh position={[0, 2.65, 0]}>
        <torusGeometry args={[1.45, 0.12, 8, 24]} />
        <meshStandardMaterial
          color="#7c3aed"
          metalness={0.6}
          roughness={0.3}
          emissive="#5b21b6"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Middle pipe connectors */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable positions
          key={i}
          position={[Math.cos(angle) * 1.1, 1.8, Math.sin(angle) * 1.1]}
          rotation={[0, -angle, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
          <meshStandardMaterial
            color="#6d28d9"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* Glowing orb on top */}
      <mesh ref={sphereRef} position={[0, 3.5, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Purple glow light */}
      <pointLight
        ref={lightRef}
        position={[0, 3.5, 0]}
        color="#8b5cf6"
        intensity={2}
        distance={8}
      />
      {/* Sign post */}
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[2.8, 0.6, 0.08]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
      </mesh>
      {/* Invisible proximity trigger */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={onEnterFuse}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── Shop Building ────────────────────────────────────────────────────────────
function ShopBuilding({
  onEnterShop,
}: {
  onEnterShop: () => void;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  useFrame((_state, delta) => {
    t.current += delta;
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t.current * 2) * 0.3;
    }
  });

  return (
    <group position={[-8, 0, -18]}>
      {/* Main structure */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 3]} />
        <meshStandardMaterial color="#7c5230" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 3.25, 0]} castShadow>
        <boxGeometry args={[5, 0.3, 3.5]} />
        <meshStandardMaterial color="#4a2e14" roughness={0.9} />
      </mesh>
      {/* Awning / canopy */}
      <mesh position={[0, 2.8, -1.8]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[4.2, 0.12, 1.4]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
      {/* Counter */}
      <mesh position={[0, 0.8, -1.7]} castShadow>
        <boxGeometry args={[3, 0.8, 1]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.8} />
      </mesh>
      {/* Window */}
      <mesh position={[-1, 1.6, -1.52]}>
        <boxGeometry args={[1.0, 0.9, 0.05]} />
        <meshStandardMaterial
          color="#a3e6ff"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[1, 1.6, -1.52]}>
        <boxGeometry args={[1.0, 0.9, 0.05]} />
        <meshStandardMaterial
          color="#a3e6ff"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, -1.52]}>
        <boxGeometry args={[0.8, 2.0, 0.05]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.9} />
      </mesh>
      {/* Green glow sign strip */}
      <mesh position={[0, 3.05, -1.52]}>
        <boxGeometry args={[3.5, 0.35, 0.06]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Green light */}
      <pointLight
        ref={lightRef}
        position={[0, 2.5, -1]}
        color="#22c55e"
        intensity={1.5}
        distance={6}
      />
      {/* Invisible trigger */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={onEnterShop}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── Rebirth Building ─────────────────────────────────────────────────────────
function RebirthBuilding({
  onEnterRebirth,
}: {
  onEnterRebirth: () => void;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  useFrame((_state, delta) => {
    t.current += delta;
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 2;
      const s = 0.85 + Math.sin(t.current * 2.5) * 0.15;
      sphereRef.current.scale.setScalar(s);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.5 + Math.sin(t.current * 3) * 1.0;
    }
  });

  return (
    <group position={[14, 0, -18]}>
      {/* Base platform */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.2, 0.4, 16]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Obelisk shaft */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <boxGeometry args={[1.5, 6, 1.5]} />
        <meshStandardMaterial
          color="#6b7280"
          roughness={0.6}
          metalness={0.3}
          emissive="#374151"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Rune engravings */}
      {[-1.5, -0.5, 0.5, 1.5].map((yOff, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable positions
          key={i}
          position={[0.76, 3.4 + yOff, 0]}
        >
          <boxGeometry args={[0.05, 0.3, 0.8]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* Top pyramid cap */}
      <mesh position={[0, 6.8, 0]} castShadow>
        <coneGeometry args={[1.1, 1.6, 4]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#ea580c"
          emissiveIntensity={0.6}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Emissive orange sphere */}
      <mesh ref={sphereRef} position={[0, 7.8, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      {/* Orange light */}
      <pointLight
        ref={lightRef}
        position={[0, 7, 0]}
        color="#f97316"
        intensity={2.5}
        distance={8}
      />
      {/* Invisible trigger */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={onEnterRebirth}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── Security Guard 3D ────────────────────────────────────────────────────────
function SecurityGuard3D({ index }: { index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_state, delta) => {
    t.current += delta * 0.8;
    if (groupRef.current) {
      groupRef.current.position.y = 0.65 + Math.sin(t.current) * 0.04;
    }
  });

  const px = 27 + index * 2.5;

  return (
    <group ref={groupRef} position={[px, 0.65, -3]}>
      {/* Head */}
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#6b4226" roughness={0.8} />
      </mesh>
      {/* Hat */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.22, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.06, 0.84, 0.15]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.06, 0.84, 0.15]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Body — navy uniform */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.18]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      {/* Badge */}
      <mesh position={[0.1, 0.44, 0.1]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.2, 0.33, 0]}>
        <boxGeometry args={[0.09, 0.35, 0.12]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.2, 0.33, 0]}>
        <boxGeometry args={[0.09, 0.35, 0.12]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.08, -0.02, 0]}>
        <boxGeometry args={[0.11, 0.32, 0.13]} />
        <meshStandardMaterial color="#152840" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, -0.02, 0]}>
        <boxGeometry args={[0.11, 0.32, 0.13]} />
        <meshStandardMaterial color="#152840" roughness={0.8} />
      </mesh>
      {/* Boots */}
      <mesh position={[-0.08, -0.2, 0.02]}>
        <boxGeometry args={[0.12, 0.1, 0.15]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, -0.2, 0.02]}>
        <boxGeometry args={[0.12, 0.1, 0.15]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 2.0, 7]} />
        <meshStandardMaterial color="#5c3a1e" roughness={1} />
      </mesh>
      {/* Lower foliage */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[1.4, 2.2, 8]} />
        <meshStandardMaterial color="#2d6a2d" roughness={0.9} />
      </mesh>
      {/* Mid foliage */}
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[1.0, 1.9, 8]} />
        <meshStandardMaterial color="#3a7a3a" roughness={0.9} />
      </mesh>
      {/* Top foliage */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <coneGeometry args={[0.6, 1.5, 8]} />
        <meshStandardMaterial color="#4a8a4a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Pre-generated tree layout so positions are stable (no random on render)
const FOREST_TREES: { pos: [number, number, number]; scale: number }[] =
  (() => {
    const trees: { pos: [number, number, number]; scale: number }[] = [];
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const rand = rng(42);

    const HALF = 47; // map edge ±47
    const DEPTH = 7; // how many units deep the forest goes inward
    const SPACING = 3.2;

    // North edge (z = -HALF to -(HALF-DEPTH))
    for (let x = -HALF; x <= HALF; x += SPACING) {
      for (let d = 0; d < DEPTH; d += SPACING) {
        const jx = (rand() - 0.5) * 1.5;
        const jz = (rand() - 0.5) * 1.5;
        const sc = 0.7 + rand() * 0.6;
        trees.push({ pos: [x + jx, 0.45, -(HALF - d) + jz], scale: sc });
      }
    }
    // South edge (z = HALF-DEPTH to HALF)
    for (let x = -HALF; x <= HALF; x += SPACING) {
      for (let d = 0; d < DEPTH; d += SPACING) {
        const jx = (rand() - 0.5) * 1.5;
        const jz = (rand() - 0.5) * 1.5;
        const sc = 0.7 + rand() * 0.6;
        trees.push({ pos: [x + jx, 0.45, HALF - d + jz], scale: sc });
      }
    }
    // West edge (x = -HALF to -(HALF-DEPTH))
    for (let z = -HALF + DEPTH; z <= HALF - DEPTH; z += SPACING) {
      for (let d = 0; d < DEPTH; d += SPACING) {
        const jx = (rand() - 0.5) * 1.5;
        const jz = (rand() - 0.5) * 1.5;
        const sc = 0.7 + rand() * 0.6;
        trees.push({ pos: [-(HALF - d) + jx, 0.45, z + jz], scale: sc });
      }
    }
    // East edge (x = HALF-DEPTH to HALF) — skip area near museum (x ~30, z ~0)
    for (let z = -HALF + DEPTH; z <= HALF - DEPTH; z += SPACING) {
      for (let d = 0; d < DEPTH; d += SPACING) {
        const tx = HALF - d;
        const tz = z;
        // Leave a gap near museum entrance
        if (tx > 24 && tx < 48 && tz > -10 && tz < 10) continue;
        const jx = (rand() - 0.5) * 1.5;
        const jz = (rand() - 0.5) * 1.5;
        const sc = 0.7 + rand() * 0.6;
        trees.push({ pos: [tx + jx, 0.45, tz + jz], scale: sc });
      }
    }
    return trees;
  })();

function ForestEdges() {
  return (
    <>
      {FOREST_TREES.map((t, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static positions
        <Tree key={i} position={t.pos} scale={t.scale} />
      ))}
    </>
  );
}

// ─── Scene Content ────────────────────────────────────────────────────────────
function SceneContent({
  baseSize,
  onDig,
  isDigging,
  onEnterMuseum,
  onNearMuseum,
  cameraYawOffsetRef,
  onNearFuse,
  onEnterFuse,
  onNearShop,
  onEnterShop,
  onNearRebirth,
  onEnterRebirth,
}: {
  baseSize: number;
  onDig: () => void;
  isDigging: boolean;
  onEnterMuseum: () => void;
  onNearMuseum: (near: boolean) => void;
  cameraYawOffsetRef: React.RefObject<number>;
  onNearFuse: (near: boolean) => void;
  onEnterFuse: () => void;
  onNearShop: (near: boolean) => void;
  onEnterShop: () => void;
  onNearRebirth: (near: boolean) => void;
  onEnterRebirth: () => void;
}) {
  const [particles, setParticles] = useState<
    { id: number; pos: [number, number, number] }[]
  >([]);
  const [showCrater, setShowCrater] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const particleId = useRef(0);

  // Player movement state
  const playerGroupRef = useRef<THREE.Group>(null);
  const playerPos = useRef({ x: 0, z: 0 });
  const playerAngle = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const museumEntered = useRef(false);
  const wasNearMuseum = useRef(false);
  const fuseEntered = useRef(false);
  const wasNearFuse = useRef(false);
  const shopEntered = useRef(false);
  const wasNearShop = useRef(false);
  const rebirthEntered = useRef(false);
  const wasNearRebirth = useRef(false);

  const { securityGuards } = useGameStore();

  const { camera } = useThree();

  // Key listeners for WASD movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // WASD movement + close third-person camera follow
  useFrame((_state, delta) => {
    const speed = 8 * delta;
    const turnSpeed = 2.5;

    if (keys.current.a) {
      playerAngle.current += turnSpeed * delta;
    }
    if (keys.current.d) {
      playerAngle.current -= turnSpeed * delta;
    }

    const moving = keys.current.w || keys.current.s;
    if (keys.current.w) {
      playerPos.current.x += Math.sin(playerAngle.current) * speed;
      playerPos.current.z += Math.cos(playerAngle.current) * speed;
    }
    if (keys.current.s) {
      playerPos.current.x -= Math.sin(playerAngle.current) * speed;
      playerPos.current.z -= Math.cos(playerAngle.current) * speed;
    }

    // Update walking state (avoid setState in tight loop — use setIsWalking with comparison)
    setIsWalking((prev) => {
      const next = !!moving;
      return prev === next ? prev : next;
    });

    // Clamp to map bounds
    playerPos.current.x = Math.max(-45, Math.min(45, playerPos.current.x));
    playerPos.current.z = Math.max(-45, Math.min(45, playerPos.current.z));

    // Update player group
    if (playerGroupRef.current) {
      playerGroupRef.current.position.x = playerPos.current.x;
      playerGroupRef.current.position.y = 0.65;
      playerGroupRef.current.position.z = playerPos.current.z;
      playerGroupRef.current.rotation.y = playerAngle.current;
    }

    // Close third-person camera follow (3 units behind, 1.8 units up)
    // Incorporate camera yaw offset for mouse-look orbit
    const yawOffset = cameraYawOffsetRef.current ?? 0;
    const angle = playerAngle.current + yawOffset;
    const camTargetX = playerPos.current.x - Math.sin(angle) * 3;
    const camTargetZ = playerPos.current.z - Math.cos(angle) * 3;
    const camTargetY = 2.45; // player Y (0.65) + 1.8

    // Manual lerp for smooth follow
    camera.position.x += (camTargetX - camera.position.x) * 0.12;
    camera.position.y += (camTargetY - camera.position.y) * 0.12;
    camera.position.z += (camTargetZ - camera.position.z) * 0.12;

    // Look at player chest level
    camera.lookAt(playerPos.current.x, 0.65 + 0.5, playerPos.current.z);

    // Museum proximity check
    const dxM = playerPos.current.x - 30;
    const dzM = playerPos.current.z - 0;
    const distM = Math.sqrt(dxM * dxM + dzM * dzM);
    if (distM < 6 && !museumEntered.current) {
      museumEntered.current = true;
      onEnterMuseum();
    }
    if (distM >= 6) {
      museumEntered.current = false;
    }
    const isNearMuseum = distM < 12 && distM >= 6;
    if (isNearMuseum !== wasNearMuseum.current) {
      wasNearMuseum.current = isNearMuseum;
      onNearMuseum(isNearMuseum);
    }

    // Fuse Machine proximity check (position [-22, 0, -12])
    const dxF = playerPos.current.x - -22;
    const dzF = playerPos.current.z - -12;
    const distF = Math.sqrt(dxF * dxF + dzF * dzF);
    if (distF < 4 && !fuseEntered.current) {
      fuseEntered.current = true;
      onEnterFuse();
    }
    if (distF >= 4) {
      fuseEntered.current = false;
    }
    const isNearFuse = distF < 8 && distF >= 4;
    if (isNearFuse !== wasNearFuse.current) {
      wasNearFuse.current = isNearFuse;
      onNearFuse(isNearFuse);
    }

    // Shop proximity check (position [-8, 0, -18])
    const dxS = playerPos.current.x - -8;
    const dzS = playerPos.current.z - -18;
    const distS = Math.sqrt(dxS * dxS + dzS * dzS);
    if (distS < 4 && !shopEntered.current) {
      shopEntered.current = true;
      onEnterShop();
    }
    if (distS >= 4) {
      shopEntered.current = false;
    }
    const isNearShop = distS < 8 && distS >= 4;
    if (isNearShop !== wasNearShop.current) {
      wasNearShop.current = isNearShop;
      onNearShop(isNearShop);
    }

    // Rebirth proximity check (position [14, 0, -18])
    const dxR = playerPos.current.x - 14;
    const dzR = playerPos.current.z - -18;
    const distR = Math.sqrt(dxR * dxR + dzR * dzR);
    if (distR < 4 && !rebirthEntered.current) {
      rebirthEntered.current = true;
      onEnterRebirth();
    }
    if (distR >= 4) {
      rebirthEntered.current = false;
    }
    const isNearRebirth = distR < 8 && distR >= 4;
    if (isNearRebirth !== wasNearRebirth.current) {
      wasNearRebirth.current = isNearRebirth;
      onNearRebirth(isNearRebirth);
    }
  });

  const handleDig = useCallback(() => {
    onDig();

    // Spawn dirt particles near player
    const newParticles: { id: number; pos: [number, number, number] }[] = [];
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleId.current++,
        pos: [
          playerPos.current.x + (Math.random() - 0.5) * 0.4,
          0.1,
          playerPos.current.z + (Math.random() - 0.5) * 0.3,
        ],
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setShowCrater(true);
    setTimeout(() => setShowCrater(false), 600);
  }, [onDig]);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const w = 100;

  return (
    <>
      {/* Lighting — bright daytime */}
      <ambientLight intensity={2.5} color="#ffffff" />
      <directionalLight
        position={[10, 15, 5]}
        intensity={3}
        castShadow
        color="#fffde7"
      />
      {/* Soft fill light from opposite side */}
      <directionalLight
        position={[-8, 6, -4]}
        intensity={1.0}
        color="#cce8ff"
      />

      {/* Daytime sky */}
      <Sky
        sunPosition={[100, 20, 100]}
        turbidity={2}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Earth Layers */}
      <EarthLayer y={0.2} width={w} color="#4a7c59" height={0.5} />
      <EarthLayer y={-0.15} width={w * 0.98} color="#5c3a1e" />
      <EarthLayer y={-0.52} width={w * 0.96} color="#7a4a28" />
      <EarthLayer y={-0.88} width={w * 0.94} color="#6b3d1e" />
      <EarthLayer y={-1.22} width={w * 0.92} color="#8b4513" />
      <EarthLayer y={-1.55} width={w * 0.9} color="#4a3728" />
      <EarthLayer y={-1.85} width={w * 0.88} color="#3d2b1f" height={0.5} />
      <EarthLayer y={-2.1} width={w * 0.86} color="#2d1b0e" height={0.3} />

      {/* Rocky layer at bottom */}
      <EarthLayer y={-2.35} width={w * 0.84} color="#5c5c5c" height={0.3} />

      {/* Forest at map edges */}
      <ForestEdges />

      {/* Meteorite glow effect */}
      <MeteoriteGlow baseSize={baseSize} visible={true} />

      {/* Museum building */}
      <Museum3DBuilding onEnter={onEnterMuseum} />

      {/* Fuse Machine Building */}
      <FuseMachineBuilding onEnterFuse={onEnterFuse} />

      {/* Shop Building */}
      <ShopBuilding onEnterShop={onEnterShop} />

      {/* Rebirth Building */}
      <RebirthBuilding onEnterRebirth={onEnterRebirth} />

      {/* Security Guards */}
      {securityGuards.map((guard, i) => (
        <SecurityGuard3D key={guard.id} index={i} />
      ))}

      {/* Player Character — driven by WASD via playerGroupRef */}
      <PlayerCharacter
        isDigging={isDigging}
        isWalking={isWalking}
        groupRef={playerGroupRef}
      />

      {/* Clickable dig surface */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh, not a DOM element */}
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleDig}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <planeGeometry args={[w, w * 0.7]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Crater effect */}
      <DigCrater active={showCrater} />

      {/* Dirt particles */}
      {particles.map((p) => (
        <DirtParticle
          key={p.id}
          position={p.pos}
          onDone={() => removeParticle(p.id)}
        />
      ))}
    </>
  );
}

// ─── Rarity tier helpers ─────────────────────────────────────────────────────
function getRarityTier(
  rarity: Rarity,
): "common" | "uncommon" | "rare" | "epic" | "legendary" {
  if (["impossible", "googleplex", "crazy", "divine"].includes(rarity))
    return "legendary";
  if (["celestial", "secret", "god"].includes(rarity)) return "epic";
  if (["mythic", "legendary"].includes(rarity)) return "rare";
  if (rarity === "epic") return "uncommon";
  return "common";
}

// ─── HUD Overlay ──────────────────────────────────────────────────────────────
function RarityRevealOverlay({
  rarity,
  onDone,
}: { rarity: Rarity; id: number; onDone: () => void }) {
  const color = RARITY_COLORS[rarity];
  const label = RARITY_LABELS[rarity];
  const tier = getRarityTier(rarity);

  const overlayAlpha =
    tier === "legendary"
      ? 0.92
      : tier === "epic"
        ? 0.85
        : tier === "rare"
          ? 0.78
          : tier === "uncommon"
            ? 0.68
            : 0.55;

  const displayDuration =
    tier === "legendary"
      ? 2.6
      : tier === "epic"
        ? 2.2
        : tier === "rare"
          ? 1.9
          : tier === "uncommon"
            ? 1.6
            : 1.2;

  const emoji =
    tier === "legendary"
      ? "✨"
      : tier === "epic"
        ? "⭐"
        : tier === "rare"
          ? "💫"
          : "";

  // Shimmer animation for the highest tiers
  const showShimmer = tier === "legendary" || tier === "epic";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, overlayAlpha, overlayAlpha, 0] }}
      transition={{
        duration: displayDuration,
        times: [0, 0.12, 0.72, 1],
        ease: "easeInOut",
      }}
      onAnimationComplete={onDone}
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: `rgba(0,0,0,${overlayAlpha})` }}
    >
      {/* Colour splash backdrop behind text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.6, 1.4], opacity: [0, 0.18, 0] }}
        transition={{ duration: displayDuration * 0.8, ease: "easeOut" }}
        className="absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />

      {/* Main rarity card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{
          scale: [0.5, 1.15, 1.0],
          opacity: [0, 1, 1],
          y: [30, -8, 0],
        }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex flex-col items-center gap-3 px-10 py-7 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.85), ${color}18)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 60px 20px ${color}55, 0 0 120px 40px ${color}22, inset 0 1px 0 ${color}44`,
        }}
      >
        {/* Shimmer sweep for top tiers */}
        {showShimmer && (
          <motion.div
            className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 1.1, delay: 0.3, ease: "easeInOut" }}
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                transform: "skewX(-15deg)",
              }}
            />
          </motion.div>
        )}

        {/* Emoji row */}
        {emoji && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-3xl"
            style={{ zIndex: 2 }}
          >
            {emoji}
          </motion.div>
        )}

        {/* "YOU FOUND A" label */}
        <span
          className="text-xs font-mono tracking-[0.3em] uppercase"
          style={{ color: `${color}cc`, zIndex: 2 }}
        >
          You Found A
        </span>

        {/* Rarity name */}
        <motion.span
          initial={{ letterSpacing: "0.05em" }}
          animate={{ letterSpacing: ["0.05em", "0.18em", "0.12em"] }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display font-black text-4xl md:text-5xl uppercase"
          style={{
            color: color,
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}88`,
            zIndex: 2,
          }}
        >
          {label}
        </motion.span>

        {/* Tier badge */}
        {tier !== "common" && (
          <span
            className="text-xs font-bold font-mono px-3 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              background: `${color}22`,
              color: color,
              border: `1px solid ${color}66`,
              zIndex: 2,
            }}
          >
            {tier}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Quick Access Panel Buttons ──────────────────────────────────────────────
type PanelButtonDef = {
  id: Exclude<ActivePanel, null>;
  IconComponent: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  ocid: string;
};

const PANEL_BUTTONS: PanelButtonDef[] = [
  {
    id: "fuse",
    IconComponent: FlaskConical,
    label: "Fuse",
    color: "#7c3aed",
    ocid: "dig.fuse_button",
  },
  {
    id: "coins",
    IconComponent: Coins,
    label: "Coins",
    color: "#eab308",
    ocid: "dig.coins_button",
  },
  {
    id: "shop",
    IconComponent: ShoppingBag,
    label: "Shop",
    color: "#22c55e",
    ocid: "dig.shop_button",
  },
  {
    id: "rebirth",
    IconComponent: RotateCcw,
    label: "Rebirth",
    color: "#f97316",
    ocid: "dig.rebirth_button",
  },
  {
    id: "inventory",
    IconComponent: Package,
    label: "Items",
    color: "#06b6d4",
    ocid: "dig.inventory_button",
  },
];

function renderPanelContent(panel: Exclude<ActivePanel, null>) {
  switch (panel) {
    case "fuse":
      return <FuseMachine />;
    case "coins":
      return <CreditsMachine />;
    case "shop":
      return <SellShop />;
    case "rebirth":
      return <RebirthPanel />;
    case "inventory":
      return <InventoryPanel />;
  }
}

function getPanelTitle(panel: Exclude<ActivePanel, null>) {
  switch (panel) {
    case "fuse":
      return "⚗️ Fuse Machine";
    case "coins":
      return "🪙 Coins Machine";
    case "shop":
      return "🛒 Sell Shop";
    case "rebirth":
      return "🔄 Rebirth";
    case "inventory":
      return "🎒 Collection";
  }
}

// ─── Background Music Hook ────────────────────────────────────────────────────
// Heroic pentatonic note sequence (Hz)
const MELODY: number[] = [
  392, 440, 494, 523, 494, 440, 392, 330, 370, 415, 440, 415, 370, 330, 294,
  330,
];
const NOTE_DURATION = 0.38; // seconds per note
const NOTE_GAP = 0.04; // silence between notes
const GAIN_LEVEL = 0.07;

function useMusicPlayer(musicOn: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextNoteTimeRef = useRef(0);
  const noteIndexRef = useRef(0);
  const activeNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const isActiveRef = useRef(false);

  const stopAll = useCallback(() => {
    isActiveRef.current = false;
    if (schedulerTimerRef.current !== null) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    for (const { osc, gain } of activeNodesRef.current) {
      try {
        gain.gain.cancelScheduledValues(0);
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Already stopped
      }
    }
    activeNodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const scheduleNote = useCallback(() => {
    if (!isActiveRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const LOOK_AHEAD = 0.3; // schedule notes 300ms ahead

    while (nextNoteTimeRef.current < ctx.currentTime + LOOK_AHEAD) {
      const freq = MELODY[noteIndexRef.current % MELODY.length];
      noteIndexRef.current++;

      const startTime = nextNoteTimeRef.current;
      const endTime = startTime + NOTE_DURATION - NOTE_GAP;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(GAIN_LEVEL, startTime + 0.02);
      gain.gain.setValueAtTime(GAIN_LEVEL, endTime - 0.04);
      gain.gain.linearRampToValueAtTime(0, endTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(endTime);

      activeNodesRef.current.push({ osc, gain });
      nextNoteTimeRef.current += NOTE_DURATION;
    }

    // Clean up stopped nodes
    activeNodesRef.current = activeNodesRef.current.filter((n) => {
      try {
        return n.osc.context.state !== "closed";
      } catch {
        return false;
      }
    });

    if (isActiveRef.current) {
      schedulerTimerRef.current = setTimeout(scheduleNote, 150);
    }
  }, []);

  useEffect(() => {
    if (musicOn) {
      stopAll();
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        isActiveRef.current = true;
        nextNoteTimeRef.current = ctx.currentTime + 0.05;
        noteIndexRef.current = 0;
        ctx.resume().then(() => {
          scheduleNote();
        });
      } catch {
        // AudioContext not supported
      }
    } else {
      stopAll();
    }
    return () => {
      stopAll();
    };
  }, [musicOn, scheduleNote, stopAll]);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiggingScene() {
  const { credits, totalFound, baseSize, multiplier, digMeteor } =
    useGameStore();
  const [currentReveal, setCurrentReveal] = useState<{
    rarity: Rarity;
    id: number;
  } | null>(null);
  const [isDigging, setIsDigging] = useState(false);
  const [shakeContainer, setShakeContainer] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [museumOpen, setMuseumOpen] = useState(false);
  const [nearMuseum, setNearMuseum] = useState(false);
  const [nearFuse, setNearFuse] = useState(false);
  const [nearShop, setNearShop] = useState(false);
  const [nearRebirth, setNearRebirth] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const popupId = useRef(0);

  // Camera yaw offset for mouse-look orbit
  const cameraYawOffsetRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  // Music player hook
  useMusicPlayer(musicOn);

  const handleDig = useCallback(() => {
    if (isDigging) return;
    setIsDigging(true);
    setShakeContainer(true);

    const rarity = digMeteor();

    const id = popupId.current++;
    setCurrentReveal({ rarity, id });

    setTimeout(() => setIsDigging(false), 300);
    setTimeout(() => setShakeContainer(false), 400);
  }, [isDigging, digMeteor]);

  const togglePanel = useCallback((id: Exclude<ActivePanel, null>) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  const formatCredits = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  // Mouse-drag orbit handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastMouseX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouseX.current;
    lastMouseX.current = e.clientX;
    cameraYawOffsetRef.current -= dx * 0.005;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* HUD Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2">
        <div className="flex gap-3">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              COINS
            </span>
            <div className="text-sm font-bold font-mono text-yellow-400">
              {formatCredits(credits)} ✦
            </div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              FOUND
            </span>
            <div className="text-sm font-bold font-mono text-cyan-400">
              {totalFound.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              ×{multiplier}
            </span>
            <div className="text-xs text-purple-400 font-mono">MULTI</div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              LVL {baseSize}
            </span>
            <div className="text-xs text-green-400 font-mono">BASE</div>
          </div>
        </div>
      </div>

      {/* Music Toggle Button */}
      <button
        type="button"
        data-ocid="dig.music_toggle"
        onClick={() => setMusicOn((v) => !v)}
        title={musicOn ? "Turn music off" : "Turn music on"}
        className="absolute top-14 right-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all select-none"
        style={{
          background: musicOn ? "rgba(139,92,246,0.8)" : "rgba(10,10,20,0.72)",
          border: musicOn
            ? "1.5px solid #8b5cf6"
            : "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: musicOn
            ? "0 0 14px 4px rgba(139,92,246,0.5)"
            : "0 2px 8px rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          color: "white",
          cursor: "pointer",
        }}
      >
        {musicOn ? "🔇" : "🎵"}
      </button>

      {/* 3D Canvas */}
      <div
        className={`flex-1 ${shakeContainer ? "animate-dig-shake" : ""}`}
        style={{ minHeight: 0 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          shadows
          camera={{ position: [0, 2.45, 3], fov: 75 }}
          style={{ background: "#87CEEB" }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SceneContent
              baseSize={baseSize}
              onDig={handleDig}
              isDigging={isDigging}
              onEnterMuseum={() => {
                setMuseumOpen(true);
                setNearMuseum(false);
              }}
              onNearMuseum={setNearMuseum}
              cameraYawOffsetRef={cameraYawOffsetRef}
              onNearFuse={setNearFuse}
              onEnterFuse={() => {
                setActivePanel("fuse");
                setNearFuse(false);
              }}
              onNearShop={setNearShop}
              onEnterShop={() => {
                setActivePanel("shop");
                setNearShop(false);
              }}
              onNearRebirth={setNearRebirth}
              onEnterRebirth={() => {
                setActivePanel("rebirth");
                setNearRebirth(false);
              }}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Rarity Reveal Overlay */}
      <AnimatePresence>
        {currentReveal && (
          <RarityRevealOverlay
            key={currentReveal.id}
            rarity={currentReveal.rarity}
            id={currentReveal.id}
            onDone={() => setCurrentReveal(null)}
          />
        )}
      </AnimatePresence>

      {/* Quick-Access Panel Buttons — left side vertical strip */}
      <div className="absolute left-3 bottom-20 z-20 flex flex-col gap-2">
        {PANEL_BUTTONS.map((btn) => {
          const isActive = activePanel === btn.id;
          const { IconComponent } = btn;
          return (
            <motion.button
              key={btn.id}
              type="button"
              data-ocid={btn.ocid}
              onClick={() => togglePanel(btn.id)}
              whileHover={{ scale: 1.1, x: 4 }}
              whileTap={{ scale: 0.92 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group"
              style={{
                background: isActive ? `${btn.color}cc` : "rgba(10,10,20,0.72)",
                border: `1.5px solid ${isActive ? btn.color : "rgba(255,255,255,0.12)"}`,
                boxShadow: isActive
                  ? `0 0 14px 4px ${btn.color}66`
                  : "0 2px 8px rgba(0,0,0,0.4)",
                color: isActive ? "#fff" : btn.color,
                backdropFilter: "blur(8px)",
              }}
              title={btn.label}
            >
              <IconComponent className="w-5 h-5" />
              {/* Tooltip label */}
              <span
                className="absolute left-full ml-2 px-2 py-0.5 rounded-md text-xs font-bold font-mono whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "rgba(10,10,20,0.9)",
                  color: btn.color,
                  border: `1px solid ${btn.color}44`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {btn.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* DIG Button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <motion.button
          data-ocid="dig.primary_button"
          onClick={handleDig}
          disabled={isDigging}
          className="relative px-10 py-4 rounded-full font-display font-black text-xl tracking-widest uppercase select-none overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)",
            boxShadow:
              "0 0 30px 8px rgba(139, 92, 246, 0.5), 0 4px 20px rgba(0,0,0,0.5)",
            color: "white",
          }}
          whileHover={{
            scale: 1.05,
            boxShadow:
              "0 0 40px 12px rgba(139, 92, 246, 0.7), 0 4px 20px rgba(0,0,0,0.5)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            DIG!
          </span>
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              transform: "skewX(-20deg)",
            }}
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </motion.button>
        {multiplier > 1 && (
          <div className="text-center mt-1 text-xs text-purple-400 font-mono">
            Finds ×{multiplier} per dig
          </div>
        )}
      </div>

      {/* Proximity HUD hints */}
      <AnimatePresence>
        {nearMuseum && (
          <motion.div
            key="museum-hud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider pointer-events-none"
            style={{
              background: "rgba(44,44,94,0.9)",
              border: "1px solid rgba(150,130,255,0.4)",
              color: "#c4b5fd",
              backdropFilter: "blur(8px)",
            }}
          >
            🏛️ Press ENTER or walk closer to enter the Museum
          </motion.div>
        )}
        {nearFuse && (
          <motion.div
            key="fuse-hud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider pointer-events-none"
            style={{
              background: "rgba(30,10,60,0.9)",
              border: "1px solid rgba(139,92,246,0.5)",
              color: "#a78bfa",
              backdropFilter: "blur(8px)",
            }}
          >
            ⚗️ Walk closer to use the Fuse Machine
          </motion.div>
        )}
        {nearShop && (
          <motion.div
            key="shop-hud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider pointer-events-none"
            style={{
              background: "rgba(5,40,15,0.9)",
              border: "1px solid rgba(34,197,94,0.5)",
              color: "#86efac",
              backdropFilter: "blur(8px)",
            }}
          >
            🛒 Walk closer to enter the Shop
          </motion.div>
        )}
        {nearRebirth && (
          <motion.div
            key="rebirth-hud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider pointer-events-none"
            style={{
              background: "rgba(40,15,5,0.9)",
              border: "1px solid rgba(249,115,22,0.5)",
              color: "#fdba74",
              backdropFilter: "blur(8px)",
            }}
          >
            🔄 Walk closer to use the Rebirth Altar
          </motion.div>
        )}
      </AnimatePresence>

      {/* Museum Interior Overlay */}
      <MuseumInterior
        open={museumOpen}
        onClose={() => {
          setMuseumOpen(false);
        }}
      />

      {/* Slide-Up Feature Panel */}
      <AnimatePresence>
        {activePanel && (
          <>
            {/* Backdrop — clicking closes panel */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30"
              style={{
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(2px)",
              }}
              onClick={() => setActivePanel(null)}
            />

            {/* Panel */}
            <motion.div
              key={activePanel}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl flex flex-col overflow-hidden"
              style={{
                height: "62%",
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
                borderBottom: "none",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid oklch(var(--border))" }}
              >
                <span className="font-display font-bold text-base text-foreground">
                  {getPanelTitle(activePanel)}
                </span>
                <motion.button
                  type="button"
                  data-ocid="dig.panel_close_button"
                  onClick={() => setActivePanel(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: "oklch(var(--muted))",
                    color: "oklch(var(--muted-foreground))",
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {renderPanelContent(activePanel)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
