import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import Octahedron from "./Octahedron";

export default function OctahedronScene() {
  const { gl, camera } = useThree();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update camera aspect ratio
      if ('aspect' in camera) {
        (camera as any).aspect = width / height;
        camera.updateProjectionMatrix();
      }
      
      // Update renderer size
      gl.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size setup
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [gl, camera]);

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
      
      {/* Additional directional light for better illumination */}
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.5}
      />

      {/* Octahedron */}
      <Octahedron />

      {/* Camera Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />

      {/* Optional: Add a grid helper for reference */}
      <gridHelper args={[10, 10, '#444444', '#222222']} position={[0, -2, 0]} />
    </>
  );
}
