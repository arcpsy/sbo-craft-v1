// src/utils/craftingTreeUtils.ts

import type { Recipe, Ingredient, BlacksmithingAcquisition } from '../types';

/**
 * Interface representing a node in the crafting dependency tree.
 * Each node can be an item to craft or a raw ingredient.
 */
export interface TreeNode {
  itemName: string;
  quantity: number; // The quantity of this item needed for its direct parent.
  children?: TreeNode[]; // Optional: Array of child nodes (ingredients that are themselves crafted).
  isCrafted: boolean; // True if this item has its own crafting recipe (Blacksmithing).
  isCyclic?: boolean; // ✅ NEW: Optional flag to mark nodes involved in a cycle
}

/**
 * Interface for the result of building a crafting tree.
 */
export interface BuildTreeResult {
  // ✅ NEW: Interface to return both tree and cycles
  tree: TreeNode | null;
  cycles: string[][]; // Each inner array represents a detected cycle path
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
): BuildTreeResult => {
  // ✅ Changed return type
  const rootRecipe = findRecipeByName(rootItemName, allRecipes);

  const detectedCycles: string[][] = []; // ✅ NEW: Array to store detected cycles

  if (!rootRecipe || rootRecipe.acquisition.type !== 'blacksmithing') {
    console.warn(
      `Cannot build crafting tree for '${rootItemName}': Not found or not a blacksmithing recipe.`,
    );
    return { tree: null, cycles: [] }; // ✅ Return new structure
  }

  // Use a Set to keep track of items currently in the recursion path to detect cycles
  const recursionPath: string[] = []; // ✅ Changed to array to store full path for cycle reporting

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
    const cycleStartIndex = recursionPath.indexOf(currentItemName);
    if (cycleStartIndex !== -1) {
      const cyclePath = recursionPath.slice(cycleStartIndex);
      cyclePath.push(currentItemName); // Add the current item to close the loop
      detectedCycles.push(cyclePath); // Store the full cycle path

      console.error(
        `Cycle detected in crafting tree: ${cyclePath.join(' -> ')}`,
      );
      // Return a basic node to avoid infinite loop, marking it as part of a cycle
      return {
        itemName: currentItemName,
        quantity: requiredQuantity,
        isCrafted: true,
        isCyclic: true, // ✅ Mark as cyclic
        children: [
          {
            itemName: 'CYCLE DETECTED!',
            quantity: 1,
            isCrafted: false,
            isCyclic: true,
          },
        ],
      };
    }

    recursionPath.push(currentItemName); // Add current item to path
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

    recursionPath.pop(); // ✅ Remove from path when done with this branch

    return node;
  };

  // Start building the tree from the root recipe
  const tree = buildNode(rootRecipe.itemName, 1);
  return { tree, cycles: detectedCycles }; // ✅ Return both tree and cycles
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
    // Skip cycle detected nodes from raw material calculations to avoid unintended sums
    if (node.itemName === 'CYCLE DETECTED!') {
      return;
    }

    // Calculate the actual quantity needed at this level based on previous multipliers
    const actualQuantity = node.quantity * multiplier;

    // If it's a raw material (not crafted)
    if (!node.isCrafted) {
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
