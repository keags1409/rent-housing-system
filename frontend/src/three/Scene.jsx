import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { Villa } from "@/three/Villa";
import { Terrain, Lake, Forest, Clouds, Rocks, Dock } from "@/three/Environment";
import { VILLA_3D } from "@/data/villas";

function CameraRig({ selectedConfig, paused }) {
  const { camera } = useThree();
  const angle = useRef(0.6);
  const speed = useRef(1);
  const anim = useRef({ focus: 0 });
  const focusPos = useRef(new THREE.Vector3(0, 0, 0));
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedConfig) {
      const [x, y, z] = selectedConfig.position;
      focusPos.current.set(x, y, z);
    }
    gsap.to(anim.current, { focus: selectedConfig ? 1 : 0, duration: 1.7, ease: "power3.inOut" });
  }, [selectedConfig]);

  useFrame((_, dt) => {
    const f = anim.current.focus;
    speed.current = THREE.MathUtils.lerp(speed.current, paused ? 0 : 1, Math.min(dt * 4, 1));
    if (f < 0.98) angle.current += dt * 0.055 * speed.current * (1 - f);
    const orbX = Math.sin(angle.current) * 23;
    const orbZ = Math.cos(angle.current) * 23;
    const orbY = 19;
    const fp = focusPos.current;
    const type = selectedConfig?.type;
    const yOff = type === "treehouse" ? 4.6 : 3.6;
    const fx = fp.x + 4.8, fy = fp.y + yOff, fz = fp.z + 4.8;
    camera.position.set(
      orbX * (1 - f) + fx * f,
      orbY * (1 - f) + fy * f,
      orbZ * (1 - f) + fz * f
    );
    const ty = fp.y + (type === "treehouse" ? 2.4 : 1.2);
    lookAt.current.set(fp.x * f, ty * f, fp.z * f);
    if (f > 0.01) {
      const dir = lookAt.current.clone().sub(camera.position).normalize();
      const right = dir.clone().cross(camera.up).normalize();
      lookAt.current.addScaledVector(right, 2.0 * f);
    }
    camera.lookAt(lookAt.current);
  });
  return null;
}

function FadeGroup({ dimmed, children }) {
  const group = useRef();
  const mats = useRef([]);
  useEffect(() => {
    mats.current = [];
    group.current.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.userData.baseOpacity = o.material.opacity ?? 1;
        mats.current.push(o.material);
      }
    });
  }, []);
  useFrame((_, dt) => {
    const k = Math.min(dt * 5, 1);
    mats.current.forEach((m) => {
      const target = dimmed ? 0.1 : m.userData.baseOpacity;
      m.opacity = THREE.MathUtils.lerp(m.opacity, target, k);
    });
  });
  return <group ref={group}>{children}</group>;
}

export const ResortScene = ({ villas, bookedIds, hoveredId, selectedId, onHover, onSelect }) => {
  const selectedConfig = selectedId ? VILLA_3D[selectedId] : null;
  const fog = useMemo(() => new THREE.Fog("#D9E2CF", 28, 62), []);
  const hoveredBooked = hoveredId && bookedIds.has(hoveredId);

  return (
    <div
      data-testid="3d-resort-map-canvas"
      className={`absolute inset-0 ${hoveredId ? (hoveredBooked ? "cursor-target-amber" : "cursor-target") : ""}`}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 32, position: [14, 19, 18], near: 0.5, far: 120 }}
        onPointerMissed={() => onSelect(null)}
        onCreated={({ scene }) => { scene.fog = fog; }}
      >
        <color attach="background" args={["#D9E2CF"]} />
        <hemisphereLight args={["#FDEFD3", "#4A6B58", 0.55]} />
        <ambientLight intensity={0.35} color="#FFE9C4" />
        <directionalLight
          position={[16, 20, 8]}
          intensity={2.2}
          color="#FFD9A0"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-12, 8, -10]} intensity={0.4} color="#B8D4C8" />

        <CameraRig selectedConfig={selectedConfig} paused={!!hoveredId} />

        <FadeGroup dimmed={!!selectedId}>
          <Terrain />
          <Lake />
          <Forest />
          <Clouds />
          <Rocks />
          <Dock />
        </FadeGroup>

        {villas.map((v) => (
          <Villa
            key={v.id}
            villa={v}
            config={VILLA_3D[v.id]}
            booked={bookedIds.has(v.id)}
            hovered={hoveredId === v.id}
            selected={selectedId === v.id}
            faded={!!selectedId && selectedId !== v.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={44} blur={2.4} far={9} resolution={512} frames={1} />
      </Canvas>
    </div>
  );
};
