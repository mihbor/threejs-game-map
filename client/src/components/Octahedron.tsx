import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";

export default function Octahedron() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clickedTriangles, setClickedTriangles] = useState<Set<number>>(
    new Set(),
  );
  const { camera, raycaster, pointer } = useThree();
  const meshRefs = useRef<(Mesh | null)[]>([]);

  // Detail level for subdivision: 0 = no subdivision, 1 = 4 triangles per face, etc.
  const detail = 4;

  // Subdivide a triangle into 4 smaller triangles
  const subdivideTriangle = (
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    level: number,
  ): THREE.Vector3[][] => {
    if (level === 0) {
      return [[v1, v2, v3]];
    }

    // Calculate midpoints and normalize to sphere surface
    const m1 = new THREE.Vector3()
      .addVectors(v1, v2)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(2);
    const m2 = new THREE.Vector3()
      .addVectors(v2, v3)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(2);
    const m3 = new THREE.Vector3()
      .addVectors(v3, v1)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(2);

    // Recursively subdivide the 4 sub-triangles
    return [
      ...subdivideTriangle(v1, m1, m3, level - 1),
      ...subdivideTriangle(m1, v2, m2, level - 1),
      ...subdivideTriangle(m3, m2, v3, level - 1),
      ...subdivideTriangle(m1, m2, m3, level - 1),
    ];
  };

  // Create individual triangle geometries for each face
  const createOctahedronTriangles = () => {
    const baseOctahedron = new THREE.OctahedronGeometry(2, 0);
    const positions = baseOctahedron.attributes.position.array as Float32Array;
    const indices = baseOctahedron.index?.array as Uint16Array;

    if (!indices) return [];

    const allTriangles: { geometry: THREE.BufferGeometry; index: number }[] = [];
    let triangleIndex = 0;

    // Process each face of the base octahedron
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new THREE.Vector3(
        positions[indices[i] * 3],
        positions[indices[i] * 3 + 1],
        positions[indices[i] * 3 + 2],
      );
      const v2 = new THREE.Vector3(
        positions[indices[i + 1] * 3],
        positions[indices[i + 1] * 3 + 1],
        positions[indices[i + 1] * 3 + 2],
      );
      const v3 = new THREE.Vector3(
        positions[indices[i + 2] * 3],
        positions[indices[i + 2] * 3 + 1],
        positions[indices[i + 2] * 3 + 2],
      );

      // Subdivide this triangle
      const subdivided = subdivideTriangle(v1, v2, v3, detail);

      subdivided.forEach((triangle) => {
        const geometry = new THREE.BufferGeometry();
        const positions = [
          triangle[0].x,
          triangle[0].y,
          triangle[0].z,
          triangle[1].x,
          triangle[1].y,
          triangle[1].z,
          triangle[2].x,
          triangle[2].y,
          triangle[2].z,
        ];
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(positions), 3),
        );
        geometry.computeVertexNormals();

        allTriangles.push({ geometry, index: triangleIndex });
        triangleIndex++;
      });
    }

    return allTriangles;
  };

  // Calculate triangle adjacency for keyboard navigation
  const triangleAdjacency = useMemo(() => {
    const adjacency = new Map<number, number[]>();
    const triangles = createOctahedronTriangles();
    
    console.log(`Created ${triangles.length} triangles for adjacency calculation`);
    
    // For now, create a simple adjacency where each triangle connects to a few nearby ones
    // This is a simplified approach to avoid performance issues
    triangles.forEach((_, index) => {
      const neighbors: number[] = [];
      
      // Add a few neighboring triangles based on simple index relationships
      if (index > 0) neighbors.push(index - 1);
      if (index < triangles.length - 1) neighbors.push(index + 1);
      if (index > 3) neighbors.push(index - 4);
      if (index < triangles.length - 4) neighbors.push(index + 4);
      
      adjacency.set(index, neighbors);
    });
    
    console.log(`Adjacency map created with ${adjacency.size} entries`);
    return adjacency;
  }, [detail]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if a triangle is selected
      const selectedTriangles = Array.from(clickedTriangles);
      if (selectedTriangles.length !== 1) return;
      
      const currentTriangle = selectedTriangles[0];
      const neighbors = triangleAdjacency.get(currentTriangle) || [];
      
      if (neighbors.length === 0) return;
      
      let nextTriangle: number | null = null;
      
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          // Move to first neighbor (arbitrary direction)
          nextTriangle = neighbors[0];
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          // Move to second neighbor if available, otherwise first
          nextTriangle = neighbors[1] || neighbors[0];
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          // Move to previous neighbor (cycling)
          nextTriangle = neighbors[neighbors.length - 1];
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          // Move to next neighbor (cycling)
          nextTriangle = neighbors[Math.min(1, neighbors.length - 1)];
          break;
        default:
          return;
      }
      
      if (nextTriangle !== null) {
        event.preventDefault();
        console.log(`Keyboard navigation: moving from triangle ${currentTriangle} to ${nextTriangle}`);
        setClickedTriangles(new Set([nextTriangle]));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clickedTriangles, triangleAdjacency]);

  // Simplified approach: use individual mesh click handlers
  const handleClick = (event: THREE.Event) => {
    // Group handler disabled - let individual meshes handle clicks
  };

  const triangles = useMemo(() => createOctahedronTriangles(), [detail]);

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
          ref={(el) => (meshRefs.current[index] = el)}
          geometry={geometry}
          userData={{ triangleIndex: index }}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            console.log(
              `Direct click on triangle ${index}, point:`,
              e.point,
              "distance:",
              e.distance,
            );
            setClickedTriangles((prev) => {
              // Only one triangle can be selected at a time
              if (prev.has(index)) {
                // If clicking the currently selected triangle, deselect it
                console.log(`Deselecting triangle ${index}`);
                return new Set();
              } else {
                // Select the new triangle (replacing any previous selection)
                console.log(`Selecting triangle ${index}`);
                return new Set([index]);
              }
            });
          }}
        >
          <meshStandardMaterial
            color={
              clickedTriangles.has(index)
                ? "#ff6b6b"
                : hovered
                  ? "#4ecdc4"
                  : "#45b7d1"
            }
            wireframe={false}
            metalness={0.3}
            roughness={0.4}
            emissive={hovered ? "#001122" : "#000000"}
            emissiveIntensity={hovered ? 0.1 : 0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

    </group>
  );
}