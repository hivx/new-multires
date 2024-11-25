// import * as THREE from 'three';

// interface TileProps {
//    id: string;
//    position: [number, number, number];
// }

// function createSide(
//    face: string,
//    tiles: TileProps[],
//    position: [number, number, number],
//    rotation: [number, number, number],
//    level: number,
// ) {
//    const group = new THREE.Group();
//    group.position.set(...position);
//    group.rotation.set(...rotation);
//    group.scale.set(-1, 1, 1);
//    group.renderOrder = level + 1;
//    group.name = `${face}-${level}`;
//    tiles.forEach((tile) => {
//       const name = `${face}-${tile.id}-${level}`;
//       group.add(createTile(tile, face, name));
//    });
//    return group;
// }

// function updateSide(group: THREE.Group, face: string, tiles: TileProps[], level: number) {
//    const newTileNames = tiles.map((tile) => `${face}-${tile.id}-${level}`);

//    // Thêm các tile mới
//    tiles.forEach((tile) => {
//       const name = `${face}-${tile.id}-${level}`;
//       if (!group.getObjectByName(name)) {
//          group.add(createTile(tile, face, name));
//       }
//    });

//    // Loại bỏ các tile không còn trong visibleTiles
//    for (let i = group.children.length - 1; i >= 0; i--) {
//       const child = group.children[i];
//       if (!newTileNames.includes(child.name)) {
//          const tile = child as THREE.Mesh;
//          const material = tile.material as THREE.MeshBasicMaterial;
//          const texture = material.map as THREE.Texture;

//          // Hủy tải texture nếu nó đang tải
//          const controller = abortControllersRef.current[child.name];
//          if (controller) {
//             controller.abort();
//             delete abortControllersRef.current[child.name];
//          }

//          tile.geometry.dispose();
//          material.dispose();
//          texture.dispose();
//          group.remove(tile);
//       }
//    }
// }

// function deleteSide(face: string, levelToDelete: number) {
//    const groupKey = `${face}-${levelToDelete}`;
//    const group = groupsRef.current[groupKey];
//    if (group) {
//       group.children.forEach((tile) => {
//          const mesh = tile as THREE.Mesh;
//          const material = mesh.material as THREE.MeshBasicMaterial;
//          const texture = material.map as THREE.Texture;
//          // Hủy tải texture nếu nó đang tải
//          const controller = abortControllersRef.current[mesh.name];
//          if (controller) {
//             controller.abort();
//             delete abortControllersRef.current[mesh.name];
//          }

//          mesh.geometry.dispose();
//          material.dispose();
//          texture.dispose();
//       });
//       delete groupsRef.current[groupKey];
//    }
// }

// export { createSide, updateSide, deleteSide };
