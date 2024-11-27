import create from 'zustand';

interface Cell {
   id: string; // ID của ô
   position: [number, number, number]; // Vị trí tương ứng
}

interface useVisibilityProps {
   positionsLevel: { [key: number]: [number, number, number][] };
   setPositions: (level: number) => void;
   getPositions: (level: number) => [number, number, number][];
   visibleTiles: Record<number, Record<string, Cell[]>>; // Lưu các ô hiển thị theo mặt
   setVisibles: (level: number, tiles: Record<string, Cell[]>) => void;
   getVisibles: (level: number, face: string) => Cell[];
   fov: number;
   setFov: ({ fov }: { fov: number }) => void;
   getFov: () => number;
}

const useTileStore = create<useVisibilityProps>((set, get) => ({
   positionsLevel: {}, // Lưu danh sách positions theo level
   visibleTiles: {}, // Lưu danh sách các ô hiển thị theo mặt
   fov: 70,
   setFov: ({ fov }: { fov: number }) => set({ fov }),

   // Hàm để tạo và lưu positions cho một level cụ thể
   setPositions: (level: number) => {
      const cellSize = 10 / level;
      const newPositions: [number, number, number][] = [];
      for (let col = 0; col < level; col++) {
         for (let row = 0; row < level; row++) {
            const x = (col - level / 2 + 0.5) * cellSize;
            const y = (level / 2 - row - 0.5) * cellSize;
            newPositions.push([x, y, 0]); // Vị trí tương đối
         }
      }
      set((state) => ({
         positionsLevel: {
            ...state.positionsLevel,
            [level]: newPositions, // Lưu danh sách positions theo level
         },
      }));
   },
   // Hàm để lấy positions cho một level
   getPositions: (level: number) => {
      return get().positionsLevel[level] || [];
   },
   setVisibles: (level: number, tiles: Record<string, Cell[]>) => {
      set((state) => ({
         visibleTiles: {
            ...state.visibleTiles,
            [level]: tiles,
         },
      }));
   },
   getVisibles: (level: number, face: string) => {
      return get().visibleTiles[level]?.[face] || [];
   },
   getFov: () => get().fov,
}));

export default useTileStore;
