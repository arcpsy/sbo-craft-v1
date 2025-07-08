// src/store/useRecipeStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '../types'; // This import makes the store aware of the updated Recipe type structure

// Define the state shape for our recipe store
interface RecipeState {
  recipes: Recipe[];
  selectedRecipeIds: Set<string>;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (itemName: string, updatedRecipe: Recipe) => void;
  deleteRecipe: (itemName: string) => void;
  setRecipes: (recipes: Recipe[]) => void;
  toggleRecipeSelection: (itemName: string) => void;
  clearRecipeSelection: () => void;
  deleteSelectedRecipes: () => void;
  selectAllRecipes: () => void;
}

// Create the Zustand store
export const useRecipeStore = create<RecipeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        recipes: [],
        selectedRecipeIds: new Set<string>(),

        // Actions
        addRecipe: (recipe) =>
          set((state) => {
            // Uniqueness check for itemName is handled in RecipeForm.tsx
            // If you wanted a store-level uniqueness check, it would go here,
            // but for immediate user feedback, form-level is better.
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
