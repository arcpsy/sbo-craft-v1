// src/utils/craftingTreeUtils.ts

import type { Recipe, Ingredient, BlacksmithingAcquisition } from '../types'; // Ensure 'type' is used here

/**
 * Interface representing a node in the crafting dependency tree.
 * Each node can be an item to craft or a raw ingredient.
 */
export interface TreeNode {
  itemName: string;
  quantity: number; // The quantity of this item needed for its direct parent.
  children?: TreeNode[]; // Optional: Array of child nodes (ingredients that are themselves crafted).
  isCrafted: boolean; // True if this item has its own crafting recipe (Blacksmithing).
}

/**
 * Helper function to find a recipe by its item name efficiently.
 * @param itemName The name of the item to find.
 * @param allRecipes The full list of all recipes.
 * @returns The found Recipe object or undefined if not found.
 */
const findRecipeByName = (
  itemName: string,
  allRecipes: Recipe[],
): Recipe | undefined => {
  return allRecipes.find((recipe) => recipe.itemName === itemName);
};

/**
 * Recursively builds the crafting dependency tree for a given root item.
 * @param rootItemName The name of the top-level item for which to build the tree.
 * @param allRecipes The complete flat list of all available recipes.
 * @returns The root TreeNode of the crafting tree, or null if the root item is not a crafted recipe.
 */
export const buildCraftingTree = (
  rootItemName: string,
  allRecipes: Recipe[],
): TreeNode | null => {
  const rootRecipe = findRecipeByName(rootItemName, allRecipes);

  // If the root item doesn't exist or isn't a blacksmithing recipe, it cannot be a crafting tree root.
  if (!rootRecipe || rootRecipe.acquisition.type !== 'blacksmithing') {
    console.warn(
      `Cannot build crafting tree for '${rootItemName}': Not found or not a blacksmithing recipe.`,
    );
    return null;
  }

  // Use a Set to keep track of items currently in the recursion path to detect cycles
  const visited = new Set<string>();

  /**
   * Recursive helper function to build a single node and its children.
   * @param currentItemName The name of the current item being processed.
   * @param requiredQuantity The quantity of this item needed by its direct parent.
   * @returns A TreeNode object.
   */
  const buildNode = (
    currentItemName: string,
    requiredQuantity: number,
  ): TreeNode => {
    // Cycle detection: If we visit an item that's already in our current path, it's a cycle.
    if (visited.has(currentItemName)) {
      console.error(
        `Cycle detected in crafting tree: '${currentItemName}' is required by itself.`,
      );
      // Return a basic node to avoid infinite loop, marking it as part of a cycle
      return {
        itemName: currentItemName,
        quantity: requiredQuantity,
        isCrafted: true, // It's part of a crafting process, but circular
        children: [
          {
            itemName: 'CYCLE DETECTED!',
            quantity: 1,
            isCrafted: false, // Mark as a special informational node
          },
        ],
      };
    }

    visited.add(currentItemName);

    const recipe = findRecipeByName(currentItemName, allRecipes);

    const node: TreeNode = {
      itemName: currentItemName,
      quantity: requiredQuantity,
      isCrafted: !!recipe && recipe.acquisition.type === 'blacksmithing',
    };

    // If it's a blacksmithing recipe, process its ingredients as children
    if (node.isCrafted) {
      const blacksmithingAcq = recipe!.acquisition as BlacksmithingAcquisition;
      node.children = blacksmithingAcq.ingredients.map(
        (ingredient) => buildNode(ingredient.name, ingredient.quantity), // Recursively call for each ingredient
      );
    }

    // After processing children, remove from visited set to allow it in other branches
    visited.delete(currentItemName);

    return node;
  };

  // Start building the tree from the root recipe
  return buildNode(rootRecipe.itemName, 1); // The root item is '1' of itself
};

/**
 * Calculates the total quantities of all raw (non-crafted) materials needed for a given crafting tree.
 * @param treeNode The root TreeNode of the crafting tree.
 * @returns A Map where keys are raw material names (string) and values are their total required quantities (number).
 */
export const calculateTotalRawMaterials = (
  treeNode: TreeNode,
): Map<string, number> => {
  const totals = new Map<string, number>();

  /**
   * Recursive helper to traverse the tree and accumulate raw material quantities.
   * @param node The current node being processed.
   * @param multiplier The cumulative multiplier from parent nodes (e.g., if a sword needs 3 bars, and a bar needs 2 ore,
   * the ore's quantity for the sword is 2 * 3 = 6).
   */
  const traverse = (node: TreeNode, multiplier: number) => {
    // Calculate the actual quantity needed at this level based on previous multipliers
    const actualQuantity = node.quantity * multiplier;

    // If it's a raw material (not crafted and not a cycle indicator)
    if (!node.isCrafted && node.itemName !== 'CYCLE DETECTED!') {
      // Add or update its total quantity
      totals.set(
        node.itemName,
        (totals.get(node.itemName) || 0) + actualQuantity,
      );
    } else if (node.children) {
      // If it's a crafted item, recurse into its children
      for (const child of node.children) {
        traverse(child, actualQuantity); // Pass the current node's actual quantity as the new multiplier
      }
    }
  };

  // Start the traversal from the root node with a multiplier of 1 (for the root item itself)
  traverse(treeNode, 1);

  return totals;
};
