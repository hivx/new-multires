import React, { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useWindowSize } from '@react-hook/window-size';
import Cube from './Cube';
import { handleWheel, handleTouchMove, handleTouchStart, handleTouchEnd } from './Control';
import useTileStore from '../store/tileStore';

export default function Cube360Viewer() {
   const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
   const lastPinchDistanceRef = useRef<number | null>(null);
   const [rotate, setRotate] = useState<boolean>(true);
   const id = '10b5143d8c4bf53aefb2429b7d9d9f775';

   const { setFov, getFov } = useTileStore();

   const [width, height] = useWindowSize();

   const isMobile = width < 768;

   const maxLevel = isMobile ? 5 : 7;

   return (
      <Suspense fallback={null}>
         <Canvas
            className="h-full w-full"
            onWheel={(event) => handleWheel(event, cameraRef.current, setFov, maxLevel)}
            onTouchMove={(event) => handleTouchMove(event, cameraRef.current, setFov, lastPinchDistanceRef, maxLevel)}
            onTouchStart={(event) => handleTouchStart(event, lastPinchDistanceRef, setRotate)}
            onTouchEnd={() => handleTouchEnd(lastPinchDistanceRef, setRotate)}
         >
            <PerspectiveCamera
               ref={cameraRef}
               makeDefault
               fov={getFov()}
               near={1}
               far={1000}
               position={[0, 0, 0.1]}
               aspect={width / height}
            />
            <OrbitControls
               enableZoom={false}
               enablePan={false}
               enableDamping={true}
               dampingFactor={0.2}
               enableRotate={rotate}
               rotateSpeed={isMobile ? -0.5 : -0.4}
               autoRotate={false}
            />
            <Cube id={id} />
         </Canvas>
      </Suspense>
   );
}