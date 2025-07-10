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

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const indentation = { marginLeft: `${depth * 20}px` };

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
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <span className={node.isCrafted ? 'crafted-item' : 'raw-material'}>
          {node.itemName} (x{node.quantity})
        </span>

        {!node.isCrafted && (
          <span className='node-type-label'> [Raw Material]</span>
        )}
        {/* Simplified check for cycle in display, as isCyclic is now on the node */}
        {node.isCyclic &&
          node.itemName !== 'CYCLE DETECTED!' && ( // ✅ Display only for the actual cyclic item
            <span className='cycle-detected-label'> [Cyclic Dependency!]</span>
          )}
      </div>

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

const CraftingTreeViewer: React.FC = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const [selectedRootItem, setSelectedRootItem] = useState<string>('');
  const [craftingTree, setCraftingTree] = useState<TreeNode | null>(null);
  const [totalRawMaterials, setTotalRawMaterials] = useState<
    Map<string, number>
  >(new Map());
  const [detectedCycles, setDetectedCycles] = useState<string[][]>([]); // ✅ New state for detected cycles

  const blacksmithingRecipes = recipes.filter(
    (recipe) => recipe.acquisition.type === 'blacksmithing',
  ) as (Recipe & { acquisition: BlacksmithingAcquisition })[];

  useEffect(() => {
    if (selectedRootItem) {
      const { tree, cycles } = buildCraftingTree(selectedRootItem, recipes); // ✅ Destructure result
      setCraftingTree(tree);
      setDetectedCycles(cycles); // ✅ Set detected cycles

      if (tree) {
        setTotalRawMaterials(calculateTotalRawMaterials(tree));
      } else {
        setTotalRawMaterials(new Map());
      }
    } else {
      setCraftingTree(null);
      setTotalRawMaterials(new Map());
      setDetectedCycles([]); // ✅ Clear cycles
    }
  }, [selectedRootItem, recipes]);

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

      {/* ✅ NEW: Display Detected Cycles */}
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

      {/* Crafting Tree Display */}
      {craftingTree && (
        <div className='crafting-tree-display'>
          <h3>Tree for: {craftingTree.itemName}</h3>
          <ul className='tree-root'>
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
