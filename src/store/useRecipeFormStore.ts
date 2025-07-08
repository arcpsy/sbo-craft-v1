// src/store/useRecipeFormStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Recipe } from '../types';

// Define the state shape for the recipe form specific logic
export interface RecipeFormState {
  // ✅ ADD 'export' HERE
  recipeToEdit: Recipe | null;
  setRecipeToEdit: (recipe: Recipe | null) => void;
}

// Create the Zustand store for form-specific state
export const useRecipeFormStore = create<RecipeFormState>()(
  devtools(
    (set) => ({
      recipeToEdit: null, // Initial state: no recipe selected for editing

      setRecipeToEdit: (recipe) => set({ recipeToEdit: recipe }),
    }),
    {
      name: 'RecipeFormStore', // Name for DevTools
    },
  ),
);
