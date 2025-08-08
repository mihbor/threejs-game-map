import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import Octahedron from "./Octahedron.tsx";

export default function OctahedronScene() {
  const { gl, camera } = useThree();
  const [lodDetail, setLodDetail] = useState(2); // Start with low detail
  const lastLodRef = useRef(lodDetail);

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

  // Dynamic LOD: update detail based on camera distance
  useFrame(() => {
    const distance = camera.position.length(); // Distance from origin
    let newDetail = 1;
    if (distance < 4) newDetail = 6;
    else if (distance < 8) newDetail = 4;
    else if (distance < 14) newDetail = 2;
    else newDetail = 1;
    if (lastLodRef.current !== newDetail) {
      setLodDetail(newDetail);
      lastLodRef.current = newDetail;
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

      {/* Octahedron with dynamic LOD */}
      <Octahedron detail={lodDetail} />

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
