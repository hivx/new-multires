import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import Side from './common/Multires';
import BaseTexture from './common/BaseTexture';
import useTileStore from '../store/tileStore';

interface Face {
   name: string;
   position: [number, number, number];
   rotation: [number, number, number];
}

interface Cell {
   id: string; // ID của ô
   position: [number, number, number]; // Vị trí tương ứng
}

const Cube = ({ id }: { id: string }) => {
   const faces: Face[] = [
      { name: 'px', position: [-5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
      { name: 'nx', position: [5, 0, 0], rotation: [0, Math.PI / 2, 0] },
      { name: 'py', position: [0, 5, 0], rotation: [-Math.PI / 2, 0, 0] },
      { name: 'ny', position: [0, -5, 0], rotation: [Math.PI / 2, 0, 0] },
      { name: 'pz', position: [0, 0, 5], rotation: [0, 0, 0] },
      { name: 'nz', position: [0, 0, -5], rotation: [0, Math.PI, 0] },
   ];
   const { camera } = useThree();

   const [level, setLevelNumber] = useState<number>(1);
   const [visibleFaces, setVisibleFaces] = useState<Face[]>([]);
   const { getFov, setPositions, getPositions, setVisibles } = useTileStore();
   const [onMove, setOnMove] = useState<boolean>(false);
   const fov = getFov();
   const cellVector = new THREE.Vector3();

   const createdLevelsRef = useRef(new Set([1])); // Level 1 mặc định đã được tạo
   const previousLevelRef = useRef(1);

   // Hàm tạo `faceMatrix` cho mỗi mặt từ `position` và `rotation`
   const computeFaceMatrix = (position: [number, number, number], rotation: [number, number, number]) => {
      const matrix = new THREE.Matrix4();
      matrix.makeTranslation(...position);
      matrix.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));
      matrix.multiply(new THREE.Matrix4().makeScale(-1, 1, 1));
      return matrix;
   };

   const checkVisibleTiles = (level: number) => {
      const relativePositions = getPositions(level);

      if (relativePositions.length === 0) {
         return;
      }

      const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const frustum = new THREE.Frustum();
      frustum.setFromProjectionMatrix(matrix);

      const cellSize = 10 / level;
      const visibleFaces: Face[] = []; // Lưu các mặt visible
      const visibleCellsPerFace: Record<string, Cell[]> = {}; // Lưu danh sách theo từng mặt

      faces.forEach((face) => {
         const faceMatrix = computeFaceMatrix(face.position, face.rotation);

         // Tạo các góc của bounding box cho mặt này
         const halfSize = 5; // Kích thước nửa cạnh của mỗi mặt (10 / 2)
         const corners = [
            new THREE.Vector3(-halfSize, -halfSize, 0).applyMatrix4(faceMatrix),
            new THREE.Vector3(halfSize, -halfSize, 0).applyMatrix4(faceMatrix),
            new THREE.Vector3(-halfSize, halfSize, 0).applyMatrix4(faceMatrix),
            new THREE.Vector3(halfSize, halfSize, 0).applyMatrix4(faceMatrix),
         ];

         // Tạo bounding box dựa trên các góc
         const faceBoundingBox = new THREE.Box3().setFromPoints(corners);

         // Kiểm tra nếu face nằm trong frustum
         if (frustum.intersectsBox(faceBoundingBox)) {
            visibleFaces.push(face); // Thêm mặt này vào danh sách visible
         }
      });

      // Lưu visible faces vào state
      setVisibleFaces(visibleFaces);

      visibleFaces.forEach((face) => {
         const faceMatrix = computeFaceMatrix(face.position, face.rotation);

         const visibleCells: Cell[] = []; // Lưu các ô hiển thị cho mặt này
         relativePositions.forEach((pos, index) => {
            const transformedPosition = cellVector.set(...pos).applyMatrix4(faceMatrix);
            const boundingBox = new THREE.Box3().setFromCenterAndSize(
               transformedPosition,
               new THREE.Vector3(cellSize, cellSize, cellSize),
            );

            if (frustum.intersectsBox(boundingBox)) {
               const row = Math.floor(index / level);
               const col = index % level;
               visibleCells.push({
                  id: `${face.name}-${col}-${row}`, // ID của ô
                  position: pos, // Lưu vị trí
               });
            }
         });
         // Lưu các ô hiển thị cho mặt này vào đối tượng
         if (visibleCells.length > 0) {
            visibleCellsPerFace[face.name] = visibleCells;
         }
      });
      setVisibles(level, visibleCellsPerFace);
   };

   useEffect(() => {
      const updateLevel = () => {
         let newLevelNumber = level;

         // Cập nhật minFov và maxFov dựa trên cấp độ hiện tại
         const calculateFovBounds = (level: number) => ({
            minFov: (window.innerHeight * 100) / (512 * 2 ** (level - 2) * 0.9 * 2),
            maxFov: (window.innerHeight * 100) / (512 * 2 ** (level - 3) * 0.9 * 2),
         });

         const { minFov, maxFov } = calculateFovBounds(level);

         // Kiểm tra điều kiện để thay đổi cấp độ
         if (fov < minFov) {
            newLevelNumber = level + 1;
         } else if (fov > maxFov) {
            newLevelNumber = level - 1;
         }

         return { newLevelNumber, bounds: calculateFovBounds(newLevelNumber) };
      };

      const { newLevelNumber, bounds } = updateLevel();
      const { minFov, maxFov } = bounds;

      // Chỉ thực hiện logic khi có sự thay đổi cấp độ
      if (newLevelNumber !== previousLevelRef.current) {
         previousLevelRef.current = newLevelNumber;

         // Đặt cấp độ mới
         setLevelNumber(newLevelNumber);

         // Trì hoãn việc tải texture cho đến khi đạt cấp độ cuối cùng
         if (fov >= minFov && fov <= maxFov) {
            // Kiểm tra và khởi tạo dữ liệu cho cấp độ cuối cùng
            if (!createdLevelsRef.current.has(newLevelNumber)) {
               setPositions(newLevelNumber); // Chuẩn bị các vị trí mới
               console.log('Create level', newLevelNumber);
               createdLevelsRef.current.add(newLevelNumber); // Đánh dấu cấp độ đã tạo
            }
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [fov, level]);

   useEffect(() => {
      // Kiểm tra các tile hiển thị
      checkVisibleTiles(level);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [level]);

   const checkMove = () => {
      if (onMove) {
         checkVisibleTiles(level);
      }
   };

   return (
      <group onPointerDown={() => setOnMove(true)} onPointerMove={checkMove} onPointerUp={() => setOnMove(false)}>
         <BaseTexture id={id} faces={faces} />
         {level > 1 && <Side faces={visibleFaces} imgId={id} level={level} />}
      </group>
   );
};

export default Cube;