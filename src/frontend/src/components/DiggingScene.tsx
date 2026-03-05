import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useRef, useState } from "react";
import type * as THREE from "three";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";

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

// ─── Scene Content ────────────────────────────────────────────────────────────
function SceneContent({
  baseSize,
  onDig,
}: {
  baseSize: number;
  onDig: () => void;
}) {
  const [particles, setParticles] = useState<
    { id: number; pos: [number, number, number] }[]
  >([]);
  const [showCrater, setShowCrater] = useState(false);
  const particleId = useRef(0);

  const { camera } = useThree();

  // Set camera position based on baseSize
  useFrame(() => {
    const targetZ = 4 + baseSize * 0.5;
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

  const w = 2 + baseSize * 0.8;

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
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={2}
        maxDistance={8 + baseSize}
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiggingScene() {
  const { credits, totalFound, baseSize, multiplier, digMeteor } =
    useGameStore();
  const [recentFinds, setRecentFinds] = useState<
    { rarity: Rarity; id: number }[]
  >([]);
  const [isDigging, setIsDigging] = useState(false);
  const [shakeContainer, setShakeContainer] = useState(false);
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

  const formatCredits = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="relative w-full h-full flex flex-col">
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
          camera={{ position: [0, 2, 5], fov: 60 }}
          style={{ background: "#87CEEB" }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SceneContent baseSize={baseSize} onDig={handleDig} />
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
    </div>
  );
}
