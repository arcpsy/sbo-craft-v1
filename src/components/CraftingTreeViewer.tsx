// src/components/CraftingTreeViewer.tsx
import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import {
  buildCraftingTree,
  calculateTotalRawMaterials,
  type TreeNode,
} from '../utils/craftingTreeUtils';
import type { Recipe, BlacksmithingAcquisition } from '../types';

import './CraftingTreeViewer.css';

// ✅ NEW: Create a separate component for rendering individual TreeNodes
interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const indentation = { marginLeft: `${depth * 20}px` };

  // Determine if the toggle button should be shown
  const showToggleButton =
    node.isCrafted && node.children && node.children.length > 0;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <li style={indentation}>
      <div className='node-header'>
        {showToggleButton && (
          <button onClick={handleToggle} className='toggle-button'>
            {isExpanded ? '▼' : '►'}{' '}
            {/* Down arrow for expanded, right for collapsed */}
          </button>
        )}
        <span className={node.isCrafted ? 'crafted-item' : 'raw-material'}>
          {node.itemName} (x{node.quantity})
        </span>

        {!node.isCrafted && (
          <span className='node-type-label'> [Raw Material]</span>
        )}
        {node.children &&
          node.children.some(
            (child) => child.itemName === 'CYCLE DETECTED!',
          ) && <span className='cycle-detected-label'> [Cycle Detected!]</span>}
      </div>

      {/* Conditionally render children based on isExpanded state */}
      {isExpanded && node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child, index) => (
            // Use index as key here, as itemName might not be unique if a cycle is detected and the placeholder is used multiple times
            <TreeNodeComponent
              key={child.itemName + depth + index}
              node={child}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const CraftingTreeViewer: React.FC = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);
  const [totalRawMaterials, setTotalRawMaterials] = useState<
    Map<string, number>
  >(new Map());

  const blacksmithingRecipes = recipes.filter(
    (recipe) => recipe.acquisition.type === 'blacksmithing',
  ) as (Recipe & { acquisition: BlacksmithingAcquisition })[];

  useEffect(() => {
    if (selectedRootItem) {
      const tree = buildCraftingTree(selectedRootItem, recipes);
      setCraftingTree(tree);

      if (tree) {
        setTotalRawMaterials(calculateTotalRawMaterials(tree));
      } else {
        setTotalRawMaterials(new Map());
      }
    } else {
      setCraftingTree(null);
      setTotalRawMaterials(new Map());
    }
  }, [selectedRootItem, recipes]);

  // Removed renderTreeNode function, now using TreeNodeComponent directly
  // const renderTreeNode = (node: TreeNode, depth: number = 0) => { /* ... */ };

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

      {/* Crafting Tree Display */}
      {craftingTree && (
        <div className='crafting-tree-display'>
          <h3>Tree for: {craftingTree.itemName}</h3>
          <ul className='tree-root'>
            {/* ✅ Render the root node using the new TreeNodeComponent */}
            <TreeNodeComponent node={craftingTree} depth={0} />
          </ul>
        </div>
      )}

      {craftingTree && totalRawMaterials.size > 0 && (
        <div className='total-raw-materials-display'>
          <h3>Total Raw Materials Needed:</h3>
          <ul>
            {Array.from(totalRawMaterials.entries()).map(
              ([itemName, quantity]) => (
                <li key={itemName}>
                  <strong>{itemName}</strong>: {quantity}
                </li>
              ),
            )}
          </ul>
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
