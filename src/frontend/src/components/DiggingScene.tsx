import { OrbitControls, Sky } from "@react-three/drei";
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
import { Suspense, useCallback, useRef, useState } from "react";
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
}: {
  isDigging: boolean;
}) {
  const torsoRef = useRef<THREE.Mesh>(null);
  const rightArmGroupRef = useRef<THREE.Group>(null);
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
  });

  // Position the character near the dig zone
  const charX = 8;

  return (
    <group position={[charX, 0.65, 0.4]} rotation={[0, -0.4, 0]}>
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
      <mesh position={[-0.09, 0.0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.34, 0.14]} />
        <meshStandardMaterial color="#7c4a14" roughness={0.9} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.09, 0.0, 0]} castShadow>
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

// ─── Scene Content ────────────────────────────────────────────────────────────
function SceneContent({
  baseSize,
  onDig,
  isDigging,
}: {
  baseSize: number;
  onDig: () => void;
  isDigging: boolean;
}) {
  const [particles, setParticles] = useState<
    { id: number; pos: [number, number, number] }[]
  >([]);
  const [showCrater, setShowCrater] = useState(false);
  const particleId = useRef(0);

  const { camera } = useThree();

  // Set camera position for wide 100x100 map
  useFrame(() => {
    const targetZ = 80;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
  });

  const handleDig = useCallback(() => {
    onDig();

    // Spawn dirt particles
    const newParticles: { id: number; pos: [number, number, number] }[] = [];
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleId.current++,
        pos: [(Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.3],
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

      {/* Meteorite glow effect */}
      <MeteoriteGlow baseSize={baseSize} visible={true} />

      {/* Player Character */}
      <PlayerCharacter isDigging={isDigging} />

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

      <OrbitControls
        enablePan={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={200}
        target={[0, -0.5, 0]}
      />
    </>
  );
}

// ─── HUD Overlay ──────────────────────────────────────────────────────────────
function RarityPopup({ rarity, key: _k }: { rarity: Rarity; key: number }) {
  const color = RARITY_COLORS[rarity];
  const label = RARITY_LABELS[rarity];

  const isSpecial = ["divine", "crazy", "googleplex"].includes(rarity);
  const isRare = ["god", "secret", "celestial"].includes(rarity);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.8 }}
      animate={{ y: -60, opacity: [0, 1, 1, 0], scale: [0.8, 1.2, 1.1, 0.9] }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 z-20"
    >
      <div
        className="px-4 py-2 rounded-full font-display font-bold text-sm md:text-base whitespace-nowrap"
        style={{
          color: color,
          border: `2px solid ${color}`,
          backgroundColor: `${color}22`,
          boxShadow: `0 0 ${isSpecial ? 30 : isRare ? 16 : 8}px ${isSpecial ? 10 : isRare ? 5 : 3}px ${color}`,
          textShadow: `0 0 10px ${color}`,
        }}
      >
        {isSpecial ? "✨ " : isRare ? "⭐ " : ""}
        {label.toUpperCase()} FOUND!
        {isSpecial ? " ✨" : ""}
      </div>
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
  const [recentFinds, setRecentFinds] = useState<
    { rarity: Rarity; id: number }[]
  >([]);
  const [isDigging, setIsDigging] = useState(false);
  const [shakeContainer, setShakeContainer] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const popupId = useRef(0);

  const handleDig = useCallback(() => {
    if (isDigging) return;
    setIsDigging(true);
    setShakeContainer(true);

    const rarity = digMeteor();

    const id = popupId.current++;
    setRecentFinds((prev) => [...prev.slice(-4), { rarity, id }]);

    setTimeout(() => setIsDigging(false), 300);
    setTimeout(() => setShakeContainer(false), 400);
    setTimeout(() => {
      setRecentFinds((prev) => prev.filter((f) => f.id !== id));
    }, 2000);
  }, [isDigging, digMeteor]);

  const togglePanel = useCallback((id: Exclude<ActivePanel, null>) => {
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

      {/* 3D Canvas */}
      <div
        className={`flex-1 ${shakeContainer ? "animate-dig-shake" : ""}`}
        style={{ minHeight: 0 }}
      >
        <Canvas
          shadows
          camera={{ position: [0, 20, 80], fov: 60 }}
          style={{ background: "#87CEEB" }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SceneContent
              baseSize={baseSize}
              onDig={handleDig}
              isDigging={isDigging}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Rarity Popups */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {recentFinds.map((find) => (
            <RarityPopup key={find.id} rarity={find.rarity} />
          ))}
        </AnimatePresence>
      </div>

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
