import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Html } from "@react-three/drei";
import { Suspense, useRef, useLayoutEffect, useState } from "react";
import * as THREE from "three";

interface Globe3DProps {
  selectedHub?: 'usa' | 'europe' | 'asia';
}

const allMarkers = [
  { lat: 39.0, lng: -97.0, label: 'США', type: 'dest' },
  { lat: 54.0, lng: -2.0, label: 'Великобритания', type: 'dest' },
  { lat: 51.0, lng: 10.0, label: 'Германия', type: 'dest' },
  { lat: 52.0, lng: 5.0, label: 'Нидерланды', type: 'dest' },
  { lat: 56.0, lng: -106.0, label: 'Канада', type: 'dest' },
  { lat: 37.0, lng: 127.0, label: 'Юж. Корея', type: 'dest' },
  { lat: 36.0, lng: 138.0, label: 'Япония', type: 'dest' },
  { lat: 35.0, lng: 105.0, label: 'Китай', type: 'dest' },
  { lat: 47.0, lng: 19.0, label: 'Венгрия', type: 'dest' },
  { lat: 52.0, lng: 20.0, label: 'Польша', type: 'dest' },
  { lat: 4.0, lng: 102.0, label: 'Малайзия', type: 'dest' },
  { lat: 42.0, lng: 12.0, label: 'Италия', type: 'dest' },
  { lat: 46.0, lng: 2.0, label: 'Франция', type: 'dest' },
  { lat: 60.0, lng: 18.0, label: 'Швеция', type: 'dest' },
  { lat: -25.0, lng: 133.0, label: 'Австралия', type: 'dest' },
  { lat: 48.0, lng: 67.0, label: 'Казахстан', type: 'source' },
  { lat: 41.0, lng: 64.0, label: 'Узбекистан', type: 'source' },
  { lat: 41.0, lng: 75.0, label: 'Кыргызстан', type: 'source' },
  { lat: 39.0, lng: 71.0, label: 'Таджикистан', type: 'source' },
  { lat: 40.0, lng: 58.0, label: 'Туркменистан', type: 'source' },
  { lat: 50.0, lng: 30.0, label: 'Украина', type: 'source' },
  { lat: 53.0, lng: 28.0, label: 'Беларусь', type: 'source' },
];

function toPosition(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function MarkerItem({ hub }: { hub: typeof allMarkers[0] }) {
  const [hovered, setHovered] = useState(false);
  const position = toPosition(hub.lat, hub.lng, 1.62);

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {hovered && (
        <Html
          position={[0, 0.08, 0]}
          center
          distanceFactor={4.5}
          zIndexRange={[100, 0]}
        >
          <div className="px-2 py-0.5 text-[10px] font-medium text-white bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded shadow-md whitespace-nowrap pointer-events-none select-none">
            {hub.label}
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeMesh({ selectedHub }: { selectedHub?: 'usa' | 'europe' | 'asia' }) {
  const groupRef = useRef<THREE.Group>(null);
  const surfaceMap = useTexture("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");

  useLayoutEffect(() => {
    if (surfaceMap) {
      surfaceMap.colorSpace = THREE.SRGBColorSpace;
      surfaceMap.needsUpdate = true;
    }
  }, [surfaceMap]);

  // Целевые углы поворота для каждого хаба
  const targetLngs = {
    europe: -0.1,
    usa: 1.8,
    asia: -2.5
  };

  useFrame((_, delta: number) => {
    const smoothDelta = Math.min(delta, 0.03);
    if (groupRef.current) {
      if (selectedHub) {
        const targetY = targetLngs[selectedHub];
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, smoothDelta * 4);
      } else {
        groupRef.current.rotation.y += smoothDelta * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef} rotation={[0.2, -0.6, -0.05]}>
      <mesh>
        <sphereGeometry args={[1.6, 64, 64]} />
        {surfaceMap && (
          <meshStandardMaterial
            map={surfaceMap}
            roughness={0.7}
            metalness={0.1}
          />
        )}
      </mesh>

      <mesh scale={1.03}>
        <sphereGeometry args={[1.6, 48, 48]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vNormal = normalize(mat3(modelMatrix) * normal);
              vViewDirection = normalize(cameraPosition - worldPosition.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            void main() {
              float rim = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 3.0);
              gl_FragColor = vec4(0.3, 0.65, 1.0, rim * 0.4);
            }
          `}
        />
      </mesh>

      {allMarkers.map((hub) => (
        <MarkerItem key={hub.label} hub={hub} />
      ))}
    </group>
  );
}

export default function Globe3D({ selectedHub }: Globe3DProps) {
  return (
    <div className="relative aspect-square w-full h-full flex items-center justify-center select-none" aria-label="Rotating globe">
      <div className="absolute inset-[12%] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[-5, 3, 5]} intensity={2.0} />
        
        <Suspense fallback={null}>
          <GlobeMesh selectedHub={selectedHub} />
        </Suspense>

        <OrbitControls
          enableZoom={true}          
          minDistance={2.5}          
          maxDistance={7.0}          
          enablePan={false}
          rotateSpeed={0.5}
          dampingFactor={0.05}
          enableDamping={true}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
        />
      </Canvas>
    </div>
  );
}