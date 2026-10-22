import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { createMintHexObject, disposeMintHexObject } from "../three/createMintHexObject";

type MintHexSceneProps = {
  rotating: boolean;
  resetKey: number;
  className?: string;
};

const cameraPosition: [number, number, number] = [3.15, 8.05, 10.5];
const cameraTarget: [number, number, number] = [0, 1.48, 0];
const modelScale = 1;
const modelOffsetX = -2;
const modelOffsetY = -0.5;
const modelRotationSpeed = 0.3;

function FloatingObject({ rotating }: { rotating: boolean }) {
  const model = useMemo(() => createMintHexObject(), []);
  const group = useRef<THREE.Group>(null);
  const entered = useRef(false);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => () => disposeMintHexObject(model), [model]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;

    const time = clock.getElapsedTime();

    if (!entered.current) {
      group.current.scale.setScalar(modelScale * 0.94);
      entered.current = true;
    }

    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, modelScale, 3.2, delta));
    group.current.position.y = modelOffsetY + (reducedMotion ? 0 : Math.sin(time * 0.8) * 0.025);
    if (rotating && !reducedMotion) {
      group.current.rotation.y += delta * modelRotationSpeed;
    } else {
      group.current.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.38) * 0.025;
    }
  });

  return (
    <group ref={group} position={[modelOffsetX, modelOffsetY, 0]}>
      <primitive object={model} />
    </group>
  );
}

function CameraAndControls({ resetKey }: Pick<MintHexSceneProps, "resetKey">) {
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
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.065}
      rotateSpeed={0.3}
      minPolarAngle={0.5}
      maxPolarAngle={1.52}
      autoRotate={false}
    />
  );
}

function SoftGroundShadow() {
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

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.45, -0.045, 0.36]}>
      <planeGeometry args={[7.5, 5.8]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.68} toneMapped={false} />
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

export default function MintHexScene({ rotating, resetKey, className }: MintHexSceneProps) {
  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
      aria-label="Interactive 3D mint glass and metal hexagonal object"
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
        <SoftGroundShadow />
        <ContactShadows position={[0, -0.035, 0]} opacity={0.24} scale={7.5} blur={2.8} far={4} resolution={256} color="#737b70" frames={1} />
        <FloatingObject rotating={rotating} />
        <CameraAndControls resetKey={resetKey} />
      </Canvas>
    </div>
  );
}
