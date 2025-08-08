import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import Octahedron from "./Octahedron.tsx";

export default function OctahedronScene() {
  const { gl, camera } = useThree();
  // Per-region LOD state
  const [regionDetails, setRegionDetails] = useState([2, 2, 2, 2, 2, 2, 2, 2]);
  const lastRegionDetails = useRef(regionDetails);

  // Octahedron base vertices and faces (same as in Octahedron)
  const baseVerts = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  const faces = [
    [0, 2, 4],
    [2, 1, 4],
    [1, 3, 4],
    [3, 0, 4],
    [0, 5, 2],
    [2, 5, 1],
    [1, 5, 3],
    [3, 5, 0],
  ];

  // Compute face centers for LOD
  const faceCenters = faces.map((face) => {
    const v1 = baseVerts[face[0]],
      v2 = baseVerts[face[1]],
      v3 = baseVerts[face[2]];
    return new THREE.Vector3().addVectors(v1, v2).add(v3).multiplyScalar(1 / 3);
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera aspect ratio
      if ("aspect" in camera) {
        (camera as any).aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Update renderer size
      gl.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Initial size setup
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [gl, camera]);

  // Dynamic per-region LOD: update detail for each region based on camera distance
  useFrame(() => {
    const newRegionDetails = faceCenters.map((center) => {
      const worldCenter = center.clone();
      const distance = camera.position.distanceTo(worldCenter);
      if (distance < 4) return 6;
      if (distance < 8) return 4;
      if (distance < 14) return 2;
      return 1;
    });
    // Only update if changed
    if (JSON.stringify(lastRegionDetails.current) !== JSON.stringify(newRegionDetails)) {
      setRegionDetails(newRegionDetails);
      lastRegionDetails.current = newRegionDetails;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Octahedron with per-region dynamic LOD */}
      <Octahedron regionDetails={regionDetails} />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        autoRotate={false}
        target={[0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.25} // Higher value for less smoothing
      />
    </>
  );
}
