import { Html, Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Coins,
  FlaskConical,
  Package,
  RotateCcw,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import RebirthPanel from "./RebirthPanel";
import SellShop from "./SellShop";

type ActivePanel = "fuse" | "credits" | "shop" | "rebirth" | "inventory" | null;

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_MOVE_SPEED = 6;
const CAM_DIST = 3.5; // distance behind player
const CAM_HEIGHT = 2.8; // height above player
const CAM_FOV = 75;

// ─── Earth Layer ─────────────────────────────────────────────────────────────
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

// ─── Dirt Particle ────────────────────────────────────────────────────────────
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

  useFrame((_s, delta) => {
    if (!mesh.current) return;
    lifetime.current += delta;
    velocity.current[1] -= delta * 0.3;
    mesh.current.position.x += velocity.current[0];
    mesh.current.position.y += velocity.current[1];
    mesh.current.position.z += velocity.current[2];
    mesh.current.rotation.x += delta * 3;
    mesh.current.rotation.z += delta * 2;
    if (lifetime.current > 1.2) onDone();
    mesh.current.scale.setScalar(Math.max(0, 1 - lifetime.current / 1.2));
  });

  const colors = useMemo(
    () => ["#5c3a1e", "#7a4a28", "#8b6340", "#4a2e14"],
    [],
  );
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <mesh ref={mesh} position={position} castShadow>
      <boxGeometry args={[0.06, 0.06, 0.06]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

// ─── Meteorite Glow ───────────────────────────────────────────────────────────
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

  useFrame((_s, delta) => {
    t.current += delta;
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.5;
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.scale.setScalar(0.9 + Math.sin(t.current * 2) * 0.1);
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

// ─── Dig Crater ───────────────────────────────────────────────────────────────
function DigCrater({ active }: { active: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_s, delta) => {
    if (!active || !mesh.current) return;
    t.current += delta;
    mesh.current.scale.setScalar(Math.max(0, 1 - t.current * 1.5));
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

// ─── Player Character (Third Person) ─────────────────────────────────────────
function PlayerCharacter({
  playerRef,
  isMoving,
  isDigging,
}: {
  playerRef: React.RefObject<THREE.Group | null>;
  isMoving: boolean;
  isDigging: boolean;
}) {
  const walkT = useRef(0);
  const digT = useRef(0);

  // Limb refs
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const pickaxeRef = useRef<THREE.Group>(null);

  useFrame((_s, delta) => {
    if (isMoving) {
      walkT.current += delta * 8;
    }

    const walkSwing = isMoving ? Math.sin(walkT.current) * 0.6 : 0;
    const walkTarget = isMoving ? walkSwing : 0;

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x +=
        (walkTarget - leftLegRef.current.rotation.x) * 0.25;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x +=
        (-walkTarget - rightLegRef.current.rotation.x) * 0.25;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x +=
        (-walkTarget * 0.7 - leftArmRef.current.rotation.x) * 0.25;
    }
    if (rightArmRef.current) {
      const digSwing = isDigging ? -Math.PI * 0.75 : walkTarget * 0.7;
      rightArmRef.current.rotation.x +=
        (digSwing - rightArmRef.current.rotation.x) * 0.25;
    }

    // Torso tilt when digging
    if (torsoRef.current) {
      const tiltTarget = isDigging ? 0.5 : 0;
      torsoRef.current.rotation.x +=
        (tiltTarget - torsoRef.current.rotation.x) * 0.2;
    }

    // Pickaxe bob
    if (pickaxeRef.current) {
      if (isDigging) {
        digT.current = Math.min(digT.current + delta * 6, Math.PI);
      } else {
        digT.current = Math.max(digT.current - delta * 4, 0);
      }
    }
  });

  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      {/* Shadow */}
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial
          color="#000"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#e8b88a" roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.1, 2.35, 0.23]}>
        <boxGeometry args={[0.08, 0.07, 0.02]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[-0.1, 2.35, 0.23]}>
        <boxGeometry args={[0.08, 0.07, 0.02]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.28]} />
        <meshStandardMaterial color="#2563eb" roughness={0.7} />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.35, 1.88, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm + Pickaxe */}
      <group position={[0.35, 1.88, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
        </mesh>
        {/* Pickaxe on right arm */}
        <group
          ref={pickaxeRef}
          position={[0.05, -0.45, 0.12]}
          rotation={[0.3, 0, -0.2]}
        >
          {/* Handle */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.022, 0.4, 6]} />
            <meshStandardMaterial color="#6b3d1e" roughness={0.9} />
          </mesh>
          {/* Pick head */}
          <mesh position={[0, 0, -0.2]}>
            <boxGeometry args={[0.28, 0.06, 0.06]} />
            <meshStandardMaterial
              color="#94a3b8"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          {/* Pick point */}
          <mesh position={[0.18, 0, -0.23]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.03, 0.1, 5]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group position={[-0.14, 1.32, 0]}>
        <mesh ref={leftLegRef} position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.2, 0.54, 0.2]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.14, 1.32, 0]}>
        <mesh ref={rightLegRef} position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.2, 0.54, 0.2]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
        </mesh>
      </group>

      {/* Boots */}
      <mesh position={[-0.14, 0.82, 0.04]} castShadow>
        <boxGeometry args={[0.22, 0.14, 0.26]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>
      <mesh position={[0.14, 0.82, 0.04]} castShadow>
        <boxGeometry args={[0.22, 0.14, 0.26]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Buildings ───────────────────────────────────────────────────────────────
const BUILDINGS = [
  {
    id: "fuse" as const,
    pos: [-25, 0, -15] as [number, number, number],
    color: "#7c3aed",
    label: "Fuse Machine",
    emoji: "⚗️",
  },
  {
    id: "inventory" as const,
    pos: [25, 0, -15] as [number, number, number],
    color: "#eab308",
    label: "Museum",
    emoji: "🏛️",
  },
  {
    id: "shop" as const,
    pos: [-25, 0, 15] as [number, number, number],
    color: "#22c55e",
    label: "Sell Shop",
    emoji: "🛒",
  },
  {
    id: "rebirth" as const,
    pos: [25, 0, 15] as [number, number, number],
    color: "#f97316",
    label: "Rebirth Altar",
    emoji: "🔄",
  },
  {
    id: "credits" as const,
    pos: [0, 0, -30] as [number, number, number],
    color: "#eab308",
    label: "Credits Machine",
    emoji: "💰",
  },
];

function Building({
  id,
  position,
  color,
  label,
  emoji,
  isNear,
}: {
  id: string;
  position: [number, number, number];
  color: string;
  label: string;
  emoji: string;
  isNear: boolean;
}) {
  const glowRef = useRef<THREE.PointLight>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_s, delta) => {
    t.current += delta;
    if (glowRef.current) {
      glowRef.current.intensity = 1.8 + Math.sin(t.current * 2.5) * 0.7;
    }
    if (orbRef.current) {
      orbRef.current.position.y = 5.5 + Math.sin(t.current * 2) * 0.25;
      orbRef.current.rotation.y += delta * 1.2;
    }
  });

  const [bx, , bz] = position;

  // Different building shapes per type
  const renderStructure = () => {
    switch (id) {
      case "fuse":
        // Tall cylindrical tower — purple/violet
        return (
          <>
            {/* Tower base */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <cylinderGeometry args={[1.2, 1.6, 3, 8]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.6}
                emissive={color}
                emissiveIntensity={0.12}
              />
            </mesh>
            {/* Tower mid-ring */}
            <mesh position={[0, 3.1, 0]} castShadow>
              <cylinderGeometry args={[0.9, 1.2, 0.5, 8]} />
              <meshStandardMaterial
                color="#9f5fff"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            {/* Tower top */}
            <mesh position={[0, 3.8, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.9, 1.2, 8]} />
              <meshStandardMaterial
                color="#c084fc"
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            {/* Glowing orb on top */}
            <mesh ref={orbRef} position={[0, 5.5, 0]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial
                color="#e9d5ff"
                emissive={color}
                emissiveIntensity={2}
                roughness={0.1}
                metalness={0.3}
              />
            </mesh>
            {/* Windows */}
            {[-1, 0, 1].map((i) => (
              <mesh key={i} position={[0, 1.5 + i * 0.9, 1.21]} castShadow>
                <boxGeometry args={[0.3, 0.25, 0.05]} />
                <meshStandardMaterial
                  color="#e9d5ff"
                  emissive="#9f5fff"
                  emissiveIntensity={1.5}
                />
              </mesh>
            ))}
          </>
        );

      case "inventory":
        // Museum — gold/amber, wide with columns
        return (
          <>
            {/* Main hall */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[6, 3, 4]} />
              <meshStandardMaterial
                color="#92400e"
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>
            {/* Roof pediment */}
            <mesh position={[0, 3.3, 0]} castShadow>
              <boxGeometry args={[6.4, 0.5, 4.4]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.5}
                emissive={color}
                emissiveIntensity={0.1}
              />
            </mesh>
            {/* Triangle roof */}
            <mesh position={[0, 4.0, 0]} castShadow rotation={[0, 0, 0]}>
              <coneGeometry args={[3.5, 1.4, 4]} />
              <meshStandardMaterial
                color="#b45309"
                roughness={0.5}
                metalness={0.4}
              />
            </mesh>
            {/* Columns */}
            {[-2, -0.7, 0.7, 2].map((cx) => (
              <mesh key={cx} position={[cx, 1.5, 2.1]} castShadow>
                <cylinderGeometry args={[0.2, 0.22, 3, 8]} />
                <meshStandardMaterial
                  color={color}
                  roughness={0.3}
                  metalness={0.5}
                />
              </mesh>
            ))}
            {/* Door */}
            <mesh position={[0, 0.9, 2.05]}>
              <boxGeometry args={[0.9, 1.8, 0.05]} />
              <meshStandardMaterial
                color="#78350f"
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>
            {/* Glowing orb */}
            <mesh ref={orbRef} position={[0, 5.5, 0]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial
                color="#fef3c7"
                emissive={color}
                emissiveIntensity={2}
                roughness={0.1}
              />
            </mesh>
          </>
        );

      case "shop":
        // Shop — green, box with awning
        return (
          <>
            {/* Main building */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[5, 3, 3.5]} />
              <meshStandardMaterial
                color="#166534"
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 3.2, 0]} castShadow>
              <boxGeometry args={[5.4, 0.4, 3.9]} />
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                metalness={0.3}
                emissive={color}
                emissiveIntensity={0.1}
              />
            </mesh>
            {/* Awning */}
            <mesh position={[0, 2.0, 1.95]} rotation={[-0.35, 0, 0]} castShadow>
              <boxGeometry args={[4.8, 0.12, 1.6]} />
              <meshStandardMaterial
                color="#4ade80"
                roughness={0.7}
                metalness={0.05}
              />
            </mesh>
            {/* Sign */}
            <mesh position={[0, 3.55, 1.85]} castShadow>
              <boxGeometry args={[3, 0.6, 0.15]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.3}
              />
            </mesh>
            {/* Windows */}
            {[-1.2, 1.2].map((wx) => (
              <mesh key={wx} position={[wx, 1.7, 1.77]}>
                <boxGeometry args={[1.0, 0.9, 0.05]} />
                <meshStandardMaterial
                  color="#bbf7d0"
                  emissive="#86efac"
                  emissiveIntensity={0.8}
                />
              </mesh>
            ))}
            {/* Glowing orb */}
            <mesh ref={orbRef} position={[0, 4.8, 0]}>
              <sphereGeometry args={[0.32, 16, 16]} />
              <meshStandardMaterial
                color="#d1fae5"
                emissive={color}
                emissiveIntensity={2}
                roughness={0.1}
              />
            </mesh>
          </>
        );

      case "credits":
        // Credits Machine — gold ATM/coin machine
        return (
          <>
            {/* Main body */}
            <mesh position={[0, 2.0, 0]} castShadow>
              <boxGeometry args={[2.8, 4, 1.6]} />
              <meshStandardMaterial
                color="#92400e"
                roughness={0.5}
                metalness={0.4}
              />
            </mesh>
            {/* Front panel */}
            <mesh position={[0, 2.0, 0.82]} castShadow>
              <boxGeometry args={[2.4, 3.6, 0.12]} />
              <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.7}
                emissive={color}
                emissiveIntensity={0.15}
              />
            </mesh>
            {/* Coin slot */}
            <mesh position={[0, 3.2, 0.94]}>
              <boxGeometry args={[0.8, 0.1, 0.08]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Screen */}
            <mesh position={[0, 2.6, 0.94]}>
              <boxGeometry args={[1.6, 0.9, 0.06]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#eab308"
                emissiveIntensity={1.2}
                roughness={0.1}
              />
            </mesh>
            {/* Coin symbols on front */}
            {[-0.5, 0.5].map((cx) => (
              <mesh key={cx} position={[cx, 1.6, 0.94]}>
                <cylinderGeometry args={[0.22, 0.22, 0.06, 12]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#f59e0b"
                  emissiveIntensity={0.8}
                  roughness={0.2}
                  metalness={0.9}
                />
              </mesh>
            ))}
            {/* Dispenser tray */}
            <mesh position={[0, 0.55, 0.9]} castShadow>
              <boxGeometry args={[1.4, 0.22, 0.5]} />
              <meshStandardMaterial
                color="#78350f"
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>
            {/* Glowing gold orb on top */}
            <mesh ref={orbRef} position={[0, 4.8, 0]}>
              <sphereGeometry args={[0.38, 16, 16]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive={color}
                emissiveIntensity={2.5}
                roughness={0.1}
                metalness={0.5}
              />
            </mesh>
          </>
        );

      default:
        // Rebirth Altar — orange/fire, shrine shape
        return (
          <>
            {/* Altar base platform */}
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[5, 0.7, 5]} />
              <meshStandardMaterial
                color="#7c2d12"
                roughness={0.7}
                metalness={0.3}
              />
            </mesh>
            {/* Center pillar */}
            <mesh position={[0, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.6, 0.8, 3.5, 8]} />
              <meshStandardMaterial
                color="#c2410c"
                roughness={0.5}
                metalness={0.4}
                emissive="#92400e"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Side torches */}
            {(
              [
                [-1.8, 0, -1.8],
                [1.8, 0, -1.8],
                [-1.8, 0, 1.8],
                [1.8, 0, 1.8],
              ] as [number, number, number][]
            ).map(([tx, , tz]) => (
              <group key={`torch-${tx}-${tz}`} position={[tx, 1.8, tz]}>
                <mesh>
                  <cylinderGeometry args={[0.1, 0.12, 1.4, 6]} />
                  <meshStandardMaterial color="#6b3d1e" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.85, 0]}>
                  <sphereGeometry args={[0.18, 8, 8]} />
                  <meshStandardMaterial
                    color="#fed7aa"
                    emissive={color}
                    emissiveIntensity={3}
                  />
                </mesh>
                <pointLight
                  position={[0, 1.0, 0]}
                  color={color}
                  intensity={1.2}
                  distance={4}
                />
              </group>
            ))}
            {/* Glowing fire orb on top */}
            <mesh ref={orbRef} position={[0, 4.4, 0]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial
                color="#fed7aa"
                emissive={color}
                emissiveIntensity={3}
                roughness={0.1}
              />
            </mesh>
          </>
        );
    }
  };

  return (
    <group position={[bx, 0.2, bz]}>
      {renderStructure()}
      {/* Point light above building */}
      <pointLight
        ref={glowRef}
        position={[0, 6.5, 0]}
        color={color}
        intensity={2.5}
        distance={14}
      />
      {/* Floating HTML label */}
      <Html
        position={[0, 7.2, 0]}
        center
        distanceFactor={28}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.78)",
            color,
            border: `1.5px solid ${color}`,
            borderRadius: "8px",
            padding: "4px 10px",
            fontFamily: "monospace",
            fontSize: "13px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 0 12px 3px ${color}55`,
            letterSpacing: "0.06em",
            backdropFilter: "blur(6px)",
          }}
        >
          {emoji} {label}
        </div>
      </Html>
      {/* Near prompt */}
      {isNear && (
        <Html
          position={[0, 5.8, 0]}
          center
          distanceFactor={28}
          occlude={false}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#111",
              borderRadius: "6px",
              padding: "3px 10px",
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              animation: "pulse 1s infinite",
              letterSpacing: "0.04em",
            }}
          >
            Press E to open
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Tree Decoration ─────────────────────────────────────────────────────────
function Tree({
  position,
  height,
  spread,
}: {
  position: [number, number, number];
  height: number;
  spread: number;
}) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, height * 0.6, 6]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
      </mesh>
      {/* Foliage - bottom */}
      <mesh position={[0, height * 0.7, 0]} castShadow>
        <coneGeometry args={[spread, height * 0.6, 7]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      {/* Foliage - top */}
      <mesh position={[0, height * 0.95, 0]} castShadow>
        <coneGeometry args={[spread * 0.7, height * 0.45, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
    </group>
  );
}

function MapEdgeTrees() {
  const trees = useMemo(() => {
    const result: {
      key: string;
      pos: [number, number, number];
      height: number;
      spread: number;
    }[] = [];
    // Seeded pseudo-random for stable values
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    const spacing = 5;
    const edgeMin = -48;
    const edgeMax = 48;

    for (let x = edgeMin; x <= edgeMax; x += spacing) {
      // North edge (z = -48)
      result.push({
        key: `n-${x}`,
        pos: [x, 0.2, -48 - rand() * 2],
        height: 3 + rand() * 2,
        spread: 1.2 + rand() * 0.6,
      });
      // South edge (z = 48)
      result.push({
        key: `s-${x}`,
        pos: [x, 0.2, 48 + rand() * 2],
        height: 3 + rand() * 2,
        spread: 1.2 + rand() * 0.6,
      });
    }
    for (let z = edgeMin; z <= edgeMax; z += spacing) {
      // West edge (x = -48)
      result.push({
        key: `w-${z}`,
        pos: [-48 - rand() * 2, 0.2, z],
        height: 3 + rand() * 2,
        spread: 1.2 + rand() * 0.6,
      });
      // East edge (x = 48)
      result.push({
        key: `e-${z}`,
        pos: [48 + rand() * 2, 0.2, z],
        height: 3 + rand() * 2,
        spread: 1.2 + rand() * 0.6,
      });
    }

    return result;
  }, []);

  return (
    <>
      {trees.map((t) => (
        <Tree
          key={t.key}
          position={t.pos}
          height={t.height}
          spread={t.spread}
        />
      ))}
    </>
  );
}

// ─── Third-Person Scene ───────────────────────────────────────────────────────
function ThirdPersonScene({
  baseSize,
  onDig,
  keysHeld,
  yawRef,
  pitchRef,
  isDigging,
  onFall,
  onOpenPanel,
  moveSpeedMultiplier,
  teleportTarget,
  onTeleportDone,
  flyMode,
  playerFrozen,
}: {
  baseSize: number;
  onDig: () => void;
  keysHeld: React.RefObject<Set<string>>;
  yawRef: React.RefObject<number>;
  pitchRef: React.RefObject<number>;
  isDigging: boolean;
  onFall?: () => void;
  onOpenPanel?: (panel: Exclude<ActivePanel, null>) => void;
  moveSpeedMultiplier?: number;
  teleportTarget?: string | null;
  onTeleportDone?: () => void;
  flyMode?: boolean;
  playerFrozen?: boolean;
}) {
  const [particles, setParticles] = useState<
    { id: number; pos: [number, number, number] }[]
  >([]);
  const [showCrater, setShowCrater] = useState(false);
  const particleId = useRef(0);
  const [isMoving, setIsMoving] = useState(false);
  const [nearBuilding, setNearBuilding] = useState<string | null>(null);
  const openedBuildingRef = useRef<string | null>(null); // debounce: track which was last opened

  const playerRef = useRef<THREE.Group | null>(null);
  const playerPos = useRef({ x: 0, z: 5 });
  const playerY = useRef(0); // vertical position, 0 = ground
  const playerVelY = useRef(0); // vertical velocity
  const playerFacing = useRef(0); // yaw of player body
  const isFalling = useRef(false);

  const { camera } = useThree();

  // E key: open the nearby building's panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && nearBuilding) {
        const building = BUILDINGS.find((b) => b.id === nearBuilding);
        if (building) {
          onOpenPanel?.(building.id);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearBuilding, onOpenPanel]);

  useFrame((_s, delta) => {
    const keys = keysHeld.current;
    let dx = 0;
    let dz = 0;

    if (!keys) return;

    // Freeze movement input while falling off the map or when admin-frozen
    if (!isFalling.current && !playerFrozen) {
      // W = forward (away from camera), S = backward, A = left, D = right
      if (keys.has("KeyW") || keys.has("ArrowUp")) dz += 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) dz -= 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
    }

    const moving = dx !== 0 || dz !== 0;
    setIsMoving(moving);

    const currentYaw = yawRef.current ?? 0;
    const currentPitch = pitchRef.current ?? 0;
    const speed = BASE_MOVE_SPEED * (moveSpeedMultiplier ?? 1);

    // Handle teleport command
    if (teleportTarget) {
      const building = BUILDINGS.find((b) => b.id === teleportTarget);
      if (building) {
        const [bx, , bz] = building.pos;
        playerPos.current.x = bx;
        playerPos.current.z = bz + 8; // slightly in front of building
        playerY.current = 0;
        playerVelY.current = 0;
        isFalling.current = false;
      }
      onTeleportDone?.();
    }

    if (moving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = dx / len;
      const nz = dz / len;
      const sinY = Math.sin(currentYaw);
      const cosY = Math.cos(currentYaw);
      // Forward direction is opposite of camera-behind-player offset
      // Camera is at player + (sinY * CAM_DIST, cosY * CAM_DIST)
      // So forward = (-sinY, -cosY), right = (cosY, -sinY)
      const worldDx = (-sinY * nz + cosY * nx) * speed * delta;
      const worldDz = (-cosY * nz - sinY * nx) * speed * delta;

      const newX = playerPos.current.x + worldDx;
      const newZ = playerPos.current.z + worldDz;

      playerPos.current.x = newX;
      playerPos.current.z = newZ;

      // Trigger fall when player walks off the map edge (ground ends at ~50 units)
      // Skip fall detection when fly mode is active
      if (
        (Math.abs(newX) > 50 || Math.abs(newZ) > 50) &&
        !isFalling.current &&
        !flyMode
      ) {
        isFalling.current = true;
        playerVelY.current = 0; // drop immediately, no upward hop
        onFall?.();
        setTimeout(() => {
          playerPos.current.x = 0;
          playerPos.current.z = 0;
          playerY.current = 0;
          playerVelY.current = 0;
          isFalling.current = false;
        }, 3400);
      }

      // Rotate player body toward movement direction
      const moveAngle = Math.atan2(worldDx, worldDz) + Math.PI;
      playerFacing.current = moveAngle;
    }

    // Fly mode: allow vertical movement with Space (up) and ShiftLeft/KeyC (down)
    if (flyMode) {
      // Snap to ground when fly mode is first disabled
      isFalling.current = false;
      playerVelY.current = 0;
      if (keys.has("Space")) {
        playerY.current += speed * delta * 0.8;
      } else if (keys.has("ShiftLeft") || keys.has("KeyC")) {
        playerY.current = Math.max(0, playerY.current - speed * delta * 0.8);
      }
    } else if (isFalling.current) {
      // Apply gravity when falling off the map
      playerVelY.current -= 18 * delta; // gravity acceleration
      playerY.current += playerVelY.current * delta;
    } else {
      // Snap back to ground when not falling
      if (playerY.current > 0) {
        playerY.current = 0;
      }
      playerVelY.current = 0;
    }

    // Update player mesh position & rotation
    if (playerRef.current) {
      playerRef.current.position.x = playerPos.current.x;
      playerRef.current.position.y = playerY.current;
      playerRef.current.position.z = playerPos.current.z;
      // Smoothly rotate player to face movement direction
      if (moving) {
        playerRef.current.rotation.y = currentYaw + Math.PI;
      }
    }

    // Third-person camera with pitch (up/down look)
    // Orbit around player at yaw + pitch
    const sinCam = Math.sin(currentYaw);
    const cosCam = Math.cos(currentYaw);
    const cosPitch = Math.cos(currentPitch);
    const sinPitch = Math.sin(currentPitch);
    const camDist = CAM_DIST;
    const camX = playerPos.current.x + sinCam * camDist * cosPitch;
    const camZ = playerPos.current.z + cosCam * camDist * cosPitch;
    const camY =
      playerY.current + 1.8 + CAM_HEIGHT * cosPitch + sinPitch * camDist;

    camera.position.set(camX, camY, camZ);
    // Look at player center, offset slightly up/down based on pitch
    camera.lookAt(
      playerPos.current.x,
      playerY.current + 1.8 - sinPitch * 2,
      playerPos.current.z,
    );

    // Building proximity check — update nearBuilding state
    let closestBuilding: string | null = null;
    let closestDist = 7; // proximity threshold
    for (const building of BUILDINGS) {
      const [bx, , bz] = building.pos;
      const dist = Math.sqrt(
        (playerPos.current.x - bx) ** 2 + (playerPos.current.z - bz) ** 2,
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestBuilding = building.id;
      }
    }
    setNearBuilding(closestBuilding);

    // Auto-open when walking into building (within 5 units), once per approach
    if (closestBuilding && closestDist < 5) {
      if (openedBuildingRef.current !== closestBuilding) {
        openedBuildingRef.current = closestBuilding;
        const building = BUILDINGS.find((b) => b.id === closestBuilding);
        if (building) onOpenPanel?.(building.id);
      }
    } else if (!closestBuilding) {
      // Reset when far from all buildings
      openedBuildingRef.current = null;
    }
  });

  const handleDig = useCallback(() => {
    onDig();
    const newParticles: { id: number; pos: [number, number, number] }[] = [];
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleId.current++,
        pos: [
          playerPos.current.x + (Math.random() - 0.5) * 0.4,
          0.1,
          playerPos.current.z - 1.5 + (Math.random() - 0.5) * 0.3,
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
      {/* Lighting */}
      <ambientLight intensity={2.5} color="#ffffff" />
      <directionalLight
        position={[10, 15, 5]}
        intensity={3}
        castShadow
        color="#fffde7"
      />
      <directionalLight
        position={[-8, 6, -4]}
        intensity={1.0}
        color="#cce8ff"
      />

      {/* Sky */}
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
      <EarthLayer y={-2.35} width={w * 0.84} color="#5c5c5c" height={0.3} />

      {/* Meteorite */}
      <MeteoriteGlow baseSize={baseSize} visible={true} />

      {/* Clickable dig surface */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleDig}
        onPointerOver={() => {
          document.body.style.cursor = "crosshair";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <planeGeometry args={[w, w * 0.7]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      <DigCrater active={showCrater} />

      {particles.map((p) => (
        <DirtParticle
          key={p.id}
          position={p.pos}
          onDone={() => removeParticle(p.id)}
        />
      ))}

      {/* Buildings on the map */}
      {BUILDINGS.map((b) => (
        <Building
          key={b.id}
          id={b.id}
          position={b.pos}
          color={b.color}
          label={b.label}
          emoji={b.emoji}
          isNear={nearBuilding === b.id}
        />
      ))}

      {/* Edge Trees */}
      <MapEdgeTrees />

      {/* Player Character */}
      <PlayerCharacter
        playerRef={playerRef}
        isMoving={isMoving}
        isDigging={isDigging}
      />
    </>
  );
}

// ─── Rarity tier helpers ──────────────────────────────────────────────────────
function getRarityTier(
  rarity: Rarity,
): "common" | "uncommon" | "rare" | "epic" | "legendary" {
  if (["googleplex", "crazy", "divine"].includes(rarity)) return "legendary";
  if (["celestial", "secret", "god"].includes(rarity)) return "epic";
  if (["mythic", "legendary"].includes(rarity)) return "rare";
  if (rarity === "epic") return "uncommon";
  return "common";
}

// ─── Rarity Reveal Overlay ────────────────────────────────────────────────────
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

        <span
          className="text-xs font-mono tracking-[0.3em] uppercase"
          style={{ color: `${color}cc`, zIndex: 2 }}
        >
          You Found A
        </span>

        <motion.span
          initial={{ letterSpacing: "0.05em" }}
          animate={{ letterSpacing: ["0.05em", "0.18em", "0.12em"] }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display font-black text-4xl md:text-5xl uppercase"
          style={{
            color,
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}88`,
            zIndex: 2,
          }}
        >
          {label}
        </motion.span>

        {tier !== "common" && (
          <span
            className="text-xs font-bold font-mono px-3 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              background: `${color}22`,
              color,
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

// ─── Quick Access Buttons ─────────────────────────────────────────────────────
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
    id: "credits",
    IconComponent: Coins,
    label: "Credits",
    color: "#eab308",
    ocid: "dig.credits_button",
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
    case "credits":
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
    case "credits":
      return "💳 Caffeine Credits";
    case "shop":
      return "🛒 Sell Shop";
    case "rebirth":
      return "🔄 Rebirth";
    case "inventory":
      return "🎒 Collection";
  }
}

// ─── Fall Sound ───────────────────────────────────────────────────────────────
function playFallSound() {
  try {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.65, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);

    // Main oscillator — "aaaaahhhhh" falling tone
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.setValueAtTime(350, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 2.4);

    // Second oscillator — add vibrato / wobble
    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(385, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(78, ctx.currentTime + 2.4);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);

    // Voice-like bandpass filter — shapes the "fhhhaaaa"
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 2.4);
    filter.Q.value = 4;

    // Noise layer — the "fhhh" fricative texture at the start
    const bufferSize = Math.ceil(ctx.sampleRate * 2.8);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1800;

    // Wire it all up
    osc.connect(filter);
    filter.connect(gainNode);

    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.8);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 2.8);
    noiseSource.start(ctx.currentTime);
    noiseSource.stop(ctx.currentTime + 2.8);

    // Close the context after playback finishes
    setTimeout(() => ctx.close(), 3200);
  } catch {
    // AudioContext not available — silently ignore
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiggingScene() {
  const {
    credits,
    totalFound,
    baseSize,
    multiplier,
    digMeteor,
    moveSpeed,
    flyMode,
    playerFrozen,
    meteorShowerActive,
    teleportTarget,
    adminTeleportTo,
  } = useGameStore();
  const [currentReveal, setCurrentReveal] = useState<{
    rarity: Rarity;
    id: number;
  } | null>(null);
  const [isDigging, setIsDigging] = useState(false);
  const [shakeContainer, setShakeContainer] = useState(false);
  const [fallEffect, setFallEffect] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [musicOn, setMusicOn] = useState(false);
  const musicCtxRef = useRef<AudioContext | null>(null);
  const popupId = useRef(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const panelButtonsRef = useRef<HTMLDivElement>(null);
  const fallCooldown = useRef(false);

  // Shared refs for third-person controls
  const keysHeld = useRef<Set<string>>(new Set<string>());
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>(0); // vertical look angle

  // Mouse drag state (fallback for browsers without pointer lock)
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Auto-focus canvas on mount so WASD works immediately
  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.tabIndex = 0;
      canvasContainerRef.current.focus();
    }
  }, []);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      if (musicCtxRef.current) {
        musicCtxRef.current.close();
        musicCtxRef.current = null;
      }
    };
  }, []);

  // Release pointer lock whenever a panel is opened so UI is fully interactive
  useEffect(() => {
    if (activePanel !== null) {
      document.exitPointerLock();
    }
  }, [activePanel]);

  // Pointer Lock: click canvas to lock mouse, Escape to unlock
  useEffect(() => {
    const onPointerLockChange = () => {
      setIsPointerLocked(
        document.pointerLockElement === canvasContainerRef.current,
      );
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvasContainerRef.current) {
        yawRef.current -= e.movementX * 0.003;
        // Vertical look: clamp pitch between -60° and +60°
        pitchRef.current = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, pitchRef.current - e.movementY * 0.003),
        );
      }
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // WASD keyboard input — prevent arrow/space scroll, keep keys in set
  useEffect(() => {
    const MOVEMENT_KEYS = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space",
      "ShiftLeft",
    ]);
    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.current.add(e.code);
      if (MOVEMENT_KEYS.has(e.code)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    // Clear keys when window loses focus so no stuck movement
    const onBlur = () => keysHeld.current.clear();
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // If the click originated inside the panel buttons, don't lock pointer
    if (panelButtonsRef.current?.contains(e.target as Node)) return;
    const el = e.currentTarget as HTMLElement;
    el.focus();
    // Request pointer lock so mouse freely rotates camera
    if (!document.pointerLockElement) {
      el.requestPointerLock();
    }
    // Fallback drag tracking
    isDragging.current = true;
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Only use drag fallback when pointer is NOT locked
    if (document.pointerLockElement) return;
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouseX.current;
    const dy = e.clientY - lastMouseY.current;
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
    yawRef.current -= dx * 0.003;
    pitchRef.current = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, pitchRef.current - dy * 0.003),
    );
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleDig = useCallback(() => {
    if (isDigging) return;
    setIsDigging(true);
    setShakeContainer(true);
    const rarity = digMeteor();
    const id = popupId.current++;
    setCurrentReveal({ rarity, id });
    setTimeout(() => setIsDigging(false), 350);
    setTimeout(() => setShakeContainer(false), 400);
  }, [isDigging, digMeteor]);

  const handleFall = useCallback(() => {
    if (fallCooldown.current) return;
    fallCooldown.current = true;
    playFallSound();
    setFallEffect(true);
    setTimeout(() => {
      setFallEffect(false);
      fallCooldown.current = false;
    }, 3500);
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicOn) {
      // Turn off — close AudioContext
      if (musicCtxRef.current) {
        musicCtxRef.current.close();
        musicCtxRef.current = null;
      }
      setMusicOn(false);
    } else {
      // Turn on — create epic/adventure loop with Web Audio API
      try {
        const ctx = new AudioContext();
        musicCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Drone pad — low sawtooth with heavy lowpass
        const droneOsc = ctx.createOscillator();
        droneOsc.type = "sawtooth";
        droneOsc.frequency.value = 110;
        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = "lowpass";
        droneFilter.frequency.value = 400;
        droneFilter.Q.value = 2;
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.35;
        droneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(masterGain);
        droneOsc.start();

        // Melody — simple repeating epic pattern
        const melodyNotes = [
          220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63,
        ];
        const noteDuration = 0.5;
        let time = ctx.currentTime;

        const scheduleMelody = () => {
          for (let cycle = 0; cycle < 8; cycle++) {
            for (let i = 0; i < melodyNotes.length; i++) {
              const osc = ctx.createOscillator();
              osc.type = "triangle";
              osc.frequency.value = melodyNotes[i];
              const noteGain = ctx.createGain();
              noteGain.gain.setValueAtTime(0, time);
              noteGain.gain.linearRampToValueAtTime(
                0.55,
                time + noteDuration * 0.1,
              );
              noteGain.gain.setValueAtTime(0.5, time + noteDuration * 0.8);
              noteGain.gain.linearRampToValueAtTime(0, time + noteDuration);
              osc.connect(noteGain);
              noteGain.connect(masterGain);
              osc.start(time);
              osc.stop(time + noteDuration);
              time += noteDuration;
            }
          }
        };

        scheduleMelody();

        // Harmony pad — fifth above drone
        const harmOsc = ctx.createOscillator();
        harmOsc.type = "sine";
        harmOsc.frequency.value = 165; // A2 fifth
        const harmGain = ctx.createGain();
        harmGain.gain.value = 0.15;
        harmOsc.connect(harmGain);
        harmGain.connect(masterGain);
        harmOsc.start();

        // Store droneOsc and harmOsc on ctx for cleanup via close()
      } catch {
        // AudioContext not available — silently ignore
      }
      setMusicOn(true);
    }
  }, [musicOn]);

  const togglePanel = useCallback((id: Exclude<ActivePanel, null>) => {
    document.exitPointerLock();
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  const formatCredits = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* HUD Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 pointer-events-none">
        <div className="flex gap-3">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              CREDITS
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
        <div className="flex gap-2 items-center">
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
          <button
            type="button"
            data-ocid="dig.music_toggle"
            onClick={toggleMusic}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 flex items-center gap-1.5 pointer-events-auto"
            title={musicOn ? "Turn music off" : "Turn music on"}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {musicOn ? (
              <Volume2 className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-mono text-muted-foreground">
              {musicOn ? "Music ON" : "Music"}
            </span>
          </button>
        </div>
      </div>

      {/* WASD / mouse hint */}
      <div className="absolute bottom-[5.5rem] left-3 z-10 pointer-events-none">
        <div
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            background: isPointerLocked
              ? "rgba(0,180,80,0.35)"
              : "rgba(0,0,0,0.45)",
            color: isPointerLocked
              ? "rgba(150,255,150,0.9)"
              : "rgba(255,255,255,0.5)",
            backdropFilter: "blur(4px)",
            letterSpacing: "0.08em",
            border: isPointerLocked
              ? "1px solid rgba(100,255,100,0.3)"
              : "none",
          }}
        >
          {isPointerLocked
            ? "🖱 Mouse to look · ESC to unlock"
            : "Click to look · WASD to move"}
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={canvasContainerRef}
        data-ocid="dig.canvas_target"
        className={`relative flex-1 outline-none ${shakeContainer ? "animate-dig-shake" : ""} ${fallEffect ? "fall-shake" : ""}`}
        style={{ minHeight: 0 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        {/* Red vignette flash + YOU FELL HAHAHAHA when falling off the map */}
        <AnimatePresence>
          {fallEffect && (
            <>
              <motion.div
                key="fall-flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3,
                  times: [0, 0.08, 0.6, 1],
                  ease: "easeInOut",
                }}
                className="pointer-events-none absolute inset-0"
                style={{
                  zIndex: 60,
                  background:
                    "radial-gradient(ellipse at center, transparent 30%, rgba(220, 38, 38, 0.7) 100%)",
                }}
              />
              <motion.div
                key="fall-text"
                initial={{ opacity: 0, scale: 0.4, y: 40 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1.2, 1.0, 1.0],
                  y: [40, -10, 0, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3,
                  times: [0, 0.15, 0.35, 1],
                  ease: "easeOut",
                }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 61 }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 900,
                    fontSize: "clamp(2rem, 6vw, 4rem)",
                    color: "#ff2222",
                    textShadow:
                      "0 0 30px #ff0000, 0 0 60px #ff000088, 2px 2px 0 #000, -2px -2px 0 #000",
                    letterSpacing: "0.06em",
                    userSelect: "none",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  YOU FELL HAHAHAHA
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Canvas
          shadows
          camera={{
            position: [0, CAM_HEIGHT + 0.75, 5 + CAM_DIST],
            fov: CAM_FOV,
          }}
          style={{ background: "#87CEEB" }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <ThirdPersonScene
              baseSize={baseSize}
              onDig={handleDig}
              keysHeld={keysHeld}
              yawRef={yawRef}
              pitchRef={pitchRef}
              isDigging={isDigging}
              onFall={handleFall}
              onOpenPanel={togglePanel}
              moveSpeedMultiplier={moveSpeed}
              teleportTarget={teleportTarget}
              onTeleportDone={() => adminTeleportTo(null)}
              flyMode={flyMode}
              playerFrozen={playerFrozen}
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

      {/* Meteorite Shower Overlay */}
      <AnimatePresence>
        {meteorShowerActive && (
          <motion.div
            key="meteor-shower"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
          >
            {/* Rain of meteorite emojis - static keys to avoid index key lint */}
            {[
              "m0",
              "m1",
              "m2",
              "m3",
              "m4",
              "m5",
              "m6",
              "m7",
              "m8",
              "m9",
              "m10",
              "m11",
              "m12",
              "m13",
              "m14",
              "m15",
              "m16",
              "m17",
              "m18",
              "m19",
              "m20",
              "m21",
              "m22",
              "m23",
              "m24",
              "m25",
              "m26",
              "m27",
              "m28",
              "m29",
            ].map((id, i) => (
              <motion.div
                key={id}
                initial={{ y: -80, opacity: 1 }}
                animate={{ y: "110vh", opacity: [1, 1, 0] }}
                transition={{
                  duration: 1.5 + (i % 5) * 0.4,
                  delay: (i % 10) * 0.3,
                  ease: "easeIn",
                }}
                className="absolute text-2xl"
                style={{ left: `${(i * 37 + 5) % 100}%` }}
              >
                ☄️
              </motion.div>
            ))}
            {/* Banner */}
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-mono font-black text-xl uppercase tracking-widest text-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(109,40,217,0.8) 100%)",
                border: "2px solid rgba(167,139,250,0.8)",
                color: "#e9d5ff",
                textShadow: "0 0 20px rgba(167,139,250,0.9)",
                boxShadow: "0 0 40px rgba(139,92,246,0.5)",
              }}
            >
              ☄️ METEORITE SHOWER! ☄️
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Freeze Player Indicator */}
      {playerFrozen && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-xl font-mono font-black text-sm uppercase tracking-widest z-30 pointer-events-none animate-pulse"
          style={{
            background: "rgba(147,197,253,0.25)",
            border: "2px solid rgba(147,197,253,0.6)",
            color: "#bfdbfe",
            textShadow: "0 0 12px rgba(147,197,253,0.8)",
          }}
        >
          ❄️ PLAYER FROZEN ❄️
        </div>
      )}

      {/* Quick-Access Panel Buttons — left side */}
      <div
        ref={panelButtonsRef}
        className="absolute left-3 bottom-20 z-20 flex flex-col gap-2 pointer-events-auto"
        onPointerDown={(e) => {
          // Prevent pointer lock from being requested when clicking panel buttons
          e.stopPropagation();
          // Release pointer lock so buttons are fully interactive
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
      >
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
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
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

      {/* Slide-Up Feature Panel */}
      <AnimatePresence>
        {activePanel && (
          <>
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
