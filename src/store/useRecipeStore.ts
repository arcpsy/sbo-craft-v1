// src/store/useRecipeStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '../types';

// Define the state shape for our recipe store
interface RecipeState {
  recipes: Recipe[];
  selectedRecipeIds: Set<string>; // This local state in the store is fine for its own internal logic
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (itemName: string, updatedRecipe: Recipe) => void;
  deleteRecipe: (itemName: string) => void;
  setRecipes: (recipes: Recipe[]) => void;
  toggleRecipeSelection: (itemName: string) => void;
  clearRecipeSelection: () => void;
  // ✅ FIX: Change deleteSelectedRecipes to accept an array of itemNames
  deleteSelectedRecipes: (itemNames: string[]) => void;
  selectAllRecipes: () => void;
}

// Create the Zustand store
export const useRecipeStore = create<RecipeState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        recipes: [],
        selectedRecipeIds: new Set<string>(),

        // Actions
        addRecipe: (recipe) =>
          set((state) => {
            return { recipes: [...state.recipes, recipe] };
          }),

        updateRecipe: (itemName, updatedRecipe) =>
          set((state) => ({
            recipes: state.recipes.map((r) =>
              r.itemName === itemName ? updatedRecipe : r,
            ),
          })),

        deleteRecipe: (itemName) =>
          set((state) => ({
            recipes: state.recipes.filter((r) => r.itemName !== itemName),
            selectedRecipeIds: new Set(
              Array.from(state.selectedRecipeIds).filter(
                (id) => id !== itemName,
              ),
            ),
          })),

        setRecipes: (recipes) =>
          set(() => ({
            recipes: recipes,
            selectedRecipeIds: new Set<string>(),
          })),

        toggleRecipeSelection: (itemName) =>
          set((state) => {
            const newSelection = new Set(state.selectedRecipeIds);
            if (newSelection.has(itemName)) {
              newSelection.delete(itemName);
            } else {
              newSelection.add(itemName);
            }
            return { selectedRecipeIds: newSelection };
          }),

        clearRecipeSelection: () =>
          set(() => ({
            selectedRecipeIds: new Set<string>(),
          })),

        // ✅ FIX: Implement deleteSelectedRecipes to use the passed itemNames
        deleteSelectedRecipes: (itemNamesToDelete: string[]) =>
          set((state) => ({
            recipes: state.recipes.filter(
              // Keep recipes whose names are NOT in the list of names to delete
              (recipe) => !itemNamesToDelete.includes(recipe.itemName),
            ),
            // Clear selection in the store's internal state as well
            selectedRecipeIds: new Set<string>(),
          })),

        selectAllRecipes: () =>
          set((state) => ({
            selectedRecipeIds: new Set(
              state.recipes.map((recipe) => recipe.itemName),
            ),
          })),
      }),
      {
        name: 'crafting-tree-recipes-storage',
        storage: createJSONStorage(() => localStorage, {
          replacer: (_key, value) => {
            if (value instanceof Set) {
              return Array.from(value);
            }
            return value;
          },
          reviver: (key, value) => {
            if (key === 'selectedRecipeIds' && Array.isArray(value)) {
              return new Set(value);
            }
            return value;
          },
        }),
      },
    ),
    {
      name: 'RecipeStore',
    },
  ),
);
