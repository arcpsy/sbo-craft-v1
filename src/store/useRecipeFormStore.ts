// src/store/useRecipeFormStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Recipe } from '../types';

/**
 * Defines the state shape and actions for the recipe form-specific logic.
 * This store is used to manage which recipe is currently being edited.
 */
export interface RecipeFormState {
  /**
   * The recipe object currently selected for editing in the RecipeForm.
   * `null` if no recipe is being edited (i.e., the form is for adding a new recipe).
   */
  recipeToEdit: Recipe | null;
  /**
   * Sets the `recipeToEdit` state.
   * @param recipe The recipe to set for editing, or `null` to clear the editing state.
   */
  setRecipeToEdit: (recipe: Recipe | null) => void;
}

/**
 * Creates the Zustand store for managing the state related to the RecipeForm.
 * This store is separate from `useRecipeStore` to keep concerns separated:
 * `useRecipeStore` manages the collection of all recipes, while `useRecipeFormStore`
 * manages the transient state of the form itself (e.g., which recipe is being edited).
 */
export const useRecipeFormStore = create<RecipeFormState>()(
  // `devtools` middleware enables inspection of the store with Redux DevTools.
  devtools(
    (set) => ({
      // Initial state: no recipe selected for editing
      recipeToEdit: null,

      /**
       * Action to set or clear the recipe being edited.
       * When a recipe is passed, the form will pre-fill with its data.
       * When `null` is passed, the form resets to its initial state for new recipe creation.
       */
      setRecipeToEdit: (recipe) => set({ recipeToEdit: recipe }),
    }),
    {
      name: 'RecipeFormStore', // Name for the store instance in Redux DevTools
    },
  ),
);
