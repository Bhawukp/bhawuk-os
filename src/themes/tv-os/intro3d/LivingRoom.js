"use client";

import { PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { play } from "@/features/sound/sound";

const TV_Y = 1.5;
const SCREEN = { w: 3.0, h: 1.69 };
const START = new THREE.Vector3(0.8, 1.7, 6.4);
const START_TARGET = new THREE.Vector3(0, 1.15, 0);
// Close enough that the 16:9 screen overfills any desktop viewport at fov 40.
const END = new THREE.Vector3(0, TV_Y, 2.15);
const END_TARGET = new THREE.Vector3(0, TV_Y, 0);
const FLY_DELAY = 0.5;
const FLY_DURATION = 1.7;

const ease = (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Paints a miniature of the real home screen, so the fly-in lands on what the DOM shows next. */
function useScreenTexture() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 576;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
    g.fillStyle = "#07060b";
    g.fillRect(0, 0, c.width, c.height);
    const glow = g.createRadialGradient(820, -40, 10, 820, -40, 620);
    glow.addColorStop(0, "rgba(139,92,246,0.75)");
    glow.addColorStop(1, "rgba(139,92,246,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, c.width, c.height);

    g.fillStyle = "#c4b5fd";
    g.font = "600 13px system-ui, sans-serif";
    g.fillText("BHAWUK ORIGINAL · NOW STREAMING", 56, 120);
    g.fillStyle = "#ffffff";
    g.font = "800 64px system-ui, sans-serif";
    g.fillText("Bhawuk Pahuja", 52, 186);
    g.font = "600 22px system-ui, sans-serif";
    g.fillText("Frontend & Player Engineer — Smart TV & Streaming", 56, 226);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(56, 256, 150, 40, 10);
    g.fill();

    const colors = ["#8b5cf6", "#b91c1c", "#334155", "#0d9488", "#312e81", "#7c2d12"];
    colors.forEach((color, i) => {
      g.fillStyle = color;
      g.beginPath();
      g.roundRect(56 + i * 128, 340, 112, 168, 10);
      g.fill();
    });

    g.font = "900 220px system-ui, sans-serif";
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.fillText("BP", 700, 300);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** @param {{ powered: boolean, onArrive: () => void }} props */
function Television({ powered, onArrive }) {
  const texture = useScreenTexture();
  const screen = useRef(/** @type {THREE.Mesh | null} */ (null));
  const material = useRef(/** @type {THREE.MeshStandardMaterial | null} */ (null));
  const light = useRef(/** @type {THREE.PointLight | null} */ (null));
  const startedAt = useRef(-1);
  const arrived = useRef(false);
  const target = useMemo(() => START_TARGET.clone(), []);
  const idle = useMemo(() => new THREE.Vector3(), []);
  const from = useMemo(() => new THREE.Vector3(), []);
  const black = useMemo(() => new THREE.Color("#030304"), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);

  useFrame((state) => {
    const { camera, pointer, clock } = state;
    const mat = material.current;
    if (!mat || !screen.current) return;

    if (!powered) {
      // Idle parallax that follows the cursor.
      camera.position.lerp(idle.set(START.x + pointer.x * 0.35, START.y + pointer.y * 0.15, START.z), 0.05);
      camera.lookAt(target);
      return;
    }

    if (startedAt.current < 0) {
      startedAt.current = clock.elapsedTime;
      from.copy(camera.position);
      play("whoosh");
    }
    const t = clock.elapsedTime - startedAt.current;

    // CRT turn-on: a bright line that opens vertically.
    const on = Math.min(t / 0.45, 1);
    screen.current.scale.y = THREE.MathUtils.lerp(0.015, 1, ease(on));
    mat.color.copy(black).lerp(white, on);
    mat.emissiveIntensity = on < 1 ? 2.5 - on * 1.5 : 1;
    if (light.current) light.current.intensity = on * 14;

    const f = ease(THREE.MathUtils.clamp((t - FLY_DELAY) / FLY_DURATION, 0, 1));
    if (t > FLY_DELAY) {
      camera.position.lerpVectors(from, END, f);
      target.lerpVectors(START_TARGET, END_TARGET, f);
      camera.lookAt(target);
    }
    if (f >= 1 && !arrived.current) {
      arrived.current = true;
      onArrive();
    }
  });

  return (
    <group position={[0, TV_Y, 0]}>
      <mesh>
        <boxGeometry args={[SCREEN.w + 0.16, SCREEN.h + 0.16, 0.08]} />
        <meshStandardMaterial color="#0b0b0f" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh ref={screen} position={[0, 0, 0.042]} scale={[1, 1, 1]}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        <meshStandardMaterial
          ref={material}
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0}
          color="#030304"
          roughness={0.15}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.0, -SCREEN.h / 2 - 0.05, 0.045]}>
        <circleGeometry args={[0.012, 12]} />
        <meshBasicMaterial color={powered ? "#22c55e" : "#ef4444"} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 1.2]} color="#8b5cf6" intensity={0} distance={9} decay={2} />
    </group>
  );
}

/** @param {{ onClick: () => void, powered: boolean }} props */
function Remote({ onClick, powered }) {
  const [hover, setHover] = useState(false);
  const button = useRef(/** @type {THREE.MeshStandardMaterial | null} */ (null));

  useEffect(() => {
    document.body.style.cursor = hover && !powered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover, powered]);

  useFrame(({ clock }) => {
    if (button.current) button.current.emissiveIntensity = powered ? 0.3 : 1.2 + Math.sin(clock.elapsedTime * 4) * 0.8;
  });

  return (
    <group
      position={[0.35, 0.47, 3.15]}
      rotation={[0, 0.45, 0]}
      scale={hover && !powered ? 1.08 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh>
        <boxGeometry args={[0.17, 0.035, 0.55]} />
        <meshStandardMaterial color="#15141c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 20]} />
        <meshStandardMaterial ref={button} color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.02, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.035, 0.06, 24]} />
        <meshStandardMaterial color="#2b2a36" />
      </mesh>
      {[-0.04, 0, 0.04].flatMap((x) =>
        [0.1, 0.16].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.012, 10]} />
            <meshStandardMaterial color="#3a3946" />
          </mesh>
        )),
      )}
      {/* Generous invisible hit area so the small remote is easy to click. */}
      <mesh visible={false}>
        <boxGeometry args={[0.45, 0.25, 0.8]} />
      </mesh>
    </group>
  );
}

function Room() {
  const books = ["#8b5cf6", "#22d3ee", "#f59e0b", "#ef4444", "#10b981", "#e5e7eb"];
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#6b4e3a" roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2.2]}>
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial color="#7c5cc4" roughness={1} />
      </mesh>
      <mesh position={[0, 4, -0.6]}>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#d8ccdf" roughness={0.9} />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 4, 4]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#c3b5cf" roughness={0.9} />
        </mesh>
      ))}

      {/* Media console */}
      <mesh position={[0, 0.28, -0.2]}>
        <boxGeometry args={[4.4, 0.56, 0.6]} />
        <meshStandardMaterial color="#4a3d58" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0.105]}>
        <boxGeometry args={[4.2, 0.02, 0.01]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.6} />
      </mesh>

      {/* Coffee table */}
      <mesh position={[0, 0.42, 3.2]}>
        <boxGeometry args={[1.8, 0.07, 0.9]} />
        <meshStandardMaterial color="#8a6648" roughness={0.4} metalness={0.1} />
      </mesh>
      {[
        [-0.8, 2.85],
        [0.8, 2.85],
        [-0.8, 3.55],
        [0.8, 3.55],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial color="#0f0c14" />
        </mesh>
      ))}

      {/* Floor lamp */}
      <mesh position={[-3.1, 0.9, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
        <meshStandardMaterial color="#2f2a38" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-3.1, 1.9, -0.1]}>
        <cylinderGeometry args={[0.18, 0.28, 0.35, 24, 1, true]} />
        <meshStandardMaterial color="#ffd7a1" emissive="#ffb46b" emissiveIntensity={1.4} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[-3.1, 1.85, 0.1]} color="#ffb46b" intensity={18} distance={12} decay={2} />

      {/* Shelf with books */}
      <mesh position={[3.3, 1.75, -0.45]}>
        <boxGeometry args={[1.3, 0.04, 0.28]} />
        <meshStandardMaterial color="#8a6648" />
      </mesh>
      {books.map((color, i) => (
        <mesh key={color} position={[2.85 + i * 0.16, 1.9 + (i % 2) * 0.02, -0.45]}>
          <boxGeometry args={[0.1, 0.26 + (i % 3) * 0.04, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}

      {/* Plant */}
      <mesh position={[2.9, 0.25, 0.3]}>
        <cylinderGeometry args={[0.22, 0.17, 0.5, 20]} />
        <meshStandardMaterial color="#e7ddd0" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[2.9 + Math.sin(i * 1.3) * 0.15, 0.75 + i * 0.08, 0.3 + Math.cos(i * 1.3) * 0.15]} rotation={[Math.sin(i) * 0.4, i, Math.cos(i) * 0.4]}>
          <coneGeometry args={[0.16, 0.6, 6]} />
          <meshStandardMaterial color="#2f8f4e" roughness={0.8} />
        </mesh>
      ))}

      {/* Wall art in the site's accent colours */}
      {[
        [-2.4, "#8b5cf6"],
        [2.4, "#22d3ee"],
      ].map(([x, color]) => (
        <group key={String(x)} position={[/** @type {number} */ (x), 2.9, -0.58]}>
          <mesh>
            <planeGeometry args={[0.9, 1.2]} />
            <meshStandardMaterial color="#0d0b13" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.78, 1.08]} />
            <meshStandardMaterial color={/** @type {string} */ (color)} emissive={/** @type {string} */ (color)} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** @param {{ onReady: () => void }} props */
function ReadySignal({ onReady }) {
  const frames = useRef(0);
  useFrame(() => {
    // Wait a couple of frames so shaders are compiled before the canvas fades in.
    if (++frames.current === 3) onReady();
  });
  return null;
}

/**
 * @param {{ powered: boolean, onReady: () => void, onArrive: () => void, onRemoteClick: () => void }} props
 */
export default function LivingRoom({ powered, onReady, onArrive, onRemoteClick }) {
  const [dpr, setDpr] = useState(1.5);
  const [ready, setReady] = useState(false);

  return (
    <div className="room" data-ready={ready || undefined}>
      <Canvas
        dpr={[1, dpr]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 40, near: 0.1, far: 40, position: START.toArray() }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.25;
        }}
      >
        <color attach="background" args={["#2a2233"]} />
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <hemisphereLight args={["#fff1e0", "#3a2c4a", 1.1]} />
        <ambientLight intensity={0.35} color="#ffffff" />
        <directionalLight position={[3, 6, 5]} intensity={1.6} color="#fff4e6" />
        <pointLight position={[0, 3.6, 2.5]} intensity={12} distance={12} decay={2} color="#ffe8cc" />
        <Room />
        <Television powered={powered} onArrive={onArrive} />
        <Remote onClick={onRemoteClick} powered={powered} />
        <Sparkles count={40} scale={[8, 3, 6]} position={[0, 1.8, 2]} size={1.6} speed={0.2} opacity={0.5} color="#fff7e6" />
        <ReadySignal
          onReady={() => {
            setReady(true);
            onReady();
          }}
        />
      </Canvas>
    </div>
  );
}
