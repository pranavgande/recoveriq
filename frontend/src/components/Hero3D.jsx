import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";

function Node({ position, label, activeSeed = 0 }) {
  const mesh = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + activeSeed;

    if (mesh.current) {
      mesh.current.position.y =
        position[1] + Math.sin(t * 1.4) * 0.08;

      mesh.current.material.emissiveIntensity =
        1.1 + Math.sin(t * 2) * 0.35;
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.5, 1]} />

        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#3395FF"
          emissiveIntensity={1.2}
          metalness={0.25}
          roughness={0.2}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.76, 24, 24]} />
        <meshBasicMaterial
          color="#3395FF"
          transparent
          opacity={0.05}
        />
      </mesh>

      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color="#0D2366"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function FlowLine({ from, to, phase = 0 }) {
  const ref = useRef();

  const points = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);

    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.55;

    const curve = new THREE.QuadraticBezierCurve3(
      start,
      mid,
      end,
    );

    return curve.getPoints(40);
  }, [from, to]);

  useFrame(({ clock }) => {
    if (ref.current?.material) {
      const t = (clock.getElapsedTime() + phase) % 1;
      ref.current.material.dashOffset = -t * 2;
    }
  });

  return (
    <Line
      ref={ref}
      points={points}
      color="#3395FF"
      lineWidth={1.8}
      dashed
      dashSize={0.16}
      gapSize={0.13}
      transparent
      opacity={0.8}
    />
  );
}

function Particles({ count = 45 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }

    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y =
        clock.getElapsedTime() * 0.045;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#3395FF"
        size={0.045}
        transparent
        opacity={0.4}
      />
    </points>
  );
}

function Scene() {
  const detect = [-3.1, 0.3, 0];
  const decide = [0, 0.3, 0];
  const recover = [3.1, 0.3, 0];

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[5, 6, 5]}
        intensity={1.1}
      />

      <pointLight
        position={[-5, 3, 3]}
        intensity={0.5}
        color="#3395FF"
      />

      <Particles />

      <FlowLine from={detect} to={decide} />
      <FlowLine from={decide} to={recover} phase={0.45} />

      <Node
        position={detect}
        label="DETECT"
        activeSeed={0}
      />

      <Node
        position={decide}
        label="PROTECT"
        activeSeed={1.6}
      />

      <Node
        position={recover}
        label="RECOVER"
        activeSeed={3.2}
      />
    </>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-[300px] lg:h-[360px] relative">
      <Canvas
        camera={{
          position: [0, 1.3, 7],
          fov: 45,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
    </div>
  );
}