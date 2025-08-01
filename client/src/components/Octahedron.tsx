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
  const [selectionMode, setSelectionMode] = useState(false); // G key mode
  const [hoveredTriangle, setHoveredTriangle] = useState<number | null>(null);
  const { camera, raycaster, pointer } = useThree();
  const meshRefs = useRef<(Mesh | null)[]>([]);

  // Detail level for subdivision: 0 = no subdivision, 1 = 4 triangles per face, etc.
  const detail = 3;

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
    console.log("Creating octahedron triangles...");

    const baseOctahedron = new THREE.OctahedronGeometry(2, 0);
    const positions = baseOctahedron.attributes.position.array as Float32Array;
    const indices = baseOctahedron.index?.array as Uint16Array;

    console.log("Base octahedron created:", {
      positionsLength: positions.length,
      indicesLength: indices?.length,
      hasIndices: !!indices,
    });

    const allTriangles: { geometry: THREE.BufferGeometry; index: number }[] =
      [];
    let triangleIndex = 0;

    // Handle both indexed and non-indexed geometries
    let faceCount: number;
    if (indices) {
      console.log(
        `Processing ${indices.length / 3} faces with detail level ${detail} (indexed)`,
      );
      faceCount = indices.length / 3;
    } else {
      console.log(
        `Processing ${positions.length / 9} faces with detail level ${detail} (non-indexed)`,
      );
      faceCount = positions.length / 9;
    }

    // Process each face of the base octahedron
    for (let i = 0; i < faceCount; i++) {
      let v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3;

      if (indices) {
        // Use indices to get vertices
        const i1 = indices[i * 3];
        const i2 = indices[i * 3 + 1];
        const i3 = indices[i * 3 + 2];

        v1 = new THREE.Vector3(
          positions[i1 * 3],
          positions[i1 * 3 + 1],
          positions[i1 * 3 + 2],
        );
        v2 = new THREE.Vector3(
          positions[i2 * 3],
          positions[i2 * 3 + 1],
          positions[i2 * 3 + 2],
        );
        v3 = new THREE.Vector3(
          positions[i3 * 3],
          positions[i3 * 3 + 1],
          positions[i3 * 3 + 2],
        );
      } else {
        // Use direct position data
        const startIndex = i * 9;
        v1 = new THREE.Vector3(
          positions[startIndex],
          positions[startIndex + 1],
          positions[startIndex + 2],
        );
        v2 = new THREE.Vector3(
          positions[startIndex + 3],
          positions[startIndex + 4],
          positions[startIndex + 5],
        );
        v3 = new THREE.Vector3(
          positions[startIndex + 6],
          positions[startIndex + 7],
          positions[startIndex + 8],
        );
      }

      console.log(`Face ${i / 3}: vertices`, v1, v2, v3);

      // Subdivide this triangle
      const subdivided = subdivideTriangle(v1, v2, v3, detail);
      console.log(
        `Face ${i / 3} subdivided into ${subdivided.length} triangles`,
      );

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

    console.log(`Created ${allTriangles.length} total triangles`);
    return allTriangles;
  };

  // Calculate triangle adjacency for keyboard navigation
  const triangleAdjacency = useMemo(() => {
    const adjacency = new Map<number, number[]>();
    const triangles = createOctahedronTriangles();

    console.log(
      `Created ${triangles.length} triangles for adjacency calculation`,
    );

    // Helper function to check if two triangles share an edge (2 vertices)
    const shareEdge = (
      tri1: THREE.BufferGeometry,
      tri2: THREE.BufferGeometry,
    ): boolean => {
      const pos1 = tri1.attributes.position.array as Float32Array;
      const pos2 = tri2.attributes.position.array as Float32Array;

      const vertices1 = [];
      const vertices2 = [];

      // Extract vertices from both triangles
      for (let i = 0; i < 9; i += 3) {
        vertices1.push([pos1[i], pos1[i + 1], pos1[i + 2]]);
        vertices2.push([pos2[i], pos2[i + 1], pos2[i + 2]]);
      }

      // Count shared vertices (vertices that are very close to each other)
      let sharedVertices = 0;
      const tolerance = 0.001;

      for (const v1 of vertices1) {
        for (const v2 of vertices2) {
          const dx = Math.abs(v1[0] - v2[0]);
          const dy = Math.abs(v1[1] - v2[1]);
          const dz = Math.abs(v1[2] - v2[2]);

          if (dx < tolerance && dy < tolerance && dz < tolerance) {
            sharedVertices++;
            break; // Found a match, move to next vertex in vertices1
          }
        }
      }

      // Triangles share an edge if they have exactly 2 vertices in common
      return sharedVertices === 2;
    };

    // Calculate adjacency for each triangle
    triangles.forEach((triangle, index) => {
      const neighbors: number[] = [];

      // Check against all other triangles
      triangles.forEach((otherTriangle, otherIndex) => {
        if (
          index !== otherIndex &&
          shareEdge(triangle.geometry, otherTriangle.geometry)
        ) {
          neighbors.push(otherIndex);
        }
      });

      adjacency.set(index, neighbors);
      if (neighbors.length > 0) {
        console.log(
          `Triangle ${index} has ${neighbors.length} edge-sharing neighbors: [${neighbors.slice(0, 5).join(", ")}${neighbors.length > 5 ? "..." : ""}]`,
        );
      }
    });

    console.log(`Adjacency map created with ${adjacency.size} entries`);
    return adjacency;
  }, [detail]);

  // Keyboard navigation and G key mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle G key for selection mode toggle
      if (event.key === 'g' || event.key === 'G') {
        const selectedTriangles = Array.from(clickedTriangles);
        if (selectedTriangles.length === 1) {
          setSelectionMode(!selectionMode);
          setHoveredTriangle(null); // Clear any hover when toggling
          console.log(`Selection mode ${!selectionMode ? 'enabled' : 'disabled'}`);
          event.preventDefault();
          return;
        }
      }

      // Only handle navigation if a triangle is selected and not in selection mode
      if (selectionMode) return;
      
      const selectedTriangles = Array.from(clickedTriangles);
      if (selectedTriangles.length !== 1) return;

      const currentTriangle = selectedTriangles[0];
      const neighbors = triangleAdjacency.get(currentTriangle) || [];

      if (neighbors.length === 0) return;

      let nextTriangle: number | null = null;

      // Since each triangle has exactly 3 neighbors, map keys to cycle through them
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          // Move to first neighbor
          nextTriangle = neighbors[0];
          break;
        case "ArrowDown":
        case "s":
        case "S":
          // Move to second neighbor (if available)
          nextTriangle =
            neighbors[1] !== undefined ? neighbors[1] : neighbors[0];
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          // Move to third neighbor (cycling back)
          nextTriangle =
            neighbors[2] !== undefined
              ? neighbors[2]
              : neighbors[neighbors.length - 1];
          break;
        case "ArrowRight":
        case "d":
        case "D":
          // Cycle forward through neighbors (1 -> 2 -> 0 -> 1...)
          const currentIndex = neighbors.indexOf(currentTriangle);
          let nextIndex = 0; // Default to first neighbor
          if (currentIndex === -1) {
            // If current triangle isn't in neighbors (shouldn't happen), use first neighbor
            nextIndex = 0;
          } else {
            // Find which neighbor we came from and move to the next one
            nextIndex =
              neighbors.indexOf(
                neighbors.find((n) => n > currentTriangle) || neighbors[0],
              ) % neighbors.length;
          }
          nextTriangle = neighbors[nextIndex];
          break;
        default:
          return;
      }

      if (nextTriangle !== null) {
        event.preventDefault();
        console.log(
          `Keyboard navigation: moving from triangle ${currentTriangle} to ${nextTriangle}`,
        );
        setClickedTriangles(new Set([nextTriangle]));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clickedTriangles, triangleAdjacency, selectionMode]);

  // Simplified approach: use individual mesh click handlers
  const handleClick = (event: THREE.Event) => {
    // Group handler disabled - let individual meshes handle clicks
  };

  const triangles = useMemo(() => createOctahedronTriangles(), [detail]);

  // Apply cursor style to canvas when in selection mode
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = selectionMode ? 'crosshair' : 'default';
    }
  }, [selectionMode]);

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
          onPointerOver={(e) => {
            e.stopPropagation();
            if (selectionMode) {
              setHoveredTriangle(index);
            }
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            if (selectionMode) {
              setHoveredTriangle(null);
            }
          }}
        >
          <meshStandardMaterial
            color={
              clickedTriangles.has(index)
                ? "#ff6b6b" // Selected triangle stays red
                : selectionMode && hoveredTriangle === index
                  ? "#ffff00" // Yellow hover in selection mode
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
