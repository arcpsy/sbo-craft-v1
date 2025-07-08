// src/components/CraftingTreeViewer.tsx
import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import { buildCraftingTree, type TreeNode } from '../utils/craftingTreeUtils'; // ✅ 'type' for TreeNode
import type { Recipe, BlacksmithingAcquisition } from '../types'; // ✅ 'type' for Recipe and BlacksmithingAcquisition

import './CraftingTreeViewer.css'; // ✅ Import the CSS file

const CraftingTreeViewer: React.FC = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);

  // Filter for only Blacksmithing recipes to be potential root items
  const blacksmithingRecipes = recipes.filter(
    (recipe) => recipe.acquisition.type === 'blacksmithing',
  ) as (Recipe & { acquisition: BlacksmithingAcquisition })[]; // Cast for type safety

  // Effect to build the tree whenever the selectedRootItem or recipes change
  useEffect(() => {
    if (selectedRootItem) {
      const tree = buildCraftingTree(selectedRootItem, recipes);
      setCraftingTree(tree);
    } else {
      setCraftingTree(null); // Clear tree if no item selected
    }
  }, [selectedRootItem, recipes]);

  // Recursive component to render tree nodes
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    // const isRoot = depth === 0; // Not used currently, but kept for context if needed
    const indentation = { marginLeft: `${depth * 20}px` }; // Simple indentation

    return (
      <li key={node.itemName + depth} style={indentation}>
        {/* Display item name and quantity needed for its parent */}
        <span className={node.isCrafted ? 'crafted-item' : 'raw-material'}>
          {node.itemName} (x{node.quantity})
        </span>

        {/* Display if it's a raw material or part of a cycle */}
        {!node.isCrafted && (
          <span className='node-type-label'> [Raw Material]</span>
        )}
        {node.children &&
          node.children.some(
            (child) => child.itemName === 'CYCLE DETECTED!',
          ) && <span className='cycle-detected-label'> [Cycle Detected!]</span>}

        {/* Recursively render children if they exist */}
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className='crafting-tree-viewer-container card'>
      <h2>Crafting Tree Viewer</h2>

      <div className='form-group'>
        <label htmlFor='rootItemSelect'>Select Crafted Item:</label>
        <select
          id='rootItemSelect'
          value={selectedRootItem}
          onChange={(e) => setSelectedRootItem(e.target.value)}
        >
          <option value=''>-- Select an item --</option>
          {blacksmithingRecipes.map((recipe) => (
            <option key={recipe.itemName} value={recipe.itemName}>
              {recipe.itemName}
            </option>
          ))}
        </select>
      </div>

      {selectedRootItem && !craftingTree && (
        <p>
          No crafting tree found for "{selectedRootItem}". Make sure it's a
          valid blacksmithing recipe.
        </p>
      )}

      {craftingTree && (
        <div className='crafting-tree-display'>
          <h3>Tree for: {craftingTree.itemName}</h3>
          <ul className='tree-root'>{renderTreeNode(craftingTree)}</ul>
        </div>
      )}

      {blacksmithingRecipes.length === 0 && (
        <p>
          No blacksmithing recipes available to build a crafting tree. Add some
          first!
        </p>
      )}
    </div>
  );
};

export default CraftingTreeViewer;
