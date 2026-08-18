import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const rand = (seed) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

export const Terrain = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[24, 48]} />
        <meshStandardMaterial color="#8FA876" roughness={1} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[27, 48]} />
        <meshStandardMaterial color="#D8CBA8" roughness={1} transparent />
      </mesh>
      {/* sandy shore around lake */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, 0.0, -0.5]}>
        <circleGeometry args={[6.2, 40]} />
        <meshStandardMaterial color="#E4D7B4" roughness={1} transparent />
      </mesh>
      {/* ridge hill for chalet */}
      <mesh position={[-1.5, 0.4, -8.5]} castShadow receiveShadow>
        <cylinderGeometry args={[3.4, 4.6, 1.4, 8]} />
        <meshStandardMaterial color="#7E9A6B" roughness={1} flatShading transparent />
      </mesh>
      {/* mountains backdrop */}
      {[[-14, -12, 4.5, "#5F7D63"], [-9, -16, 6, "#54715A"], [13, -13, 5, "#5F7D63"], [17, -6, 3.6, "#6B8A6E"], [-17, 3, 3.2, "#6B8A6E"]].map(([x, z, h, c], i) => (
        <mesh key={i} position={[x, h / 2 - 0.4, z]} castShadow>
          <coneGeometry args={[h * 0.9, h, 6]} />
          <meshStandardMaterial color={c} roughness={1} flatShading transparent />
        </mesh>
      ))}
      {/* snow caps */}
      {[[-9, -16, 6], [13, -13, 5]].map(([x, z, h], i) => (
        <mesh key={i} position={[x, h - 0.85, z]}>
          <coneGeometry args={[h * 0.22, h * 0.28, 6]} />
          <meshStandardMaterial color="#F4F1E6" roughness={0.9} flatShading transparent />
        </mesh>
      ))}
    </group>
  );
};

export const Lake = () => {
  const mat = useRef();
  const ripples = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mat.current) mat.current.normalScale?.set?.(1, 1);
    if (ripples.current) {
      ripples.current.children.forEach((r, i) => {
        const p = (t * 0.22 + i * 0.34) % 1;
        r.scale.setScalar(0.4 + p * 2.2);
        r.material.opacity = (1 - p) * 0.35;
      });
    }
  });
  return (
    <group position={[3.2, 0.02, -0.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.4, 48]} />
        <meshStandardMaterial ref={mat} color="#3E8E8B" roughness={0.15} metalness={0.35} transparent opacity={0.92} />
      </mesh>
      <group ref={ripples}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[i === 0 ? 1 : i === 1 ? -1.6 : 0.2, 0.015 + i * 0.002, i === 0 ? 0.8 : i === 1 ? -1 : 1.8]}>
            <ringGeometry args={[0.9, 0.98, 40]} />
            <meshBasicMaterial color="#DFF3EC" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const Tree = ({ x, z, s, c }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.11, 0.7, 5]} />
      <meshStandardMaterial color="#6E5238" roughness={1} transparent />
    </mesh>
    <mesh position={[0, 1.0, 0]} castShadow>
      <coneGeometry args={[0.55, 1.2, 6]} />
      <meshStandardMaterial color={c} roughness={1} flatShading transparent />
    </mesh>
    <mesh position={[0, 1.7, 0]} castShadow>
      <coneGeometry args={[0.38, 0.9, 6]} />
      <meshStandardMaterial color={c} roughness={1} flatShading transparent />
    </mesh>
  </group>
);

export const Forest = () => {
  const g1 = useRef();
  const g2 = useRef();
  const trees = useMemo(() => {
    const r = rand(42);
    const list = [];
    const colors = ["#1F4A35", "#2A5C42", "#37704F", "#274F3A"];
    for (let i = 0; i < 52; i++) {
      const a = r() * Math.PI * 2;
      const d = 6 + r() * 15;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (Math.hypot(x - 3.2, z + 0.5) < 6.4) continue;
      const nearVilla = [[-7.5, -3.5], [-4.5, 5.5], [8, 5.2], [-1.5, -8.5]].some(([vx, vz]) => Math.hypot(x - vx, z - vz) < 2.6);
      if (nearVilla) continue;
      list.push({ x, z, s: 0.7 + r() * 0.9, c: colors[Math.floor(r() * colors.length)] });
    }
    return list;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (g1.current) g1.current.rotation.z = Math.sin(t * 0.9) * 0.016;
    if (g2.current) g2.current.rotation.z = Math.sin(t * 0.9 + 1.7) * 0.016;
  });
  const half = Math.ceil(trees.length / 2);
  return (
    <group>
      <group ref={g1}>{trees.slice(0, half).map((t, i) => <Tree key={i} {...t} />)}</group>
      <group ref={g2}>{trees.slice(half).map((t, i) => <Tree key={i} {...t} />)}</group>
    </group>
  );
};

export const Clouds = () => {
  const group = useRef();
  const clouds = useMemo(() => [
    { x: -10, y: 14, z: -6, s: 1.3, v: 0.28 },
    { x: 4, y: 16, z: -12, s: 1.7, v: 0.2 },
    { x: 10, y: 13.5, z: 4, s: 1.1, v: 0.34 },
    { x: -4, y: 15, z: 8, s: 1.4, v: 0.24 },
  ], []);
  useFrame((_, dt) => {
    group.current.children.forEach((c, i) => {
      c.position.x += clouds[i].v * dt;
      if (c.position.x > 22) c.position.x = -22;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[0, 0, 0, 1], [0.9, 0.15, 0.2, 0.7], [-0.85, 0.1, -0.15, 0.65], [0.3, 0.35, -0.3, 0.55]].map(([px, py, pz, ps], j) => (
            <mesh key={j} position={[px, py, pz]} scale={[ps * 1.6, ps * 0.62, ps]}>
              <sphereGeometry args={[0.8, 10, 8]} />
              <meshStandardMaterial color="#FBF8F0" transparent opacity={0.85} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

export const Rocks = () => {
  const rocks = useMemo(() => {
    const r = rand(7);
    return Array.from({ length: 14 }, () => {
      const a = r() * Math.PI * 2;
      const d = 7.2 + r() * 1.6;
      return { x: 3.2 + Math.cos(a) * (d - 1.4), z: -0.5 + Math.sin(a) * (d - 1.4), s: 0.14 + r() * 0.3, rY: r() * Math.PI };
    });
  }, []);
  return (
    <group>
      {rocks.map((rk, i) => (
        <mesh key={i} position={[rk.x, rk.s * 0.5, rk.z]} rotation={[0, rk.rY, 0]} scale={rk.s} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#A8A093" roughness={1} flatShading transparent />
        </mesh>
      ))}
    </group>
  );
};

export const Dock = () => (
  <group position={[1.2, 0.12, 1.9]} rotation={[0, 0.9, 0]}>
    <mesh castShadow><boxGeometry args={[0.9, 0.08, 3.2]} /><meshStandardMaterial color="#9C7B52" roughness={1} transparent /></mesh>
    {[[-0.35, -1.3], [0.35, -1.3], [-0.35, 1.3], [0.35, 1.3]].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.18, z]}><cylinderGeometry args={[0.05, 0.05, 0.4, 6]} /><meshStandardMaterial color="#7C5E3C" roughness={1} transparent /></mesh>
    ))}
  </group>
);
