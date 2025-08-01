import { useRef, useState, useEffect } from "react";
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
  const detail = 1;

  // Animate the octahedron with slow rotation
  /*useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.2;
      groupRef.current.rotation.y += delta * 0.3;
      
      // Add slight floating motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });*/

  // Simplified approach: use individual mesh click handlers
  const handleClick = (event: THREE.Event) => {
    // Group handler disabled - let individual meshes handle clicks
  };

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

    // Recursively subdivide the 4 new triangles
    const triangles: THREE.Vector3[][] = [];
    triangles.push(...subdivideTriangle(v1, m1, m3, level - 1));
    triangles.push(...subdivideTriangle(m1, v2, m2, level - 1));
    triangles.push(...subdivideTriangle(m3, m2, v3, level - 1));
    triangles.push(...subdivideTriangle(m1, m2, m3, level - 1));

    return triangles;
  };

  // Create octahedron vertices and faces manually
  const createOctahedronTriangles = () => {
    // Octahedron vertices
    const vertices = [
      new THREE.Vector3(0, 2, 0), // top
      new THREE.Vector3(2, 0, 0), // right
      new THREE.Vector3(0, 0, 2), // front
      new THREE.Vector3(-2, 0, 0), // left
      new THREE.Vector3(0, 0, -2), // back
      new THREE.Vector3(0, -2, 0), // bottom
    ];

    // Define the 8 triangular faces of the octahedron
    const baseFaces = [
      [0, 1, 2], // top-right-front
      [0, 2, 3], // top-front-left
      [0, 3, 4], // top-left-back
      [0, 4, 1], // top-back-right
      [5, 2, 1], // bottom-front-right
      [5, 3, 2], // bottom-left-front
      [5, 4, 3], // bottom-back-left
      [5, 1, 4], // bottom-right-back
    ];

    const allTriangles: { geometry: THREE.BufferGeometry; index: number }[] =
      [];
    let triangleIndex = 0;

    baseFaces.forEach((face) => {
      const v1 = vertices[face[0]];
      const v2 = vertices[face[1]];
      const v3 = vertices[face[2]];

      // Subdivide this face based on detail level
      const subdivided = subdivideTriangle(v1, v2, v3, detail);

      subdivided.forEach((triangle) => {
        const geometry = new THREE.BufferGeometry();
        const positions: number[] = [];

        // Add vertices for this triangle
        triangle.forEach((vertex) => {
          positions.push(vertex.x, vertex.y, vertex.z);
        });

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(positions), 3),
        );
        geometry.computeVertexNormals();

        allTriangles.push({ geometry, index: triangleIndex });
        triangleIndex++;
      });
    });

    return allTriangles;
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
              const newSet = new Set(prev);
              if (newSet.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              console.log("Updated clicked triangles:", Array.from(newSet));
              return newSet;
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

      {/* Wireframe overlay using lineSegments instead of mesh to avoid raycasting */}
      <lineSegments>
        <edgesGeometry args={[new THREE.OctahedronGeometry(2, detail)]} />
        <lineBasicMaterial color="#ffffff" transparent={true} opacity={0.2} />
      </lineSegments>
    </group>
  );
}
