import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

export default function Octahedron({ detail = 5 }: { detail?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clickedTriangles, setClickedTriangles] = useState<Set<number>>(
    new Set(),
  );
  const [selectionMode, setSelectionMode] = useState(false); // G key mode
  const [hoveredTriangle, setHoveredTriangle] = useState<number | null>(null);
  const { camera, raycaster, pointer } = useThree();
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const lineRef = useRef<Line2 | null>(null);


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
    console.log(`[${new Date().toLocaleTimeString()}] Creating octahedron triangles...`);

    const baseOctahedron = new THREE.OctahedronGeometry(2, 0);
    const positions = baseOctahedron.attributes.position.array as Float32Array;
    const indices = baseOctahedron.index?.array as Uint16Array;

    console.log(`[${new Date().toLocaleTimeString()}] Base octahedron created:`, {
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
        `[${new Date().toLocaleTimeString()}] Processing ${indices.length / 3} faces with detail level ${detail} (indexed)`,
      );
      faceCount = indices.length / 3;
    } else {
      console.log(
        `[${new Date().toLocaleTimeString()}] Processing ${positions.length / 9} faces with detail level ${detail} (non-indexed)`,
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

    console.log(`[${new Date().toLocaleTimeString()}] Created ${allTriangles.length} total triangles`);
    return allTriangles;
  };

  // Memoize triangles to avoid unnecessary recalculation
  const triangles = useMemo(() => createOctahedronTriangles(), [detail]);

  // Calculate triangle adjacency for keyboard navigation (optimized)
  const triangleAdjacency = useMemo(() => {
    // Helper to create a unique key for an edge (sorted vertex positions)
    function edgeKey(a: number[], b: number[]) {
      // Sort the two vertices lexicographically
      const v1 = a.join(",");
      const v2 = b.join(",");
      return v1 < v2 ? `${v1}|${v2}` : `${v2}|${v1}`;
    }

    // Build a map from edge key to triangle indices
    const edgeMap = new Map<string, number[]>();
    triangles.forEach(({ geometry }, triIdx) => {
      const pos = geometry.attributes.position.array as Float32Array;
      const verts = [
        [pos[0], pos[1], pos[2]],
        [pos[3], pos[4], pos[5]],
        [pos[6], pos[7], pos[8]],
      ];
      // Each triangle has 3 edges
      for (let i = 0; i < 3; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % 3];
        const key = edgeKey(a, b);
        if (!edgeMap.has(key)) edgeMap.set(key, []);
        edgeMap.get(key)!.push(triIdx);
      }
    });

    // Now, for each triangle, find neighbors (other triangles sharing an edge)
    const adjacency = new Map<number, number[]>();
    triangles.forEach(({ geometry }, triIdx) => {
      const pos = geometry.attributes.position.array as Float32Array;
      const verts = [
        [pos[0], pos[1], pos[2]],
        [pos[3], pos[4], pos[5]],
        [pos[6], pos[7], pos[8]],
      ];
      const neighbors = new Set<number>();
      for (let i = 0; i < 3; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % 3];
        const key = edgeKey(a, b);
        const tris = edgeMap.get(key)!;
        tris.forEach(idx => {
          if (idx !== triIdx) neighbors.add(idx);
        });
      }
      adjacency.set(triIdx, Array.from(neighbors));
    });
    console.log(`[${new Date().toLocaleTimeString()}] Adjacency map created with ${adjacency.size} entries`);
    return adjacency;
  }, [triangles]);

  // Helper function to check if two triangles share an edge (2 vertices)
  function shareEdge(
    tri1: THREE.BufferGeometry,
    tri2: THREE.BufferGeometry,
  ): boolean {
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
  }

  // Keyboard navigation and G key mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle G key for selection mode toggle
      if (event.key === 'g' || event.key === 'G') {
        const selectedTriangles = Array.from(clickedTriangles);
        if (selectedTriangles.length === 1) {
          setSelectionMode(!selectionMode);
          setHoveredTriangle(null); // Clear any hover when toggling
          console.log(`Selection mode ${!selectionMode ? 'enabled' : 'disabled'} [${new Date().toLocaleTimeString()}]`);
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
          `[${new Date().toLocaleTimeString()}] Keyboard navigation: moving from triangle ${currentTriangle} to ${nextTriangle}`,
        );
        setClickedTriangles(new Set([nextTriangle]));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clickedTriangles, triangleAdjacency, selectionMode]);

  // Handle clicks on the group (background)
  const handleClick = (event: THREE.Event) => {
    // Disable selection mode when clicking anywhere
    if (selectionMode) {
      console.log('Disabling selection mode due to click [' + new Date().toLocaleTimeString() + ']');
      setSelectionMode(false);
    }
  };

  // Calculate triangle centers for pathfinding
  const triangleCenters = useMemo(() => {
    const centers = new Map<number, THREE.Vector3>();
    triangles.forEach(({ geometry, index }) => {
      const positions = geometry.attributes.position.array as Float32Array;
      const center = new THREE.Vector3(
        (positions[0] + positions[3] + positions[6]) / 3,
        (positions[1] + positions[4] + positions[7]) / 3,
        (positions[2] + positions[5] + positions[8]) / 3
      );
      centers.set(index, center);
    });
    return centers;
  }, [triangles]);

  // Pathfinding using BFS to find shortest path between triangles
  const findPath = (start: number, end: number): number[] => {
    if (start === end) return [start];

    const queue: { triangle: number; path: number[] }[] = [{ triangle: start, path: [start] }];
    const visited = new Set<number>([start]);

    while (queue.length > 0) {
      const { triangle, path } = queue.shift()!;
      const neighbors = triangleAdjacency.get(triangle) || [];

      for (const neighbor of neighbors) {
        if (neighbor === end) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ triangle: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return []; // No path found
  };

  // Calculate path when in selection mode and hovering
  const currentPath = useMemo(() => {
    if (!selectionMode || hoveredTriangle === null) {
      console.log("No path calculation - selectionMode:", selectionMode, "hoveredTriangle:", hoveredTriangle);
      return [];
    }

    const selectedTriangles = Array.from(clickedTriangles);
    if (selectedTriangles.length !== 1) {
      console.log("No path calculation - wrong selection count:", selectedTriangles.length);
      return [];
    }

    const startTriangle = selectedTriangles[0];
    if (startTriangle === hoveredTriangle) {
      console.log("No path calculation - same triangle");
      return [];
    }

    const path = findPath(startTriangle, hoveredTriangle);
//     console.log(`Path calculated from ${startTriangle} to ${hoveredTriangle}:`, path);
    return path;
  }, [selectionMode, hoveredTriangle, clickedTriangles, triangleAdjacency]);

  // Apply cursor style to canvas when in selection mode
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = selectionMode ? 'crosshair' : 'default';
    }
  }, [selectionMode]);

  // Update line material resolution when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (lineRef.current && lineRef.current.material) {
        (lineRef.current.material as LineMaterial).resolution.set(
          window.innerWidth, 
          window.innerHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Render path line when in selection mode */}
      {selectionMode && hoveredTriangle !== null && clickedTriangles.size === 1 && (() => {
        const selectedTriangle = Array.from(clickedTriangles)[0];
        const path = findPath(selectedTriangle, hoveredTriangle);

        if (path.length > 1) {
          console.log(
            `[${new Date().toLocaleTimeString()}] Rendering path:`, path
          );
          const pathPoints = path.map(triangleIndex => {
            const center = triangleCenters.get(triangleIndex);
            return center ? center.clone().normalize().multiplyScalar(2.05) : new THREE.Vector3(0, 0, 0);
          });

          // Create positions array for LineGeometry
          const positions: number[] = [];
          pathPoints.forEach(point => {
            positions.push(point.x, point.y, point.z);
          });

          // Create LineGeometry
          const geometry = new LineGeometry();
          geometry.setPositions(positions);

          return (
            <primitive 
              object={new Line2(geometry, 
                new LineMaterial({ 
                  color: "#ff4444", 
                  linewidth: 3,
                  resolution: new THREE.Vector2(window.innerWidth, window.innerHeight) // needed for proper width
                })
              )} 
              ref={lineRef} 
            />
          );
        }
        return null;
      })()}

      {/* Render individual triangle meshes */}
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
              `[${new Date().toLocaleTimeString()}] Direct click on triangle ${index}, point:`,
              e.point,
              'distance:',
              e.distance,
            );

            // Disable selection mode when clicking on a triangle
            if (selectionMode) {
              console.log(`Disabling selection mode due to click on triangle ${index} [${new Date().toLocaleTimeString()}]`);
              setSelectionMode(false);
            }

            setClickedTriangles((prev) => {
              // Only one triangle can be selected at a time
              if (prev.has(index)) {
                // If clicking the currently selected triangle, deselect it
                console.log(`Deselecting triangle ${index} [${new Date().toLocaleTimeString()}]`);
                return new Set();
              } else {
                // Select the new triangle (replacing any previous selection)
                console.log(`Selecting triangle ${index} [${new Date().toLocaleTimeString()}]`);
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
                ? "#ff6b6b"
                : selectionMode && hoveredTriangle === index
                ? "#ffff00"
                : "#45b7d1"
            }
            wireframe={false}
            metalness={0.3}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
