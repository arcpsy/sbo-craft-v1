// src/utils/craftingTreeUtils.ts

import {
  // @ts-ignore
  type Ingredient,
  type Recipe,
  type BlacksmithingAcquisition,
  type OwnedMaterial, // Import OwnedMaterial
} from '../types';

/**
 * Interface representing a node in the crafting dependency tree.
 * Each node can be an item to craft or a raw ingredient.
 */
export interface TreeNode {
  itemName: string;
  quantity: number; // The quantity of this item needed for its direct parent.
  children?: TreeNode[]; // Optional: Array of child nodes (ingredients that are themselves crafted).
  isCrafted: boolean; // True if this item has its own crafting recipe (Blacksmithing).
  isCyclic?: boolean; // Optional flag to mark nodes involved in a cycle
}

/**
 * Interface for the result of building a crafting tree.
 */
export interface BuildTreeResult {
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
 * @param allRecipes The complete flat list of all recipes.
 * @returns The root TreeNode of the crafting tree, or null if the root item is not a crafted recipe.
 */
export const buildCraftingTree = (
  rootItemName: string,
  allRecipes: Recipe[],
): BuildTreeResult => {
  const rootRecipe = findRecipeByName(rootItemName, allRecipes);

  const detectedCycles: string[][] = [];

  if (!rootRecipe || rootRecipe.acquisition.type !== 'blacksmithing') {
    console.warn(
      `Cannot build crafting tree for '${rootItemName}': Not found or not a blacksmithing recipe.`,
    );
    return { tree: null, cycles: [] };
  }

  // Use a Set to keep track of items currently in the recursion path to detect cycles
  const recursionPath: string[] = [];

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
        isCyclic: true, // Mark as cyclic
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

    recursionPath.pop(); // Remove from path when done with this branch

    return node;
  };

  // Start building the tree from the root recipe
  const tree = buildNode(rootRecipe.itemName, 1);
  return { tree, cycles: detectedCycles };
};

/**
 * Calculates the total quantities of all raw (non-crafted) materials needed for a given crafting tree.
 * This function does NOT account for owned materials and is primarily for showing the *total* raw materials.
 * @param treeNode The root TreeNode of the crafting tree.
 * @returns A Map where keys are raw material names (string) and values are their total required quantities (number).
 */
export const calculateRawMaterialsTotals = (
  treeNode: TreeNode,
): Map<string, number> => {
  const totals = new Map<string, number>();

  const traverse = (node: TreeNode, multiplier: number) => {
    if (node.itemName === 'CYCLE DETECTED!') {
      return;
    }

    const actualQuantity = node.quantity * multiplier;

    if (!node.isCrafted) {
      totals.set(
        node.itemName,
        (totals.get(node.itemName) || 0) + actualQuantity,
      );
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child, actualQuantity);
      }
    }
  };

  traverse(treeNode, 1);
  return totals;
};

/**
 * Recursively calculates the remaining materials needed for a given crafting tree,
 * accounting for materials the user already possesses.
 * Returns a new TreeNode structure representing only the items (raw or crafted)
 * that are still needed, with their adjusted quantities.
 *
 * @param node The current node from the original crafting tree.
 * @param ownedMaterials A Map of materials the user already owns (itemName -> quantity).
 * @param multiplier The cumulative multiplier from parent nodes.
 * @returns A new TreeNode representing the remaining needed item, or null if not needed.
 */
export const calculateRemainingMaterialsTree = (
  node: TreeNode,
  ownedMaterials: Map<string, number>,
  multiplier: number,
): TreeNode | null => {
  if (node.itemName === 'CYCLE DETECTED!') {
    return null; // Don't include cyclic nodes in remaining materials
  }

  const totalRequired = node.quantity * multiplier;
  let remainingQuantity = totalRequired;

  if (!node.isCrafted) {
    // If it's a raw material, subtract owned quantity
    const owned = ownedMaterials.get(node.itemName) || 0;
    remainingQuantity = Math.max(0, totalRequired - owned);
  }

  // If this item (raw or crafted) is still needed
  if (remainingQuantity > 0) {
    const remainingNode: TreeNode = {
      itemName: node.itemName,
      quantity: remainingQuantity,
      isCrafted: node.isCrafted,
      isCyclic: node.isCyclic, // Preserve cyclic flag
    };

    if (node.isCrafted && node.children) {
      // For crafted items, recursively calculate remaining children
      const remainingChildren: TreeNode[] = [];
      let allChildrenMet = true; // Flag to check if all children are met

      for (const child of node.children) {
        const childRemaining = calculateRemainingMaterialsTree(
          child,
          ownedMaterials,
          totalRequired, // Pass totalRequired as multiplier for children
        );
        if (childRemaining) {
          remainingChildren.push(childRemaining);
          allChildrenMet = false; // At least one child is not met
        }
      }

      if (remainingChildren.length > 0) {
        remainingNode.children = remainingChildren;
      } else if (allChildrenMet) {
        // If all children are met, then this crafted item is also met
        return null; // This crafted item is fully covered by owned materials/sub-components
      }
    }
    return remainingNode;
  }

  return null; // This item is not needed
};
