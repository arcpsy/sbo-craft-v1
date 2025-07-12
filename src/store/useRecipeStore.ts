// src/store/useRecipeStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '../types';

/**
 * Defines the shape of the state and actions for the recipe store.
 * This interface ensures type safety for the store's contents and its API.
 */
interface RecipeState {
  /** An array of all defined crafting recipes. */
  recipes: Recipe[];
  /** A Set of item names for currently selected recipes, used for bulk operations. */
  selectedRecipeIds: Set<string>;
  /** Adds a new recipe to the store. */
  addRecipe: (recipe: Recipe) => void;
  /** Updates an existing recipe identified by its original item name. */
  updateRecipe: (itemName: string, updatedRecipe: Recipe) => void;
  /** Deletes a single recipe by its item name. */
  deleteRecipe: (itemName: string) => void;
  /** Replaces all recipes in the store with a new array of recipes. Used for import functionality. */
  setRecipes: (recipes: Recipe[]) => void;
  /** Toggles the selection status of a recipe by its item name. */
  toggleRecipeSelection: (itemName: string) => void;
  /** Clears all selected recipes. */
  clearRecipeSelection: () => void;
  /** Deletes multiple recipes based on a list of item names. */
  deleteSelectedRecipes: (itemNames: string[]) => void;
  /** Selects all currently available recipes. */
  selectAllRecipes: () => void;
}

/**
 * Creates the Zustand store for managing crafting recipes.
 * It uses `devtools` for Redux DevTools integration and `persist` to save
 * and load the state from `localStorage`.
 */
export const useRecipeStore = create<RecipeState>()(
  // `devtools` middleware enables inspection of the store with Redux DevTools.
  devtools(
    // `persist` middleware handles saving and loading the store state.
    persist(
      (set, _get) => ({
        // Initial state definition
        recipes: [],
        selectedRecipeIds: new Set<string>(),

        // Actions: Functions that modify the store's state.

        /** Adds a new recipe to the `recipes` array. */
        addRecipe: (recipe) =>
          set((state) => {
            return { recipes: [...state.recipes, recipe] };
          }),

        /** Updates an existing recipe. It maps through the recipes and replaces the one matching `itemName`. */
        updateRecipe: (itemName, updatedRecipe) =>
          set((state) => ({
            recipes: state.recipes.map((r) =>
              r.itemName === itemName ? updatedRecipe : r,
            ),
          })),

        /** Deletes a recipe by filtering it out of the `recipes` array.
         * Also ensures the recipe is removed from `selectedRecipeIds` if it was selected.
         */
        deleteRecipe: (itemName) =>
          set((state) => ({
            recipes: state.recipes.filter((r) => r.itemName !== itemName),
            selectedRecipeIds: new Set(
              Array.from(state.selectedRecipeIds).filter(
                (id) => id !== itemName,
              ),
            ),
          })),

        /** Sets the entire `recipes` array to a new array. Clears selection upon setting new recipes. */
        setRecipes: (recipes) =>
          set(() => ({
            recipes: recipes,
            selectedRecipeIds: new Set<string>(), // Clear selection when new recipes are set
          })),

        /** Toggles the presence of an `itemName` in the `selectedRecipeIds` Set. */
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

        /** Resets `selectedRecipeIds` to an empty Set. */
        clearRecipeSelection: () =>
          set(() => ({
            selectedRecipeIds: new Set<string>(),
          })),

        /**
         * Deletes multiple recipes whose names are present in `itemNamesToDelete`.
         * After deletion, it clears the `selectedRecipeIds`.
         */
        deleteSelectedRecipes: (itemNamesToDelete: string[]) =>
          set((state) => ({
            recipes: state.recipes.filter(
              // Keep recipes whose names are NOT in the list of names to delete
              (recipe) => !itemNamesToDelete.includes(recipe.itemName),
            ),
            // Clear selection in the store's internal state as well after deletion
            selectedRecipeIds: new Set<string>(),
          })),

        /** Selects all recipes by adding all `itemName`s to `selectedRecipeIds`. */
        selectAllRecipes: () =>
          set((state) => ({
            selectedRecipeIds: new Set(
              state.recipes.map((recipe) => recipe.itemName),
            ),
          })),
      }),
      {
        name: 'crafting-tree-recipes-storage', // Name for the storage key in localStorage
        storage: createJSONStorage(() => localStorage, {
          /**
           * Custom replacer function for JSON.stringify.
           * Converts `Set` objects (like `selectedRecipeIds`) to arrays for proper serialization.
           */
          replacer: (_key, value) => {
            if (value instanceof Set) {
              return Array.from(value);
            }
            return value;
          },
          /**
           * Custom reviver function for JSON.parse.
           * Converts arrays back to `Set` objects when loading from storage.
           */
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
      name: 'RecipeStore', // Name for the devtools instance
    },
  ),
);
