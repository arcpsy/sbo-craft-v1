// src/store/useRecipeStore.ts
import { create } from 'zustand';
// ✅ ADD createJSONStorage here
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '../types';

// Define the state shape for our recipe store
interface RecipeState {
  recipes: Recipe[];
  selectedRecipeIds: Set<string>;

  // Actions
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (itemName: string, updatedRecipe: Recipe) => void;
  deleteRecipe: (itemName: string) => void;
  setRecipes: (recipes: Recipe[]) => void;
  toggleRecipeSelection: (itemName: string) => void;
  clearRecipeSelection: () => void;
  deleteSelectedRecipes: () => void;
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
            if (state.recipes.some((r) => r.itemName === recipe.itemName)) {
              console.warn(
                `Recipe with name "${recipe.itemName}" already exists. Update instead.`,
              );
              return state;
            }
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

        deleteSelectedRecipes: () =>
          set((state) => ({
            recipes: state.recipes.filter(
              (recipe) => !state.selectedRecipeIds.has(recipe.itemName),
            ),
            selectedRecipeIds: new Set<string>(),
          })),
      }),
      {
        name: 'crafting-tree-recipes-storage',
        storage: createJSONStorage(() => localStorage), // ✅ Fixed!
      },
    ),
    {
      name: 'RecipeStore',
    },
  ),
);
