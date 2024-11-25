// const Side = ({ face, position, rotation, level, id }: CubeFaceProps) => {
//     const { getVisibles } = useTileStore();
//     const cellVisible = getVisibles(level, face);
//     const textureManager = useAdvancedTextureManager();
//     const cameraPosition = useThree((state) => state.camera.position);

//     const planeGeo = useMemo(() => new THREE.PlaneGeometry(10, 10), []);
//     const loader = useMemo(() => new THREE.TextureLoader(), []);

//     const levelGroupsRef = useRef<{ [key: number]: THREE.Group }>({});
//     const [currentLevel, setCurrentLevel] = useState<number>(level);

//     // Update viewport position whenever camera moves
//     useEffect(() => {
//        textureManager.updateViewport(cameraPosition);
//     }, [cameraPosition, textureManager]);

//     useEffect(() => {
//        if (!levelGroupsRef.current[level]) {
//           levelGroupsRef.current[level] = new THREE.Group();
//        }
//        const group = levelGroupsRef.current[level];

//        const newVisibleIds = new Set(cellVisible.map((cell) => cell.id));
//        const textureUrls = new Set<string>();

//        // Handle removed cells
//        group.children.forEach((child) => {
//           if (!newVisibleIds.has(child.name)) {
//              const tile = child as THREE.Mesh;
//              const material = tile.material as THREE.MeshBasicMaterial;
//              const url = (material.map as THREE.Texture).source.data?.src;
//              if (url) {
//                 textureManager.releaseTexture(url);
//              }
//              tile.geometry.dispose();
//              material.dispose();
//              group.remove(tile);
//           }
//        });

//        // Create and add new cells
//        const loadCells = async () => {
//           for (const cell of cellVisible) {
//              if (group.getObjectByName(cell.id)) continue;

//              const [face, row, col] = cell.id.split('-');

//              const url = /textures/${id}/${face}/${level - 1}/${row}${col}.jpg;
//              textureUrls.add(url);

//              try {
//                 // Convert cell position to world space for distance calculations
//                 const worldPos = new THREE.Vector3(...cell.position)
//                    .applyMatrix4(new THREE.Matrix4().makeScale(1 / level, 1 / level, 1))
//                    .add(new THREE.Vector3(...position));

//                 const texture = await textureManager.getTexture(url, loader, worldPos, level);

//                 const material = new THREE.MeshBasicMaterial({
//                    map: texture,
//                    side: THREE.DoubleSide,
//                    opacity: 1,
//                    depthTest: false,
//                    transparent: true,
//                 });

//                 const cellMesh = new THREE.Mesh(planeGeo, material);
//                 cellMesh.name = cell.id;
//                 cellMesh.renderOrder = 1 + level;

//                 const cellMatrix = new THREE.Matrix4()
//                    .makeTranslation(...cell.position)
//                    .multiply(new THREE.Matrix4().makeScale(1 / level, 1 / level, 1));

//                 cellMesh.applyMatrix4(cellMatrix);
//                 group.add(cellMesh);
//              } catch (error) {
//                 console.error(Failed to load texture for cell ${cell.id}:, error);
//              }
//           }
//        };

//        loadCells();

//        // Cleanup when level changes
//        if (currentLevel !== level) {
//           Object.keys(levelGroupsRef.current).forEach((lvl) => {
//              const lvlInt = parseInt(lvl);
//              if (lvlInt !== level) {
//                 const oldGroup = levelGroupsRef.current[lvlInt];
//                 if (oldGroup) {
//                    oldGroup.children.forEach((child) => {
//                       const tile = child as THREE.Mesh;
//                       const material = tile.material as THREE.MeshBasicMaterial;
//                       const url = (material.map as THREE.Texture).source.data?.src;
//                       if (url) {
//                          textureManager.releaseTexture(url);
//                       }
//                       tile.geometry.dispose();
//                       material.dispose();
//                    });
//                    delete levelGroupsRef.current[lvlInt];
//                 }
//              }
//           });
//           setCurrentLevel(level);
//        }

//        return () => {
//           // Cleanup effect
//           textureUrls.forEach((url) => {
//              textureManager.releaseTexture(url);
//           });
//        };
//        // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [cellVisible, level, position, textureManager]);

//     return (
//        <group position={position} rotation={rotation} scale={[-1, 1, 1]}>
//           {Object.values(levelGroupsRef.current).map((group, index) => (
//              <primitive object={group} key={level-group-${index}} />
//           ))}
//        </group>
//     );
//  };
