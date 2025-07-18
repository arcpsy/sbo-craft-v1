// src/components/CraftingTreeViewer/CraftingTreeViewer.tsx
import React, { useState, useEffect } from 'react';
import './CraftingTreeViewer.css';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useOwnedMaterialsStore } from '../../store/useOwnedMaterialsStore';
import {
  buildCraftingTree,
  calculateRemainingMaterialsTree,
  type TreeNode,
  // @ts-ignore
  type BuildTreeResult,
} from '../../utils/craftingTreeUtils';
import type { Recipe, BlacksmithingAcquisition } from '../../types';

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
        {node.isCyclic && node.itemName !== 'CYCLE DETECTED!' && (
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
  const { ownedMaterials } = useOwnedMaterialsStore(); // Access owned materials store

  // State for the currently selected root item for the crafting tree
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  const [desiredQuantity, setDesiredQuantity] = useState<number>(1); // New state for desired quantity
  const [quantityInput, setQuantityInput] = useState<string>('1'); // State for raw input string
  // State to store the generated crafting tree (root TreeNode)
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);
  // State to store the calculated remaining materials tree
  const [remainingMaterialsTree, setRemainingMaterialsTree] =
    useState<TreeNode | null>(null); // Changed from totalRawMaterials
  // State to store any detected cyclic dependencies in the crafting tree
  const [detectedCycles, setDetectedCycles] = useState<string[][]>([]);

  // Filter recipes to get only blacksmithing recipes, as only these can form a crafting tree
  const blacksmithingRecipes = recipes.filter(
    (recipe) => recipe.acquisition.type === 'blacksmithing',
  ) as (Recipe & { acquisition: BlacksmithingAcquisition })[];

  // Effect hook to build the crafting tree and calculate remaining materials whenever selectedRootItem, recipes, or ownedMaterials change
  useEffect(() => {
    if (selectedRootItem) {
      // Build the crafting tree and detect cycles
      const { tree, cycles } = buildCraftingTree(selectedRootItem, recipes);
      setCraftingTree(tree);
      setDetectedCycles(cycles);

      // Calculate remaining materials if a tree was successfully built, accounting for owned materials
      if (tree) {
        const ownedMaterialsMap = new Map(
          ownedMaterials.map((m) => [m.itemName, m.quantity]),
        );
        const calculatedRemainingTree = calculateRemainingMaterialsTree(
          tree,
          ownedMaterialsMap,
          desiredQuantity,
        );
        setRemainingMaterialsTree(calculatedRemainingTree);
        console.log(
          'Calculated Remaining Materials Tree:',
          JSON.stringify(calculatedRemainingTree, null, 2),
        ); // Debugging log
      } else {
        setRemainingMaterialsTree(null);
      }
    } else {
      // Clear tree and materials if no root item is selected
      setCraftingTree(null);
      setRemainingMaterialsTree(null);
      setDetectedCycles([]);
    }
  }, [selectedRootItem, recipes, ownedMaterials, desiredQuantity]); // Add ownedMaterials and desiredQuantity to dependencies

  return (
    <div className='crafting-tree-viewer-container card'>
      <h2>Crafting Tree Viewer</h2>

      <div className='crafting-options-row'>
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

        <div className='form-group'>
          <label htmlFor='desiredQuantity'>Desired Quantity:</label>
          <input
            type='number'
            id='desiredQuantity'
            value={quantityInput}
            onChange={(e) => {
              const value = e.target.value;
              setQuantityInput(value);
              const parsedValue = parseInt(value);
              if (!isNaN(parsedValue) && parsedValue >= 1) {
                setDesiredQuantity(parsedValue);
              } else if (value === '') {
                setDesiredQuantity(1); // Default to 1 if input is empty
              }
            }}
            onBlur={() => {
              // When input loses focus, ensure desiredQuantity is reflected in quantityInput
              setQuantityInput(desiredQuantity.toString());
            }}
            min='1'
            className='quantity-input'
          />
        </div>
      </div>

      {/* OwnedMaterials component will be rendered here by App.tsx */}

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
              </li>
            ))}
          </ul>
          <p>Please review and correct these recipes.</p>
        </div>
      )}

      {/* Display remaining materials needed tree */}
      {remainingMaterialsTree && (
        <div className='remaining-materials-tree-display card'>
          <h3>Remaining Materials Needed:</h3>
          <ul className='tree-root'>
            <TreeNodeComponent node={remainingMaterialsTree} depth={0} />
          </ul>
        </div>
      )}

      {/* Message when all materials are met */}
      {craftingTree && !remainingMaterialsTree && selectedRootItem && (
        <p className='all-materials-met-message'>
          You have all the materials needed for {selectedRootItem}!
        </p>
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
