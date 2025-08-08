import { useMemo } from "react";
import * as THREE from "three";

export default function OctahedronRegion({
  baseVertices,
  detail,
  regionIndex,
  triangles, // <-- new prop
  onTriangleClick,
  selectedTriangles,
  selectionMode,
  hoveredTriangle,
  setHoveredTriangle,
}: {
  baseVertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  detail: number;
  regionIndex: number;
  triangles: { geometry: THREE.BufferGeometry; index: number; localIndex: number }[];
  onTriangleClick: (triangleIndex: number) => void;
  selectedTriangles: Set<number>;
  selectionMode: boolean;
  hoveredTriangle: number | null;
  setHoveredTriangle: (idx: number | null) => void;
}) {
  // No need to subdivide or generate triangles here anymore
  // Use the triangles prop directly

  return (
    <group>
      {triangles.map(({ geometry, index }) => (
        <mesh
          key={index}
          geometry={geometry}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onTriangleClick(index);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            selectionMode && setHoveredTriangle(index)
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            selectionMode && setHoveredTriangle(null)
          }}
        >
          <meshStandardMaterial
            color={
              selectedTriangles.has(index)
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
