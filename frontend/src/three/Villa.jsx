import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { toast } from "sonner";
import * as THREE from "three";

const MATTE_BOOKED = new THREE.Color("#1F2926");

function useVillaMaterials(body, roof) {
  return useMemo(() => {
    const mats = {
      body: new THREE.MeshStandardMaterial({ color: body, roughness: 0.75, transparent: true }),
      roof: new THREE.MeshStandardMaterial({ color: roof, roughness: 0.6, transparent: true }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#BFE3D0", roughness: 0.05, metalness: 0.1, transmission: 0.6,
        transparent: true, opacity: 0.55, side: THREE.DoubleSide,
      }),
      glow: new THREE.MeshStandardMaterial({
        color: "#FFD98A", emissive: "#FFB84D", emissiveIntensity: 1.6, transparent: true,
      }),
      wood: new THREE.MeshStandardMaterial({ color: "#8A6844", roughness: 0.85, transparent: true }),
    };
    mats._base = { body: new THREE.Color(body), roof: new THREE.Color(roof), wood: new THREE.Color("#8A6844") };
    return mats;
  }, [body, roof]);
}

function AFrame({ m }) {
  return (
    <group>
      <mesh material={m.wood} position={[0, 0.08, 0]} castShadow><boxGeometry args={[2.4, 0.16, 2.2]} /></mesh>
      <mesh material={m.body} position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.9]} />
      </mesh>
      <mesh material={m.glass} position={[0, 0.78, 0.96]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.35, 1.35, 0.04]} />
      </mesh>
      <mesh material={m.glow} position={[0, 0.55, 0.9]}><boxGeometry args={[0.5, 0.7, 0.05]} /></mesh>
      <mesh material={m.roof} position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.15, 1.15, 2.0]} />
      </mesh>
      <mesh material={m.glass} position={[0.42, 1.62, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[1.1, 1.95]} />
      </mesh>
    </group>
  );
}

function Lodge({ m }) {
  return (
    <group>
      <mesh material={m.wood} position={[0, 0.1, 0]} castShadow><boxGeometry args={[2.8, 0.2, 2.4]} /></mesh>
      <mesh material={m.body} position={[0, 0.75, 0]} castShadow><boxGeometry args={[2.4, 1.1, 1.9]} /></mesh>
      <mesh material={m.glow} position={[0, 0.7, 0.96]}><boxGeometry args={[1.6, 0.6, 0.04]} /></mesh>
      <mesh material={m.glass} position={[0, 0.72, 0.99]}><boxGeometry args={[1.8, 0.8, 0.02]} /></mesh>
      <mesh material={m.roof} position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.9, 0.9, 4]} />
      </mesh>
      <mesh material={m.glass} position={[0, 1.62, 0.4]} rotation={[-0.5, 0, 0]}><planeGeometry args={[1.0, 0.7]} /></mesh>
      <mesh material={m.wood} position={[1.15, 0.35, 1.35]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /></mesh>
    </group>
  );
}

function Overwater({ m }) {
  return (
    <group>
      {[[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].map(([x, z], i) => (
        <mesh key={i} material={m.wood} position={[x, 0.25, z]}><cylinderGeometry args={[0.09, 0.09, 0.9, 6]} /></mesh>
      ))}
      <mesh material={m.wood} position={[0, 0.72, 0]} castShadow><boxGeometry args={[2.6, 0.14, 2.1]} /></mesh>
      <mesh material={m.body} position={[0, 1.3, 0]} castShadow><boxGeometry args={[2.0, 1.0, 1.6]} /></mesh>
      <mesh material={m.glass} position={[0, 1.28, 0.82]}><boxGeometry args={[1.8, 0.85, 0.02]} /></mesh>
      <mesh material={m.glow} position={[0, 1.25, 0.78]}><boxGeometry args={[1.2, 0.55, 0.04]} /></mesh>
      <mesh material={m.roof} position={[0, 1.92, 0]} castShadow><boxGeometry args={[2.3, 0.12, 1.9]} /></mesh>
      <mesh material={m.glass} position={[0, 1.99, 0]}><boxGeometry args={[1.4, 0.03, 1.1]} /></mesh>
      <mesh material={m.wood} position={[1.8, 0.72, 0]}><boxGeometry args={[1.0, 0.1, 0.7]} /></mesh>
    </group>
  );
}

function Treehouse({ m }) {
  return (
    <group>
      <mesh material={m.wood} position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.22, 0.32, 1.8, 7]} /></mesh>
      <mesh material={m.wood} position={[0, 1.85, 0]}><boxGeometry args={[2.2, 0.14, 1.9]} /></mesh>
      <mesh material={m.body} position={[0, 2.4, 0]} castShadow><boxGeometry args={[1.8, 1.0, 1.5]} /></mesh>
      <mesh material={m.glass} position={[0, 2.38, 0.77]}><boxGeometry args={[1.6, 0.8, 0.02]} /></mesh>
      <mesh material={m.glow} position={[0, 2.35, 0.73]}><boxGeometry args={[1.0, 0.5, 0.04]} /></mesh>
      <mesh material={m.roof} position={[0, 3.05, 0]} rotation={[0, 0, 0.08]} castShadow><boxGeometry args={[2.1, 0.12, 1.8]} /></mesh>
      <mesh material={m.glass} position={[0, 3.12, 0]}><boxGeometry args={[1.0, 0.03, 0.9]} /></mesh>
    </group>
  );
}

function Chalet({ m }) {
  return (
    <group>
      <mesh material={m.wood} position={[0, 0.15, 0]} castShadow><boxGeometry args={[3.2, 0.3, 2.6]} /></mesh>
      <mesh material={m.body} position={[-0.5, 0.95, 0]} castShadow><boxGeometry args={[2.0, 1.3, 2.2]} /></mesh>
      <mesh material={m.body} position={[1.1, 0.75, 0.2]} castShadow><boxGeometry args={[1.0, 0.9, 1.6]} /></mesh>
      <mesh material={m.glass} position={[-0.5, 0.95, 1.12]}><boxGeometry args={[1.7, 1.0, 0.02]} /></mesh>
      <mesh material={m.glow} position={[-0.5, 0.9, 1.08]}><boxGeometry args={[1.1, 0.65, 0.04]} /></mesh>
      <mesh material={m.roof} position={[-0.5, 1.85, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[1.1, 1.1, 2.4]} />
      </mesh>
      <mesh material={m.glass} position={[-0.15, 1.95, 0]} rotation={[0, 0, -Math.PI / 4]}><planeGeometry args={[0.95, 2.35]} /></mesh>
      <mesh material={m.glass} position={[1.1, 1.28, 0.2]}><boxGeometry args={[0.9, 0.03, 1.4]} /></mesh>
    </group>
  );
}

const TYPES = { aframe: AFrame, lodge: Lodge, overwater: Overwater, treehouse: Treehouse, chalet: Chalet };
const BOUNDS = {
  aframe: [2.6, 2.4, 2.4], lodge: [3.0, 2.3, 2.6], overwater: [3.0, 2.3, 2.4],
  treehouse: [2.4, 3.5, 2.1], chalet: [3.4, 2.7, 2.8],
};

export const Villa = ({ villa, config, booked, hovered, selected, faded, onHover, onSelect }) => {
  const group = useRef();
  const inner = useRef();
  const light = useRef();
  const outline = useRef();
  const ring = useRef();
  const mats = useVillaMaterials(config.body, config.roof);
  const Struct = TYPES[config.type];
  const [bw, bh, bd] = BOUNDS[config.type];

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose && m.dispose()), [mats]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const k = Math.min(dt * 6, 1);
    const targetScale = hovered && !booked ? 1.09 : 1;
    inner.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), k);
    const targetOpacity = faded ? 0.12 : 1;
    ["body", "roof", "wood"].forEach((key) => {
      mats[key].opacity = THREE.MathUtils.lerp(mats[key].opacity, targetOpacity, k);
      const baseCol = mats._base[key === "roof" ? "roof" : key === "wood" ? "wood" : "body"];
      mats[key].color.lerp(booked ? MATTE_BOOKED : baseCol, k);
    });
    mats.glass.opacity = THREE.MathUtils.lerp(mats.glass.opacity, faded ? 0.05 : 0.55, k);
    mats.glow.opacity = THREE.MathUtils.lerp(mats.glow.opacity, faded ? 0.05 : 1, k);
    mats.glow.emissiveIntensity = booked ? 0.15 : 1.3 + Math.sin(t * 1.8) * 0.5;
    if (light.current) light.current.intensity = booked ? 0.1 : (1.4 + Math.sin(t * 1.8) * 0.5) * (faded ? 0.1 : 1);
    if (outline.current) {
      outline.current.material.opacity = THREE.MathUtils.lerp(outline.current.material.opacity, 0.85, k);
      outline.current.material.color.set(booked ? "#F59E0B" : "#10B981");
    }
    if (ring.current) {
      ring.current.material.opacity = 0.35 + Math.sin(t * 2.5) * 0.2;
    }
  });

  return (
    <group
      ref={group}
      position={config.position}
      rotation={[0, config.rotationY, 0]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(villa.id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); if (booked) { toast.warning(`${villa.name} is reserved for the selected dates`, { description: "Change your dates in the top bar to check other availability." }); } else { onSelect(villa.id); } }}
    >
      <group ref={inner}>
        <Struct m={mats} />
        <pointLight ref={light} position={[0, config.type === "treehouse" ? 2.4 : 1.0, 0]} color="#FFB84D" distance={4} decay={2} />
        {hovered && !faded && (
          <mesh ref={outline} position={[0, bh / 2, 0]}>
            <boxGeometry args={[bw, bh, bd]} />
            <meshBasicMaterial wireframe transparent opacity={0} color="#10B981" depthWrite={false} />
          </mesh>
        )}
      </group>
      {booked && !faded && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[1.6, 1.95, 48]} />
          <meshBasicMaterial color="#F59E0B" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {!faded && (
        <Html position={[0, bh + 0.7, 0]} center distanceFactor={26} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className={`villa-tag ${booked ? "villa-tag-booked" : ""}`} data-testid={`villa-pin-${villa.id}`}>
            {villa.tag}
          </div>
        </Html>
      )}
      {hovered && !selected && !faded && (
        <Html position={[0, bh + 1.6, 0]} center distanceFactor={22} zIndexRange={[20, 11]} style={{ pointerEvents: "none" }}>
          <div className={`hover-card ${booked ? "hover-card-booked" : ""}`} data-testid={`villa-hover-card-${villa.id}`}>
            <div className="hover-card-name">{villa.name}</div>
            <div className="hover-card-price">${villa.price_per_night}<span> / night</span></div>
            <div className={`hover-card-status ${booked ? "st-booked" : "st-free"}`}>
              {booked ? "Reserved" : "Available"}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
