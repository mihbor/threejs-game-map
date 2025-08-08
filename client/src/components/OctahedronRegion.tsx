import { useMemo } from "react";
import * as THREE from "three";

export default function OctahedronRegion({
  baseVertices,
  detail,
  regionIndex,
  onTriangleClick,
  selectedTriangles,
  selectionMode,
  hoveredTriangle,
  setHoveredTriangle,
}: {
  baseVertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  detail: number;
  regionIndex: number;
  onTriangleClick: (triangleIndex: number) => void;
  selectedTriangles: Set<number>;
  selectionMode: boolean;
  hoveredTriangle: number | null;
  setHoveredTriangle: (idx: number | null) => void;
}) {
  // Subdivide a triangle into 4 smaller triangles
  function subdivideTriangle(
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    level: number,
  ): THREE.Vector3[][] {
    if (level === 0) {
      return [[v1, v2, v3]];
    }
    const m1 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5).normalize().multiplyScalar(2);
    const m2 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5).normalize().multiplyScalar(2);
    const m3 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5).normalize().multiplyScalar(2);
    return [
      ...subdivideTriangle(v1, m1, m3, level - 1),
      ...subdivideTriangle(m1, v2, m2, level - 1),
      ...subdivideTriangle(m3, m2, v3, level - 1),
      ...subdivideTriangle(m1, m2, m3, level - 1),
    ];
  }

  // Generate triangles for this region
  const triangles = useMemo(() => {
    // Ensure vertices are normalized to exact same position
    const normalizeVertex = (v: THREE.Vector3) => {
      return v.normalize().multiplyScalar(2);
    };

    // Normalize input vertices to ensure consistent positions at shared edges
    const v1 = normalizeVertex(baseVertices[0].clone());
    const v2 = normalizeVertex(baseVertices[1].clone());
    const v3 = normalizeVertex(baseVertices[2].clone());

    return subdivideTriangle(v1, v2, v3, detail);
  }, [baseVertices, detail]);

  // Create all geometries at once
  const geometries = useMemo(() => {
    // Function to ensure consistent vertex positions
    const snapToSphere = (x: number, y: number, z: number) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      // Ensure exactly length 2 (radius of sphere)
      return [
        (x / len) * 2,
        (y / len) * 2,
        (z / len) * 2
      ];
    };

    return triangles.map(triangle => {
      // Snap all vertices exactly to the sphere surface
      const [x1, y1, z1] = snapToSphere(triangle[0].x, triangle[0].y, triangle[0].z);
      const [x2, y2, z2] = snapToSphere(triangle[1].x, triangle[1].y, triangle[1].z);
      const [x3, y3, z3] = snapToSphere(triangle[2].x, triangle[2].y, triangle[2].z);

      const positions = [
        x1, y1, z1,
        x2, y2, z2,
        x3, y3, z3,
      ];
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
      geom.computeVertexNormals();
      return geom;
    });
  }, [triangles]);

  return (
    <group>
      {geometries.map((geometry, i) => {
        const triangleIndex = regionIndex * 100000 + i; // Unique index per region
        return (
          <mesh
            key={triangleIndex}
            geometry={geometry}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onTriangleClick(triangleIndex);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              selectionMode && setHoveredTriangle(triangleIndex)
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              selectionMode && setHoveredTriangle(null)
            }}
          >
            <meshStandardMaterial
              color={
                selectedTriangles.has(triangleIndex)
                  ? "#ff6b6b"
                  : selectionMode && hoveredTriangle === triangleIndex
                  ? "#ffff00"
                  : "#45b7d1"
              }
              wireframe={false}
              metalness={0.3}
              roughness={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
