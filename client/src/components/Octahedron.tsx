import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";

export default function Octahedron() {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Animate the octahedron with slow rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      // Add slight floating motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {/* Octahedron geometry with subdivision */}
      <octahedronGeometry args={[2, 2 ** detail - 1]} />

      {/* Material with wireframe option */}
      <meshStandardMaterial
        color={clicked ? "#ff6b6b" : hovered ? "#4ecdc4" : "#45b7d1"}
        wireframe={false}
        metalness={0.3}
        roughness={0.4}
        emissive={hovered ? "#001122" : "#000000"}
        emissiveIntensity={hovered ? 0.1 : 0}
      />

      {/* Optional wireframe overlay */}
      <mesh>
        <octahedronGeometry args={[2.01, 2 ** detail - 1]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe={true}
          transparent={true}
          opacity={0.1}
        />
      </mesh>
    </mesh>
  );
}
