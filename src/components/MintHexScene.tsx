import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { createMintHexObject, disposeMintHexObject } from "../three/createMintHexObject";

type MintHexSceneProps = {
  exploded?: boolean;
  interactive?: boolean;
  triggerKey?: number;
  className?: string;
  // legacy support
  rotating?: boolean;
  resetKey?: number;
};

const cameraPosition: [number, number, number] = [3.15, 8.05, 10.5];
const cameraTarget: [number, number, number] = [0, 1.48, 0];
const modelOffsetX = -2;
const modelOffsetY = -0.5;

// Each child index in createMintHexObject(): 0=bottom glass, 1=brushed, 2=top glass, 3=accent, 4=socket, 5=bright, 6=inside, 7=tiny
const explodeOffsets: THREE.Vector3[] = [
  new THREE.Vector3(-0.7, -0.55, 0.05),
  new THREE.Vector3(0.75, -0.18, 0.35),
  new THREE.Vector3(-0.65, 0.38, -0.3),
  new THREE.Vector3(0.95, 0.1, 0.65),
  new THREE.Vector3(0.0, 0.45, -0.25),
  new THREE.Vector3(-0.45, 0.6, 0.28),
  new THREE.Vector3(0.5, 0.75, -0.22),
  new THREE.Vector3(0.15, 0.88, 0.1),
];

const explodeRotations: THREE.Euler[] = [
  new THREE.Euler(0, 0.28, 0.08),
  new THREE.Euler(0, -0.42, -0.05),
  new THREE.Euler(0.08, 0.35, 0.04),
  new THREE.Euler(0.32, 0.55, 0.18),
  new THREE.Euler(0.05, -0.3, 0.1),
  new THREE.Euler(-0.04, 0.45, -0.06),
  new THREE.Euler(0.06, -0.38, 0.07),
  new THREE.Euler(0.04, 0.22, 0.12),
];

function ExplodingModel({
  exploded = false,
  interactive = true,
  triggerKey = 0,
}: {
  exploded: boolean;
  interactive: boolean;
  triggerKey: number;
}) {
  const model = useMemo(() => createMintHexObject(), []);
  const group = useRef<THREE.Group>(null);
  const progress = useRef(exploded ? 1 : 0);
  const bump = useRef(0);
  const entered = useRef(false);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const initPositions = useMemo(() => model.children.map((c) => c.position.clone()), [model]);
  const initRotations = useMemo(() => model.children.map((c) => c.rotation.clone()), [model]);

  useEffect(() => () => disposeMintHexObject(model), [model]);

  // bump on every navigation
  useEffect(() => {
    if (reducedMotion) return;
    bump.current = 1;
  }, [triggerKey, reducedMotion]);

  // snap progress if exploded toggles with reduced motion, otherwise damp will animate
  useEffect(() => {
    if (reducedMotion) progress.current = exploded ? 1 : 0;
  }, [exploded, reducedMotion]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();

    if (!entered.current) {
      group.current.scale.setScalar(0.94);
      entered.current = true;
    }

    // smooth progress towards target
    const target = exploded ? 1 : 0;
    if (reducedMotion) {
      progress.current = target;
      bump.current = 0;
    } else {
      progress.current = THREE.MathUtils.damp(progress.current, target, 2.7, delta);
      bump.current = THREE.MathUtils.damp(bump.current, 0, 5.2, delta);
    }

    const t = progress.current;
    const b = bump.current;

    // entry scale
    const desiredScale = 1 + b * 0.05;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, desiredScale, 3.2, delta));

    // gentle float for the whole assembly (less when exploded)
    const floatY = reducedMotion ? 0 : Math.sin(time * 0.8) * 0.025 * (1 - t * 0.55);
    group.current.position.y = modelOffsetY + floatY;

    // slow rotation: assembled = continuous, exploded = very slow drift + wobble
    if (reducedMotion) {
      group.current.rotation.y *= 0.98;
    } else if (!exploded && interactive) {
      group.current.rotation.y += delta * 0.28;
    } else if (!exploded && !interactive) {
      group.current.rotation.y += delta * 0.1;
    } else {
      // exploded: orbit slowly so every piece is readable
      group.current.rotation.y += delta * 0.07 * (1 + b * 0.5);
      group.current.rotation.x = Math.sin(time * 0.32) * 0.06 * t;
      group.current.rotation.z = Math.sin(time * 0.2) * 0.03 * t;
    }

    // per-piece explode
    model.children.forEach((child, i) => {
      const base = initPositions[i];
      const off = explodeOffsets[i];
      const rotOff = explodeRotations[i];
      if (!base || !off || !rotOff) return;

      // target = base + off * t + off * b * 0.32 (extra pop on navigation)
      const tEff = t + b * 0.22;
      const clampedTEff = Math.min(Math.max(tEff, 0), 1.15);
      const targetPos = base.clone().add(off.clone().multiplyScalar(clampedTEff));

      // per-piece idle bob (different phase per piece)
      if (!reducedMotion) {
        const bob = Math.sin(time * 0.7 + i * 0.9) * 0.012 * (exploded ? 1 : 0.6);
        // pieces bob slightly around their explode axis
        targetPos.y += bob;
        // a little lateral drift when exploded
        targetPos.x += Math.sin(time * 0.45 + i) * 0.008 * t;
        targetPos.z += Math.cos(time * 0.5 + i * 1.1) * 0.008 * t;
      }

      // lerp position with spring feel — smooth damp
      child.position.x = THREE.MathUtils.damp(child.position.x, targetPos.x, 7.5, delta);
      child.position.y = THREE.MathUtils.damp(child.position.y, targetPos.y, 7.5, delta);
      child.position.z = THREE.MathUtils.damp(child.position.z, targetPos.z, 7.5, delta);

      // rotation: base rot + rotOff * t + tiny wobble
      const baseRot = initRotations[i];
      if (baseRot) {
        child.rotation.x = baseRot.x + rotOff.x * t + (reducedMotion ? 0 : Math.sin(time * 0.9 + i) * 0.02 * t);
        child.rotation.y = baseRot.y + rotOff.y * t + (reducedMotion ? 0 : Math.sin(time * 0.6 + i * 0.7) * 0.015 * t);
        child.rotation.z = baseRot.z + rotOff.z * t;
        // bump spin
        if (b > 0.05) {
          child.rotation.y += b * 0.12 * (i % 2 ? 1 : -1);
        }
      }

      // scale pulse on bump for more juice
      const s = 1 + b * 0.03 * (i === 3 ? 1.4 : 1);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={group} position={[modelOffsetX, modelOffsetY, 0]}>
      <primitive object={model} />
    </group>
  );
}

function CameraAndControls({
  resetKey,
  interactive,
}: {
  resetKey: number;
  interactive: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.zoom = Math.min(size.width / 5.65, size.height / 5.05);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useEffect(() => {
    if (resetKey === 0) return;
    camera.position.set(...cameraPosition);
    controls.current?.target.set(...cameraTarget);
    controls.current?.update();
  }, [camera, resetKey]);

  return (
    <OrbitControls
      ref={controls}
      target={cameraTarget}
      enabled={interactive}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.065}
      rotateSpeed={0.32}
      minPolarAngle={0.5}
      maxPolarAngle={1.52}
      autoRotate={false}
    />
  );
}

function SoftGroundShadow({ explodedT }: { explodedT: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 5, 128, 128, 128);
      gradient.addColorStop(0, "rgba(72, 80, 69, 0.27)");
      gradient.addColorStop(0.38, "rgba(80, 87, 77, 0.16)");
      gradient.addColorStop(1, "rgba(80, 87, 77, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  // we render shadow via plain mesh; opacity driven by parent, but we keep constant here
  // exploded will fade via material opacity in useFrame if needed - simpler keep static
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.45, -0.045, 0.36]}>
      <planeGeometry args={[7.5, 5.8]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.68} toneMapped={false} />
    </mesh>
  );
}

function ShadowFader({ exploded }: { exploded: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const c = canvas.getContext("2d");
    if (c) {
      const g = c.createRadialGradient(128, 128, 5, 128, 128, 128);
      g.addColorStop(0, "rgba(72, 80, 69, 0.27)");
      g.addColorStop(0.38, "rgba(80, 87, 77, 0.16)");
      g.addColorStop(1, "rgba(80, 87, 77, 0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const prog = useRef(exploded ? 1 : 0);
  useFrame((_, delta) => {
    prog.current = THREE.MathUtils.damp(prog.current, exploded ? 1 : 0, 3, delta);
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.68 * (1 - prog.current * 0.72);
      const s = 1 - prog.current * 0.18;
      ref.current.scale.set(s, 1, s);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0.45, -0.045, 0.36]}>
      <planeGeometry args={[7.5, 5.8]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.68} toneMapped={false} />
    </mesh>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} environmentIntensity={0.62}>
      <mesh scale={18}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color="#e4e9e3" side={THREE.BackSide} />
      </mesh>
      <Lightformer form="rect" intensity={2.8} color="#ffffff" scale={[7, 6, 1]} position={[-4, 6, 5]} rotation={[-0.45, -0.4, 0]} />
      <Lightformer form="rect" intensity={2.2} color="#f6fffa" scale={[4, 8, 1]} position={[5, 5, 2]} rotation={[0, 1.05, 0]} />
      <Lightformer form="rect" intensity={1.6} color="#ffffff" scale={[8, 3, 1]} position={[0, 8, -5]} rotation={[0.8, 0, 0]} />
    </Environment>
  );
}

export default function MintHexScene({
  exploded = false,
  interactive = true,
  triggerKey = 0,
  rotating,
  resetKey = 0,
  className,
}: MintHexSceneProps) {
  // legacy compatibility: rotating false => treat as exploded
  const legacyExploded = rotating === false ? true : undefined;
  const isExploded = legacyExploded !== undefined ? legacyExploded : exploded;
  const isInteractive = interactive ?? (rotating ?? true);

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
      aria-label="Interactive 3D mint glass and metal hexagonal object - explodes into pieces on slide change"
    >
      <Canvas
        orthographic
        camera={{ position: cameraPosition, zoom: 130, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        dpr={[1, 2]}
        shadows
      >
        <ambientLight intensity={0.9} color="#ffffff" />
        <directionalLight position={[-4, 9, 7]} intensity={1.55} color="#ffffff" />
        <directionalLight position={[5, 5, -4]} intensity={0.7} color="#d7e8dc" />
        <StudioEnvironment />
        <ShadowFader exploded={isExploded} />
        <ContactShadows position={[0, -0.035, 0]} opacity={0.24} scale={7.5} blur={2.8} far={4} resolution={256} color="#737b70" frames={1} />
        <ExplodingModel exploded={isExploded} interactive={isInteractive} triggerKey={triggerKey} />
        <CameraAndControls resetKey={resetKey} interactive={isInteractive} />
      </Canvas>
    </div>
  );
}
