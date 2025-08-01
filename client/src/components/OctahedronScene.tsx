import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Octahedron from "./Octahedron";

export default function OctahedronScene() {
  const { gl, camera } = useThree();
  const fakeCameraRef = useRef<THREE.PerspectiveCamera>();

  // Create fake camera for orbit controls
  useEffect(() => {
    const fakeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    fakeCamera.position.set(5, 5, 5);
    fakeCameraRef.current = fakeCamera;
  }, []);

  // Update real camera position based on fake camera with 20-degree upward offset
  useFrame(() => {
    if (fakeCameraRef.current && camera) {
      // Get the fake camera's direction
      const direction = new THREE.Vector3();
      fakeCameraRef.current.getWorldDirection(direction);
      
      // Apply 20-degree upward rotation
      const upRotation = THREE.MathUtils.degToRad(20);
      direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), upRotation);
      
      // Position real camera at fake camera's position
      camera.position.copy(fakeCameraRef.current.position);
      
      // Look in the adjusted direction
      const target = camera.position.clone().add(direction);
      camera.lookAt(target);
    }
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update both cameras' aspect ratio
      if ("aspect" in camera) {
        (camera as any).aspect = width / height;
        camera.updateProjectionMatrix();
      }
      
      if (fakeCameraRef.current) {
        fakeCameraRef.current.aspect = width / height;
        fakeCameraRef.current.updateProjectionMatrix();
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
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Octahedron */}
      <Octahedron />

      {/* Camera Controls using fake camera */}
      {fakeCameraRef.current && (
        <OrbitControls
          camera={fakeCameraRef.current}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          autoRotate={false}
          autoRotateSpeed={0.5}
          target={[0, 0, 0]}
        />
      )}

      {/* Optional: Add a grid helper for reference */}
      <gridHelper args={[10, 10, "#444444", "#222222"]} position={[0, -2, 0]} />
    </>
  );
}
