import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type OwnedMaterial } from '../types';

interface OwnedMaterialsState {
  ownedMaterials: OwnedMaterial[];
  addOwnedMaterial: (material: OwnedMaterial) => void;
  updateOwnedMaterial: (itemName: string, newQuantity: number) => void;
  removeOwnedMaterial: (itemName: string) => void;
  clearOwnedMaterials: () => void;
}

export const useOwnedMaterialsStore = create<OwnedMaterialsState>()(
  persist(
    (set, get) => ({
      ownedMaterials: [],
      addOwnedMaterial: (material) => {
        set((state) => {
          const existingIndex = state.ownedMaterials.findIndex(
            (m) => m.itemName === material.itemName,
          );
          if (existingIndex > -1) {
            // Update existing material quantity
            const updatedMaterials = [...state.ownedMaterials];
            updatedMaterials[existingIndex] = {
              ...updatedMaterials[existingIndex],
              quantity: updatedMaterials[existingIndex].quantity + material.quantity,
            };
            return { ownedMaterials: updatedMaterials };
          } else {
            // Add new material
            return { ownedMaterials: [...state.ownedMaterials, material] };
          }
        });
      },
      updateOwnedMaterial: (itemName, newQuantity) => {
        set((state) => ({
          ownedMaterials: state.ownedMaterials.map((material) =>
            material.itemName === itemName
              ? { ...material, quantity: newQuantity }
              : material,
          ),
        }));
      },
      removeOwnedMaterial: (itemName) => {
        set((state) => ({
          ownedMaterials: state.ownedMaterials.filter(
            (material) => material.itemName !== itemName,
          ),
        }));
      },
      clearOwnedMaterials: () => set({ ownedMaterials: [] }),
    }),
    {
      name: 'owned-materials-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
