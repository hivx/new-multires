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
   const [id, setId] = useState<string>('10b5143d8c4bf53aefb2429b7d9d9f775')
   // const id = '10b5143d8c4bf53aefb2429b7d9d9f775';

   const { setFov, getFov } = useTileStore();

   const [width, height] = useWindowSize();

   const isMobile = width < 768;

   const maxLevel = isMobile ? 5 : 7;

   // Danh sách ID của 10 hình ảnh
   const imageIds = [
      '88550ede3997bc8d77f34f1fc3a8cb88',
      '10b5143d8c4bf53aefb2429b7d9d9f775',
      '9757d43b9cc6368c1fd726da254ce659',
      'f42867a10f9ee9e2cb7772729c3a72f7f',
      'fa3dd910e268b8956045f241eeecfe81d',
      '92f10b96d897e5df071e19db83f10adcf0',
      '9f37aec818ff1062c6c0a975196fd7d38',
      'b9a7aaff108254106969bbff3d87cfb1090',
      'bd543b628e8c864f91866e48a09482af',
      'd59776b74d2cf4ce72495c9901056a645',
   ];

   // Hàm xử lý khi click vào icon
   const handleIconClick = () => {
      const randomIndex = Math.floor(Math.random() * imageIds.length); // Chọn ngẫu nhiên chỉ số từ mảng
      const newId = imageIds[randomIndex]; // Lấy ID từ chỉ số ngẫu nhiên
      setId(newId); // Cập nhật ID mới
   };

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
            <Cube id={id} onIconClick={handleIconClick} />
         </Canvas>
      </Suspense>
   );
}
