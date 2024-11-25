import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { memo, useMemo } from 'react';

interface Face {
   position: [number, number, number];
   rotation: [number, number, number];
}

interface BaseTextureProps {
   id: string;
   faces: Face[];
}

const BaseTexture = ({ id, faces }: BaseTextureProps) => {
   const textures = useLoader(THREE.TextureLoader, [
      `/textures/${id}/px/0/00.webp`,
      `/textures/${id}/nx/0/00.webp`,
      `/textures/${id}/py/0/00.webp`,
      `/textures/${id}/ny/0/00.webp`,
      `/textures/${id}/pz/0/00.webp`,
      `/textures/${id}/nz/0/00.webp`,
   ]);

   const planeGeo = useMemo(() => new THREE.PlaneGeometry(10, 10), []);

   return (
      <group>
         {faces.map((face, index) => (
            <mesh key={index} geometry={planeGeo} position={face.position} scale={[-1, 1, 1]} rotation={face.rotation}>
               <meshBasicMaterial map={textures[index]} side={THREE.BackSide} />
            </mesh>
         ))}
      </group>
   );
};

export default memo(BaseTexture);
