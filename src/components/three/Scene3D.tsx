import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store';

function Particles({ count = 60 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const theme = useAppStore((s) => s.theme);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
        ] as [number, number, number],
        speed: 0.002 + Math.random() * 0.005,
        offset: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.04,
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      const x = p.position[0] + Math.sin(time * p.speed + p.offset) * 0.5;
      const y = p.position[1] + Math.cos(time * p.speed * 0.7 + p.offset) * 0.3;
      const z = p.position[2] + Math.sin(time * p.speed * 0.5 + p.offset) * 0.2;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale * (1 + Math.sin(time * 2 + p.offset) * 0.2));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  const color = theme === 'maximalism' ? '#7c3aed' : theme === 'brutalism' ? '#ffffff' : '#333333';

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </instancedMesh>
  );
}

function FloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.1;
    meshRef.current.rotation.y = time * 0.15;
    meshRef.current.position.y = Math.sin(time * 0.3) * 0.5;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[3, 0, -5]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.15} />
      </mesh>
    </Float>
  );
}

function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -2]}>
      <planeGeometry args={[30, 30, 30, 30]} />
      <meshBasicMaterial color="#1a1a3a" wireframe transparent opacity={0.2} />
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <Particles count={80} />
      <FloatingGeometry />
      <GridPlane />
    </>
  );
}

export function Scene3D() {
  const themeMode = useAppStore((s) => s.theme);

  if (themeMode !== 'maximalism') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
