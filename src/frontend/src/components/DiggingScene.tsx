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
const MOVE_SPEED = 6;
const CAM_DIST = 5.5; // distance behind player
const CAM_HEIGHT = 3.5; // height above player
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

// ─── Third-Person Scene ───────────────────────────────────────────────────────
function ThirdPersonScene({
  baseSize,
  onDig,
  keysHeld,
  yawRef,
  isDigging,
}: {
  baseSize: number;
  onDig: () => void;
  keysHeld: React.RefObject<Set<string>>;
  yawRef: React.RefObject<number>;
  isDigging: boolean;
}) {
  const [particles, setParticles] = useState<
    { id: number; pos: [number, number, number] }[]
  >([]);
  const [showCrater, setShowCrater] = useState(false);
  const particleId = useRef(0);
  const [isMoving, setIsMoving] = useState(false);

  const playerRef = useRef<THREE.Group | null>(null);
  const playerPos = useRef({ x: 0, z: 5 });
  const playerFacing = useRef(0); // yaw of player body

  const { camera } = useThree();

  useFrame((_s, delta) => {
    const keys = keysHeld.current;
    let dx = 0;
    let dz = 0;

    if (!keys) return;

    if (keys.has("KeyW") || keys.has("ArrowUp")) dz -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) dz += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;

    const moving = dx !== 0 || dz !== 0;
    setIsMoving(moving);

    const currentYaw = yawRef.current ?? 0;

    if (moving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = dx / len;
      const nz = dz / len;
      const sinY = Math.sin(currentYaw);
      const cosY = Math.cos(currentYaw);
      const worldDx = (cosY * nx - sinY * nz) * MOVE_SPEED * delta;
      const worldDz = (sinY * nx + cosY * nz) * MOVE_SPEED * delta;

      playerPos.current.x = Math.max(
        -45,
        Math.min(45, playerPos.current.x + worldDx),
      );
      playerPos.current.z = Math.max(
        -30,
        Math.min(30, playerPos.current.z + worldDz),
      );

      // Rotate player body toward movement direction
      const moveAngle = Math.atan2(worldDx, worldDz) + Math.PI;
      playerFacing.current = moveAngle;
    }

    // Update player mesh position & rotation
    if (playerRef.current) {
      playerRef.current.position.x = playerPos.current.x;
      playerRef.current.position.z = playerPos.current.z;
      // Smoothly rotate player to face movement direction
      if (moving) {
        playerRef.current.rotation.y = currentYaw + Math.PI;
      }
    }

    // Third-person camera: position behind and above player
    const sinCam = Math.sin(currentYaw);
    const cosCam = Math.cos(currentYaw);
    const camX = playerPos.current.x + sinCam * CAM_DIST;
    const camZ = playerPos.current.z + cosCam * CAM_DIST;
    const camY = 0.75 + CAM_HEIGHT; // player stands at y≈0, center at ~0.75

    camera.position.set(camX, camY, camZ);
    camera.lookAt(
      playerPos.current.x,
      1.5, // look at player chest height
      playerPos.current.z,
    );
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
  const popupId = useRef(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const panelButtonsRef = useRef<HTMLDivElement>(null);

  // Shared refs for third-person controls
  const keysHeld = useRef<Set<string>>(new Set<string>());
  const yawRef = useRef<number>(0);

  // Mouse drag state (fallback for browsers without pointer lock)
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Auto-focus canvas on mount so WASD works immediately
  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.tabIndex = 0;
      canvasContainerRef.current.focus();
    }
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
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Only use drag fallback when pointer is NOT locked
    if (document.pointerLockElement) return;
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouseX.current;
    lastMouseX.current = e.clientX;
    yawRef.current -= dx * 0.003;
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
        className={`flex-1 outline-none ${shakeContainer ? "animate-dig-shake" : ""}`}
        style={{ minHeight: 0 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
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
              isDigging={isDigging}
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
