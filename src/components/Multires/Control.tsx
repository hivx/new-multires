'use client';
import React from 'react';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { debounce } from 'lodash';

const debouncedSetFov = debounce((fov: number, setFov: (args: { fov: number }) => void) => {
   setFov({ fov });
}, 100);

// Hàm xử lý sự kiện cuộn chuột
export const handleWheel = (
   event: React.WheelEvent<HTMLDivElement>,
   cameraRef: THREE.PerspectiveCamera,
   setFov: ({ fov }: { fov: number }) => void,
) => {
   const minFov = (window.innerHeight * 100) / (512 * 2 ** (3 - 2) * 0.9 * 2);
   if (cameraRef) {
      // Lấy camera từ ref và thay đổi fov
      const camera = cameraRef;
      const newFov = MathUtils.clamp(camera.fov + event.deltaY * 0.05, minFov, 100);
      camera.fov = newFov;

      // Gọi debounce để cập nhật fov
      debouncedSetFov(newFov, setFov);

      // Cập nhật lại ma trận chiếu của camera
      camera.updateProjectionMatrix();
   }
};

export const handleTouchStart = (
   event: React.TouchEvent<HTMLDivElement>,
   lastPinchDistanceRef: React.MutableRefObject<number | null>,
   setRotate: React.Dispatch<React.SetStateAction<boolean>>,
) => {
   if (event.touches.length === 2) {
      event.preventDefault();
      event.stopPropagation();
      setRotate(false);
      console.log(event);
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      lastPinchDistanceRef.current = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
   }
};

export const handleTouchMove = (
   event: React.TouchEvent<HTMLDivElement>,
   camera: THREE.PerspectiveCamera,
   setFov: ({ fov }: { fov: number }) => void,
   lastPinchDistanceRef: React.MutableRefObject<number | null>,
   // maxLevel: number,
) => {
   if (event.touches.length === 2) {
      event.preventDefault();
      event.stopPropagation();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentPinchDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);

      if (lastPinchDistanceRef.current !== null) {
         const pinchDelta = lastPinchDistanceRef.current - currentPinchDistance;

         const minFov = (window.innerHeight * 100) / (512 * 2 ** (3 - 2) * 0.9 * 2);
         const newFov = MathUtils.clamp(camera.fov + pinchDelta * 0.05, minFov, 100);

         camera.fov = newFov;
         setFov({ fov: newFov });
         camera.updateProjectionMatrix();
      }

      lastPinchDistanceRef.current = currentPinchDistance;
   }
};

export const handleTouchEnd = (
   lastPinchDistanceRef: React.MutableRefObject<number | null>,
   setRotate: React.Dispatch<React.SetStateAction<boolean>>,
) => {
   lastPinchDistanceRef.current = null;
   setRotate(true);
};
