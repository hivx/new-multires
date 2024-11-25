import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import useTileStore from '@/components/store/tileStore';

interface Face {
   name: string;
   position: [number, number, number];
   rotation: [number, number, number];
}

interface SideProps {
   level: number;
   imgId: string;
   faces: Face[];
}

interface TileProps {
   id: string;
   position: [number, number, number];
}

const Side = ({ faces, level, imgId }: SideProps) => {
   const { getVisibles } = useTileStore();
   const tileSize = 10 / level;

   const groupsRef = useRef<Record<string, THREE.Group>>({}); // Lưu trữ các nhóm theo face+level
   const abortControllersRef = useRef<Record<string, AbortController>>({});
   const controller = useMemo(() => new AbortController(), []);
   const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

   function createTile(tile: TileProps, face: string, name: string) {
      const [row, col] = tile.id.split('-').slice(1);
      const url = `/textures/${imgId}/${face}/${level - 1}/${row}${col}.webp`;

      abortControllersRef.current[name] = controller;

      const texture = textureLoader.load(url, undefined, undefined, (error) => {
         if (error instanceof Error && error.message === 'AbortError') {
            console.log(`Texture load aborted for ${name}`);
         }
      });
      texture.userData.controller = controller;
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(tileSize, tileSize);

      const material = new THREE.MeshBasicMaterial({
         map: texture,
         depthTest: false,
         transparent: true,
         opacity: 1,
         side: THREE.BackSide,
      });
      const tileMesh = new THREE.Mesh(geometry, material);
      tileMesh.name = name;
      tileMesh.position.set(...tile.position);
      return tileMesh;
   }

   function createSide(
      face: string,
      tiles: TileProps[],
      position: [number, number, number],
      rotation: [number, number, number],
   ) {
      const group = new THREE.Group();
      group.position.set(...position);
      group.rotation.set(...rotation);
      group.scale.set(-1, 1, 1);
      group.renderOrder = level + 1;
      group.name = `${face}-${level}`;
      tiles.forEach((tile) => {
         const name = `${face}-${tile.id}-${level}`;
         group.add(createTile(tile, face, name));
      });
      return group;
   }

   function updateSide(group: THREE.Group, face: string, tiles: TileProps[]) {
      const newTileNames = tiles.map((tile) => `${face}-${tile.id}-${level}`);

      // Thêm các tile mới
      tiles.forEach((tile) => {
         const name = `${face}-${tile.id}-${level}`;
         if (!group.getObjectByName(name)) {
            group.add(createTile(tile, face, name));
         }
      });

      // Loại bỏ các tile không còn trong visibleTiles
      for (let i = group.children.length - 1; i >= 0; i--) {
         const child = group.children[i];
         if (!newTileNames.includes(child.name)) {
            const tile = child as THREE.Mesh;
            const material = tile.material as THREE.MeshBasicMaterial;
            const texture = material.map as THREE.Texture;

            // Hủy tải texture nếu nó đang tải
            const controller = abortControllersRef.current[child.name];
            if (controller) {
               controller.abort();
               delete abortControllersRef.current[child.name];
            }

            tile.geometry.dispose();
            material.dispose();
            texture.dispose();
            group.remove(tile);
         }
      }
   }

   function deleteSide(face: string, levelToDelete: number) {
      const groupKey = `${face}-${levelToDelete}`;
      const group = groupsRef.current[groupKey];
      if (group) {
         group.children.forEach((tile) => {
            const mesh = tile as THREE.Mesh;
            const material = mesh.material as THREE.MeshBasicMaterial;
            const texture = material.map as THREE.Texture;
            // Hủy tải texture nếu nó đang tải
            const controller = abortControllersRef.current[mesh.name];
            if (controller) {
               controller.abort();
               delete abortControllersRef.current[mesh.name];
            }

            mesh.geometry.dispose();
            material.dispose();
            texture.dispose();
         });
         delete groupsRef.current[groupKey];
      }
   }

   useEffect(() => {
      const currentKeys = new Set();

      faces.forEach(({ name: face, position, rotation }) => {
         const visibleTiles = getVisibles(level, face);
         const groupKey = `${face}-${level}`;
         // console.log(`${face}`, visibleTiles);
         currentKeys.add(groupKey);

         // Tạo hoặc cập nhật group theo face và level
         if (!groupsRef.current[groupKey]) {
            const newGroup = createSide(face, visibleTiles, position, rotation);
            groupsRef.current[groupKey] = newGroup;
         } else {
            updateSide(groupsRef.current[groupKey], face, visibleTiles);
         }
      });

      // Xóa các group không còn cần thiết
      Object.keys(groupsRef.current).forEach((key) => {
         if (!currentKeys.has(key)) {
            const [face, lvl] = key.split('-');
            const levelKey = parseInt(lvl, 10);
            deleteSide(face, levelKey);
         }
      });

      return () => {
         // eslint-disable-next-line react-hooks/exhaustive-deps
         Object.values(abortControllersRef.current).forEach((controller) => {
            controller.abort();
         });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [faces, level]);

   return (
      <>
         {Object.values(groupsRef.current).map((group) => (
            <primitive key={group.name} object={group} />
         ))}
      </>
   );
};

export default Side;
