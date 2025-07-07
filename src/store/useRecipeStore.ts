// src/store/useRecipeStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Recipe } from '../types'; // Import your Recipe type

// Define the state shape for our recipe store
interface RecipeState {
  recipes: Recipe[]; // Array of all defined recipes
  selectedRecipeIds: Set<string>; // Set to keep track of selected recipes for bulk actions (e.g., delete)

  // Actions
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (itemName: string, updatedRecipe: Recipe) => void;
  deleteRecipe: (itemName: string) => void;
  setRecipes: (recipes: Recipe[]) => void; // For loading recipes (e.g., from local storage or file)
  toggleRecipeSelection: (itemName: string) => void;
  clearRecipeSelection: () => void;
  deleteSelectedRecipes: () => void;
}

// Create the Zustand store
export const useRecipeStore = create<RecipeState>()(
  // devtools and persist are Zustand middleware for debugging and local storage persistence
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        recipes: [],
        selectedRecipeIds: new Set<string>(),

        // Actions
        addRecipe: (recipe) =>
          set((state) => {
            // Ensure unique item names
            if (state.recipes.some((r) => r.itemName === recipe.itemName)) {
              console.warn(
                `Recipe with name "${recipe.itemName}" already exists. Update instead.`,
              );
              // Optionally, you might want to throw an error or handle this more explicitly in the UI
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
            // Also remove from selection if it was selected
            selectedRecipeIds: new Set(
              Array.from(state.selectedRecipeIds).filter(
                (id) => id !== itemName,
              ),
            ),
          })),

        setRecipes: (recipes) =>
          set(() => ({
            recipes: recipes,
            selectedRecipeIds: new Set<string>(), // Clear selection when setting new recipes
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
            selectedRecipeIds: new Set<string>(), // Clear selection after deletion
          })),
      }),
      {
        name: 'crafting-tree-recipes-storage', // unique name for local storage key
        getStorage: () => localStorage, // Use localStorage for persistence
      },
    ),
    {
      name: 'RecipeStore', // unique name for devtools
    },
  ),
);
