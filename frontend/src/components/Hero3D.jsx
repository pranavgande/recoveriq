import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";

function Node({ position, label, activeSeed = 0 }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + activeSeed;
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(t * 1.4) * 0.08;
      mesh.current.material.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.6;
    }
  });
  return (
    <group position={position}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#3395FF"
          emissiveIntensity={1.6}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color="#3395FF" transparent opacity={0.06} />
      </mesh>
      <Text
        position={[0, -1.05, 0]}
        fontSize={0.22}
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
    mid.y += 0.6;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(40);
  }, [from, to]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = (clock.getElapsedTime() + phase) % 1;
      ref.current.material.dashOffset = -t * 2;
    }
  });

  return (
    <Line
      ref={ref}
      points={points}
      color="#3395FF"
      lineWidth={2}
      dashed
      dashSize={0.18}
      gapSize={0.12}
      transparent
      opacity={0.85}
    />
  );
}

function Particles({ count = 60 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.06;
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
      <pointsMaterial color="#3395FF" size={0.05} transparent opacity={0.45} />
    </points>
  );
}

function Scene() {
  const llm = [-3.2, 0.4, 0];
  const policy = [0, 0.4, 0];
  const executor = [3.2, 0.4, 0];
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 5]} intensity={1.2} />
      <pointLight position={[-5, 3, 3]} intensity={0.6} color="#3395FF" />
      <Particles />
      <FlowLine from={llm} to={policy} phase={0} />
      <FlowLine from={policy} to={executor} phase={0.4} />
      <Node position={llm} label="LLM DIAGNOSIS" activeSeed={0} />
      <Node position={policy} label="POLICY GATE" activeSeed={1.6} />
      <Node position={executor} label="RAZORPAY EXECUTOR" activeSeed={3.2} />
    </>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-[420px] lg:h-[520px] relative">
      <Canvas
        camera={{ position: [0, 1.6, 7.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.6}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
    </div>
  );
}
