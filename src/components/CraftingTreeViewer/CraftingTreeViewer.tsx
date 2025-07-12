// src/components/CraftingTreeViewer/CraftingTreeViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import type {
  Recipe,
  BlacksmithingAcquisition,
  OwnedMaterial,
} from '../../types';
import { toast } from 'react-hot-toast';

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
  const {
    ownedMaterials,
    addOwnedMaterial,
    updateOwnedMaterial,
    removeOwnedMaterial,
  } = useOwnedMaterialsStore(); // Access owned materials store

  // State for the currently selected root item for the crafting tree
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  // State to store the generated crafting tree (root TreeNode)
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);
  // State to store the calculated remaining materials tree
  const [remainingMaterialsTree, setRemainingMaterialsTree] =
    useState<TreeNode | null>(null); // Changed from totalRawMaterials
  // State to store any detected cyclic dependencies in the crafting tree
  const [detectedCycles, setDetectedCycles] = useState<string[][]>([]);

  // State for adding new owned materials
  const [newOwnedMaterialName, setNewOwnedMaterialName] = useState<string>('');
  const [newOwnedMaterialQuantity, setNewOwnedMaterialQuantity] =
    useState<number>(1);

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
          1,
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
  }, [selectedRootItem, recipes, ownedMaterials]); // Add ownedMaterials to dependencies

  const handleAddOwnedMaterial = useCallback(() => {
    if (newOwnedMaterialName.trim() && newOwnedMaterialQuantity > 0) {
      addOwnedMaterial({
        itemName: newOwnedMaterialName.trim(),
        quantity: newOwnedMaterialQuantity,
      });
      setNewOwnedMaterialName('');
      setNewOwnedMaterialQuantity(1);
      toast.success(
        `Added ${newOwnedMaterialQuantity} x ${newOwnedMaterialName} to owned materials.`,
      );
    } else {
      toast.error('Please enter a valid material name and quantity.');
    }
  }, [newOwnedMaterialName, newOwnedMaterialQuantity, addOwnedMaterial]);

  const handleUpdateOwnedMaterialQuantity = useCallback(
    (itemName: string, value: string) => {
      const parsedQuantity = parseInt(value, 10);
      if (isNaN(parsedQuantity) || value.trim() === '') {
        // If input is empty or not a number, don't remove, just update to 0 for display
        updateOwnedMaterial(itemName, 0); // Temporarily set to 0 for display
      } else if (parsedQuantity > 0) {
        updateOwnedMaterial(itemName, parsedQuantity);
        toast.success(`Updated ${itemName} quantity to ${parsedQuantity}.`);
      } else if (parsedQuantity === 0) {
        removeOwnedMaterial(itemName);
        toast.success(`Removed ${itemName} from owned materials.`);
      }
    },
    [updateOwnedMaterial, removeOwnedMaterial],
  );

  const handleRemoveOwnedMaterial = useCallback(
    (itemName: string) => {
      removeOwnedMaterial(itemName);
      toast.success(`Removed ${itemName} from owned materials.`);
    },
    [removeOwnedMaterial],
  );

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

      {/* Section for managing owned materials */}
      <div className='owned-materials-section card'>
        <h3>Materials on Hand</h3>
        <div className='add-material-form'>
          <input
            type='text'
            placeholder='Material Name'
            value={newOwnedMaterialName}
            onChange={(e) => setNewOwnedMaterialName(e.target.value)}
          />
          <input
            type='number'
            placeholder='Quantity'
            value={newOwnedMaterialQuantity}
            onChange={(e) =>
              setNewOwnedMaterialQuantity(Number(e.target.value))
            }
            min='1'
          />
          <button onClick={handleAddOwnedMaterial}>Add Material</button>
        </div>

        {ownedMaterials.length > 0 && (
          <ul className='owned-materials-list'>
            {ownedMaterials.map((material) => (
              <li key={material.itemName} className='owned-material-item'>
                <span>
                  {material.itemName} (x{material.quantity})
                </span>
                <div className='material-actions'>
                  <input
                    type='number'
                    value={material.quantity === 0 ? '' : material.quantity} /* Display empty string for 0 to allow backspacing */
                    onChange={(e) =>
                      handleUpdateOwnedMaterialQuantity(
                        material.itemName,
                        e.target.value,
                      )
                    }
                    min='0'
                  />
                  <button
                    onClick={() => handleRemoveOwnedMaterial(material.itemName)}
                    className='remove-material-btn'
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {ownedMaterials.length === 0 && (
          <p>No materials on hand. Add some above!</p>
        )}
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