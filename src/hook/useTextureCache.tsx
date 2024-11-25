import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TextureMetadata {
   texture: THREE.Texture;
   lastUsed: number;
   refCount: number;
   position: THREE.Vector3;
   level: number;
   status: 'active' | 'inactive' | 'disposed';
}

class AdvancedTextureManager {
   private cache: Map<string, TextureMetadata>;
   private maxActiveTextures: number;
   private disposalTimeout: number;
   private checkInterval: number;
   private currentViewport: THREE.Vector3;
   private viewportRadius: number;
   private disposalQueue: Set<string>;
   private intervalId: number | null;

   constructor({
      maxActiveTextures = 200,
      disposalTimeout = 10000, // 10 seconds
      checkInterval = 5000, // 5 seconds
      viewportRadius = 20, // Viewport radius to keep textures
   }) {
      this.cache = new Map();
      this.maxActiveTextures = maxActiveTextures;
      this.disposalTimeout = disposalTimeout;
      this.checkInterval = checkInterval;
      this.currentViewport = new THREE.Vector3();
      this.viewportRadius = viewportRadius;
      this.disposalQueue = new Set();
      this.intervalId = null;

      this.startDisposalCheck();
   }

   private startDisposalCheck() {
      if (this.intervalId !== null) return;

      this.intervalId = window.setInterval(() => {
         this.processDisposalQueue();
         this.checkInactiveTextures();
      }, this.checkInterval);
   }

   updateViewport(position: THREE.Vector3) {
      this.currentViewport.copy(position);
      this.reevaluateTextureStatuses();
   }

   private isInViewportRange(position: THREE.Vector3): boolean {
      return position.distanceTo(this.currentViewport) <= this.viewportRadius;
   }

   private reevaluateTextureStatuses() {
      for (const [url, metadata] of this.cache.entries()) {
         if (metadata.status === 'disposed') continue;

         const isNearViewport = this.isInViewportRange(metadata.position);
         if (isNearViewport && metadata.status === 'inactive') {
            metadata.status = 'active';
            this.disposalQueue.delete(url);
         } else if (!isNearViewport && metadata.status === 'active') {
            metadata.status = 'inactive';
            this.queueForDisposal(url);
         }
      }
   }

   private queueForDisposal(url: string) {
      const metadata = this.cache.get(url);
      if (!metadata || metadata.refCount > 0) return;

      this.disposalQueue.add(url);
      // Schedule actual disposal after timeout
      setTimeout(() => {
         if (this.disposalQueue.has(url)) {
            this.softDispose(url);
         }
      }, this.disposalTimeout);
   }

   private processDisposalQueue() {
      const now = Date.now();
      const activeCount = [...this.cache.values()].filter((m) => m.status === 'active').length;

      if (activeCount > this.maxActiveTextures) {
         // Sort by last used time and distance from viewport
         const sortedTextures = [...this.cache.entries()]
            .filter(([, m]) => m.status === 'active')
            .sort(([, a], [, b]) => {
               const aDistance = a.position.distanceTo(this.currentViewport);
               const bDistance = b.position.distanceTo(this.currentViewport);
               const timeWeight = 0.3;
               const distanceWeight = 0.7;

               const aScore = timeWeight * (now - a.lastUsed) + distanceWeight * aDistance;
               const bScore = timeWeight * (now - b.lastUsed) + distanceWeight * bDistance;

               return bScore - aScore;
            });

         const excessCount = activeCount - this.maxActiveTextures;
         for (let i = 0; i < excessCount; i++) {
            const [url] = sortedTextures[i];
            this.queueForDisposal(url);
         }
      }
   }

   private checkInactiveTextures() {
      const now = Date.now();
      for (const [url, metadata] of this.cache.entries()) {
         if (
            metadata.status === 'inactive' &&
            now - metadata.lastUsed > this.disposalTimeout &&
            metadata.refCount <= 0
         ) {
            this.softDispose(url);
         }
      }
   }

   private softDispose(url: string) {
      const metadata = this.cache.get(url);
      if (!metadata || metadata.refCount > 0) return;

      // Keep the texture in memory but mark as disposed
      metadata.status = 'disposed';
      this.disposalQueue.delete(url);
   }

   private hardDispose(url: string) {
      const metadata = this.cache.get(url);
      if (!metadata) return;

      metadata.texture.dispose();
      this.cache.delete(url);
      this.disposalQueue.delete(url);
   }

   async getTexture(
      url: string,
      loader: THREE.TextureLoader,
      position: THREE.Vector3,
      level: number,
   ): Promise<THREE.Texture> {
      const cached = this.cache.get(url);

      if (cached) {
         if (cached.status === 'disposed') {
            // Reactivate disposed texture
            cached.status = 'active';
            cached.lastUsed = Date.now();
            cached.refCount++;
            cached.position.copy(position);
            cached.level = level;
            return cached.texture;
         }

         cached.lastUsed = Date.now();
         cached.refCount++;
         cached.position.copy(position);
         cached.level = level;
         return cached.texture;
      }

      const texture = await this.loadTexture(url, loader);
      const isNearViewport = this.isInViewportRange(position);

      this.cache.set(url, {
         texture,
         lastUsed: Date.now(),
         refCount: 1,
         position: position.clone(),
         level,
         status: isNearViewport ? 'active' : 'inactive',
      });

      if (!isNearViewport) {
         this.queueForDisposal(url);
      }

      return texture;
   }

   private async loadTexture(url: string, loader: THREE.TextureLoader): Promise<THREE.Texture> {
      return new Promise((resolve, reject) => {
         loader.load(
            url,
            (texture) => {
               texture.colorSpace = THREE.SRGBColorSpace;
               resolve(texture);
            },
            undefined,
            reject,
         );
      });
   }

   releaseTexture(url: string) {
      const metadata = this.cache.get(url);
      if (!metadata) return;

      metadata.refCount--;
      if (metadata.refCount <= 0 && metadata.status === 'inactive') {
         this.queueForDisposal(url);
      }
   }

   clear() {
      this.cache.forEach((metadata, url) => {
         this.hardDispose(url);
      });
      if (this.intervalId !== null) {
         clearInterval(this.intervalId);
         this.intervalId = null;
      }
   }
   getStats() {
      const stats = {
         active: 0,
         inactive: 0,
         disposed: 0,
         total: this.cache.size,
      };

      for (const metadata of this.cache.values()) {
         stats[metadata.status]++;
      }

      return stats;
   }
}

// Custom hook để sử dụng AdvancedTextureManager
export const useAdvancedTextureManager = () => {
   const managerRef = useRef<AdvancedTextureManager>();

   if (!managerRef.current) {
      managerRef.current = new AdvancedTextureManager({
         maxActiveTextures: 100, // Điều chỉnh theo nhu cầu
         disposalTimeout: 5000, // 5 giây
         checkInterval: 5000, // 5 giây
         viewportRadius: 20, // Điều chỉnh theo scale của ứng dụng
      });
   }

   useEffect(() => {
      return () => {
         managerRef.current?.clear();
      };
   }, []);

   return managerRef.current;
};
