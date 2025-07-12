// src/components/CraftingTreeViewer.tsx
import React, { useState, useEffect } from 'react';
import './CraftingTreeViewer.css';
import { useRecipeStore } from '../../store/useRecipeStore';
import {
  buildCraftingTree,
  calculateTotalRawMaterials,
  type TreeNode,
  // @ts-ignore
  type BuildTreeResult,
} from '../../utils/craftingTreeUtils'; // ✅ Import BuildTreeResult
import type { Recipe, BlacksmithingAcquisition } from '../../types';

import './CraftingTreeViewer.css';

/**
 * Props for the TreeNodeComponent.
 * @param node The TreeNode object representing the current node in the crafting tree.
 * @param depth The current depth of the node in the tree, used for indentation.
 */
interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

/**
 * TreeNodeComponent recursively renders a single node of the crafting tree.
 * It displays the item name, quantity, and whether it's a crafted item or raw material.
 * It also handles expanding/collapsing child nodes and displays cycle detection warnings.
 */
const TreeNodeComponent: React.FC<TreeNodeProps> = ({ node, depth }) => {
  // State to manage the expanded/collapsed state of the current node
  const [isExpanded, setIsExpanded] = useState(true);
  // Calculates indentation based on the node's depth
  const indentation = { marginLeft: `${depth * 20}px` };

  // Determines if a toggle button should be shown (only for crafted items with children)
  const showToggleButton =
    node.isCrafted && node.children && node.children.length > 0;

  /**
   * Toggles the expanded state of the node.
   */
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <li style={indentation}>
      <div className='node-header'>
        {/* Render toggle button if applicable */}
        {showToggleButton && (
          <button onClick={handleToggle} className='toggle-button'>
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        {/* Display item name and quantity, with styling based on whether it's crafted or raw */}
        <span className={node.isCrafted ? 'crafted-item' : 'raw-material'}>
          {node.itemName} (x{node.quantity})
        </span>

        {/* Label for raw materials */}
        {!node.isCrafted && (
          <span className='node-type-label'> [Raw Material]</span>
        )}
        {/* Display cycle detection warning if a cycle is detected at this node */}
        {node.isCyclic &&
          node.itemName !== 'CYCLE DETECTED!' && ( // ✅ Display only for the actual cyclic item
            <span className='cycle-detected-label'> [Cyclic Dependency!]</span>
          )}
      </div>

      {/* Recursively render child nodes if expanded and children exist */}
      {isExpanded && node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child, index) => (
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

/**
 * CraftingTreeViewer component allows users to select a crafted item
 * and visualize its crafting tree, including raw materials needed and any cyclic dependencies.
 */
const CraftingTreeViewer: React.FC = () => {
  // Access recipes from the Zustand store
  const recipes = useRecipeStore((state) => state.recipes);
  // State for the currently selected root item for the crafting tree
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  // State to store the generated crafting tree (root TreeNode)
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);
  // State to store the calculated total raw materials needed for the selected item
  const [totalRawMaterials, setTotalRawMaterials] = useState<
    Map<string, number>
  >(new Map());
  // State to store any detected cyclic dependencies in the crafting tree
  const [detectedCycles, setDetectedCycles] = useState<string[][]>([]); // ✅ New state for detected cycles

  // Filter recipes to get only blacksmithing recipes, as only these can form a crafting tree
  const blacksmithingRecipes = recipes.filter(
    (recipe) => recipe.acquisition.type === 'blacksmithing',
  ) as (Recipe & { acquisition: BlacksmithingAcquisition })[];

  // Effect hook to build the crafting tree and calculate raw materials whenever selectedRootItem or recipes change
  useEffect(() => {
    if (selectedRootItem) {
      // Build the crafting tree and detect cycles
      const { tree, cycles } = buildCraftingTree(selectedRootItem, recipes); // ✅ Destructure result
      setCraftingTree(tree);
      setDetectedCycles(cycles); // ✅ Set detected cycles

      // Calculate total raw materials if a tree was successfully built
      if (tree) {
        setTotalRawMaterials(calculateTotalRawMaterials(tree));
      } else {
        setTotalRawMaterials(new Map());
      }
    } else {
      // Clear tree and materials if no root item is selected
      setCraftingTree(null);
      setTotalRawMaterials(new Map());
      setDetectedCycles([]); // ✅ Clear cycles
    }
  }, [selectedRootItem, recipes]); // Dependencies for the useEffect hook

  return (
    <div className='crafting-tree-viewer-container card'>
      <h2>Crafting Tree Viewer</h2>

      {/* Dropdown to select the root item for the crafting tree */}
      <div className='form-group'>
        <label htmlFor='rootItemSelect'>Select Crafted Item:</label>
        <select
          id='rootItemSelect'
          value={selectedRootItem}
          onChange={(e) => setSelectedRootItem(e.target.value)}
        >
          <option value=''>-- Select an item --</option>
          {/* Populate dropdown with available blacksmithing recipes */}
          {blacksmithingRecipes.map((recipe) => (
            <option key={recipe.itemName} value={recipe.itemName}>
              {recipe.itemName}
            </option>
          ))}
        </select>
      </div>

      {/* Message displayed if no crafting tree is found for the selected item */}
      {selectedRootItem && !craftingTree && (
        <p>
          No crafting tree found for "{selectedRootItem}". Make sure it's a
          valid blacksmithing recipe.
        </p>
      )}

      {/* Display detected cycles if any */}
      {detectedCycles.length > 0 && (
        <div className='cycle-warning card'>
          <h3>
            <i className='fas fa-exclamation-triangle'></i> Detected Crafting
            Cycles!
          </h3>
          <p>
            The following circular dependencies were found in your recipes. This
            means an item indirectly requires itself, preventing it from being
            crafted.
          </p>
          <ul>
            {detectedCycles.map((cyclePath, index) => (
              <li key={index}>
                <code>{cyclePath.join(' &#8594; ')}</code>{' '}
                {/* Uses HTML entity for arrow */}
              </li>
            ))}
          </ul>
          <p>Please review and correct these recipes.</p>
        </div>
      )}

      {/* Display the crafting tree if it exists */}
      {craftingTree && (
        <div className='crafting-tree-display'>
          <h3>Tree for: {craftingTree.itemName}</h3>
          <ul className='tree-root'>
            <TreeNodeComponent node={craftingTree} depth={0} />
          </ul>
        </div>
      )}

      {/* Display total raw materials needed if a tree exists and materials are calculated */}
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

      {/* Message displayed if no blacksmithing recipes are available */}
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
