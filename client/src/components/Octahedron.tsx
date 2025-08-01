import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";

export default function Octahedron() {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clickedFaces, setClickedFaces] = useState<Set<number>>(new Set());
  const { camera, raycaster, pointer } = useThree();

  // Animate the octahedron with slow rotation
  /*useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      // Add slight floating motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });*/

  const detail = 0; // No subdivision for clearer face detection

  // Handle click events with raycasting to detect specific faces
  const handleClick = (event: THREE.Event) => {
    if (!meshRef.current) return;

    // Update raycaster from mouse position
    raycaster.setFromCamera(pointer, camera);
    
    // Find intersections with the mesh
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      if (intersection.face && intersection.faceIndex !== undefined) {
        // For octahedron, each face is 2 triangles, so we need to map to face groups
        const faceIndex = Math.floor(intersection.faceIndex / 2);
        
        console.log(`Clicked face index: ${faceIndex}, triangle: ${intersection.faceIndex}`);
        
        setClickedFaces(prev => {
          const newSet = new Set(prev);
          if (newSet.has(faceIndex)) {
            newSet.delete(faceIndex); // Toggle off if already clicked
          } else {
            newSet.add(faceIndex); // Toggle on
          }
          return newSet;
        });
      }
    }
  };

  // Create vertex colors based on clicked faces
  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry;
      const positionAttribute = geometry.getAttribute('position');
      const vertexCount = positionAttribute.count;
      
      // Create color attribute if it doesn't exist
      if (!geometry.getAttribute('color')) {
        const colors = new Float32Array(vertexCount * 3);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      }
      
      const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;
      const baseColor = new THREE.Color(hovered ? "#4ecdc4" : "#45b7d1");
      const clickedColor = new THREE.Color("#ff6b6b");
      
      // Set colors for all vertices
      for (let i = 0; i < vertexCount; i++) {
        const faceIndex = Math.floor(i / 3 / 2); // Each face has 2 triangles (6 vertices)
        const color = clickedFaces.has(faceIndex) ? clickedColor : baseColor;
        
        colorAttribute.setXYZ(i, color.r, color.g, color.b);
      }
      
      colorAttribute.needsUpdate = true;
    }
  }, [clickedFaces, hovered]);

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {/* Octahedron geometry without subdivision */}
      <octahedronGeometry args={[2, detail]} />

      {/* Material with vertex colors enabled */}
      <meshStandardMaterial
        vertexColors={true}
        wireframe={false}
        metalness={0.3}
        roughness={0.4}
        emissive={hovered ? "#001122" : "#000000"}
        emissiveIntensity={hovered ? 0.1 : 0}
      />

      {/* Optional wireframe overlay */}
      <mesh>
        <octahedronGeometry args={[2.01, detail]} />
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