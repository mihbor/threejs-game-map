import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import "@fontsource/inter";
import OctahedronScene from "./components/OctahedronScene";

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{
          position: [5, 5, 5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={["#111111"]} />
        
        <Suspense fallback={null}>
          <OctahedronScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
