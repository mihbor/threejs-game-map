import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";

export default function Octahedron() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clickedTriangles, setClickedTriangles] = useState<Set<number>>(new Set());
  const { camera, raycaster, pointer } = useThree();
  const meshRefs = useRef<(Mesh | null)[]>([]);

  // Animate the octahedron with slow rotation
  /*useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.2;
      groupRef.current.rotation.y += delta * 0.3;
      
      // Add slight floating motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });*/

  // Handle click events with raycasting to detect specific triangles
  const handleClick = (event: THREE.Event) => {
    console.log('Click detected!', event);
    if (!groupRef.current) {
      console.log('No group ref');
      return;
    }

    // Update raycaster from mouse position
    raycaster.setFromCamera(pointer, camera);
    console.log('Raycaster position:', pointer, camera.position);
    
    // Find intersections with all meshes in the group
    const intersects = raycaster.intersectObjects(groupRef.current.children, true);
    console.log('Intersections found:', intersects.length, intersects);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const mesh = intersection.object as THREE.Mesh;
      console.log('Intersection object:', mesh, mesh.userData);
      
      // Get the triangle index from the mesh userData
      if (mesh.userData && mesh.userData.triangleIndex !== undefined) {
        const triangleIndex = mesh.userData.triangleIndex;
        
        console.log(`Clicked triangle index: ${triangleIndex}`);
        
        setClickedTriangles(prev => {
          const newSet = new Set(prev);
          if (newSet.has(triangleIndex)) {
            newSet.delete(triangleIndex); // Toggle off if already clicked
          } else {
            newSet.add(triangleIndex); // Toggle on
          }
          console.log('Updated clicked triangles:', Array.from(newSet));
          return newSet;
        });
      } else {
        console.log('No triangle index in userData');
      }
    } else {
      console.log('No intersections found');
    }
  };

  // Create octahedron vertices and faces manually
  const createOctahedronTriangles = () => {
    // Octahedron vertices
    const vertices = [
      new THREE.Vector3(0, 2, 0),    // top
      new THREE.Vector3(2, 0, 0),    // right
      new THREE.Vector3(0, 0, 2),    // front
      new THREE.Vector3(-2, 0, 0),   // left
      new THREE.Vector3(0, 0, -2),   // back
      new THREE.Vector3(0, -2, 0),   // bottom
    ];

    // Define the 8 triangular faces of the octahedron
    const faces = [
      [0, 1, 2], // top-right-front
      [0, 2, 3], // top-front-left
      [0, 3, 4], // top-left-back
      [0, 4, 1], // top-back-right
      [5, 2, 1], // bottom-front-right
      [5, 3, 2], // bottom-left-front
      [5, 4, 3], // bottom-back-left
      [5, 1, 4], // bottom-right-back
    ];

    return faces.map((face, index) => {
      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      
      // Add vertices for this triangle
      face.forEach(vertexIndex => {
        const vertex = vertices[vertexIndex];
        positions.push(vertex.x, vertex.y, vertex.z);
      });
      
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geometry.computeVertexNormals();
      
      return { geometry, index };
    });
  };

  const triangles = createOctahedronTriangles();

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {triangles.map(({ geometry, index }) => (
        <mesh
          key={index}
          ref={el => meshRefs.current[index] = el}
          geometry={geometry}
          userData={{ triangleIndex: index }}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            console.log(`Direct mesh click on triangle ${index}`);
            setClickedTriangles(prev => {
              const newSet = new Set(prev);
              if (newSet.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              console.log('Updated clicked triangles:', Array.from(newSet));
              return newSet;
            });
          }}
        >
          <meshStandardMaterial
            color={clickedTriangles.has(index) ? "#ff6b6b" : hovered ? "#4ecdc4" : "#45b7d1"}
            wireframe={false}
            metalness={0.3}
            roughness={0.4}
            emissive={hovered ? "#001122" : "#000000"}
            emissiveIntensity={hovered ? 0.1 : 0}
          />
        </mesh>
      ))}

      {/* Optional wireframe overlay */}
      <mesh>
        <octahedronGeometry args={[2.01, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe={true}
          transparent={true}
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}