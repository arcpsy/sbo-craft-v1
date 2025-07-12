import React, { useState } from 'react';
import './RecipeList.css';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useRecipeFormStore } from '../../store/useRecipeFormStore';
import { type Acquisition, type Recipe } from '../../types'; // @ts-ignore
import { ItemType } from '../../types';
import { toast } from 'react-hot-toast';

/**
 * Props for the RecipeList component.
 * Currently, no props are defined, but this interface is kept for future extensibility.
 */
interface RecipeListProps {}

/**
 * RecipeList component displays a list of defined recipes,
 * allowing users to search, filter, select, delete, and edit recipes.
 */
const RecipeList: React.FC<RecipeListProps> = () => {
  // State management from Zustand stores
  const recipes = useRecipeStore((state) => state.recipes);
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);
  const deleteSelectedRecipesFromStore = useRecipeStore(
    (state) => state.deleteSelectedRecipes,
  );
  const setRecipeToEdit = useRecipeFormStore((state) => state.setRecipeToEdit);

  // Local state for UI interactions
  // Stores a set of item names for currently selected recipes (for bulk actions)
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set(),
  );
  // Controls the state of the "Select All" checkbox
  const [selectAll, setSelectAll] = useState(false);
  // Stores the current search term entered by the user
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Stores the currently selected item type for filtering
  const [selectedItemType, setSelectedItemType] = useState<string>('');

  // Stores a set of item names for recipes whose details are currently expanded
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set(),
  );

  /**
   * Toggles the expanded state of a recipe's details.
   * @param itemName The name of the recipe to expand or collapse.
   */
  const handleToggleExpand = (itemName: string) => {
    setExpandedRecipes((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(itemName)) {
        newExpanded.delete(itemName);
      } else {
        newExpanded.add(itemName);
      }
      return newExpanded;
    });
  };

  // Retrieves all possible ItemType values for the filter dropdown
  const allItemTypes = Object.values(ItemType);

  /**
   * Handles the selection/deselection of individual recipes.
   * Updates the `selectedRecipes` set and adjusts the `selectAll` state accordingly.
   * @param itemName The name of the recipe being selected/deselected.
   * @param isChecked The checked state of the checkbox.
   */
  const handleSelectRecipe = (itemName: string, isChecked: boolean) => {
    setSelectedRecipes((currentSelected) => {
      const newSelected = new Set(currentSelected);
      if (isChecked) {
        newSelected.add(itemName);
      } else {
        newSelected.delete(itemName);
      }
      // Determine the number of currently visible (filtered) recipes
      const currentFilteredLength = recipes.filter(
        (recipe) =>
          recipe.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (selectedItemType === '' || recipe.itemType === selectedItemType),
      ).length;
      // Update selectAll checkbox based on whether all filtered recipes are selected
      setSelectAll(
        newSelected.size === currentFilteredLength && currentFilteredLength > 0,
      );
      return newSelected;
    });
  };

  /**
   * Handles the "Select All" checkbox functionality.
   * Selects or deselects all currently filtered recipes.
   * @param isChecked The checked state of the "Select All" checkbox.
   */
  const handleSelectAll = (isChecked: boolean) => {
    setSelectAll(isChecked);
    setSelectedRecipes(() => {
      const newSelected = new Set<string>();
      if (isChecked) {
        // Add all filtered recipe names to the selected set
        filteredRecipes.forEach((recipe) => newSelected.add(recipe.itemName));
      }
      return newSelected;
    });
  };

  /**
   * Initiates the deletion process for all selected recipes.
   * Displays a confirmation toast before proceeding with deletion.
   */
  const handleDeleteSelected = () => {
    if (selectedRecipes.size > 0) {
      toast((t) => (
        <span>
          Delete {selectedRecipes.size} recipes?
          <button
            onClick={() => {
              deleteSelectedRecipesFromStore(Array.from(selectedRecipes));
              setSelectedRecipes(new Set()); // Clear selection after deletion
              setSelectAll(false); // Uncheck select all
              toast.dismiss(t.id);
              toast.success('Recipes deleted.');
            }}
            className='toast-confirm-btn'
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className='toast-cancel-btn'
          >
            Cancel
          </button>
        </span>
      ));
    }
  };

  /**
   * Sets the selected recipe to be edited in the RecipeForm.
   * @param itemName The name of the recipe to edit.
   */
  const handleEditRecipe = (itemName: string) => {
    const recipeFound = recipes.find((r) => r.itemName === itemName);
    if (recipeFound) {
      setRecipeToEdit(recipeFound);
    }
  };

  /**
   * Generates a detailed string description for a given acquisition type.
   * This function helps in displaying specific details based on how an item is acquired.
   * @param acquisition The acquisition object containing type and details.
   * @returns A formatted string describing the acquisition.
   */
  const getAcquisitionDetails = (acquisition: Acquisition): string => {
    switch (acquisition.type) {
      case 'blacksmithing':
        return `Smithing Skill: ${acquisition.smithingSkillRequired || 'N/A'}`;
      case 'mob-drop':
        return `Mob Drop: ${acquisition.mobSources
          .map(
            (source) =>
              `${source.mobName} (${source.mobType}) on F${source.floor}`,
          )
          .join(', ')}`;
      case 'merchant':
        return `Merchant: ${acquisition.itemWorthCol} Col on F${acquisition.merchantFloor}`;
      case 'mining':
        return `Mining: F${acquisition.mineableFloor}`;
      case 'quest-rewards':
        return `Quest: ${acquisition.questName} on F${acquisition.questFloor}`;
      default:
        return 'Unknown Acquisition Type';
    }
  };

  /**
   * Filters the list of recipes based on the current search term and selected item type.
   * This array is used for rendering the visible recipes.
   */
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedItemType === '' || recipe.itemType === selectedItemType),
  );

  return (
    <div className='recipe-list-container card'>
      <h2>Defined Recipes</h2>

      {/* Conditional rendering for search and filter controls */}
      {recipes.length > 0 && (
        <div className='filters-container'>
          {/* Search input for filtering recipes by name */}
          <div className='search-input-wrapper'>
            <span className='search-icon'></span>
            <input
              type='text'
              placeholder='Search recipes by item name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Clear search button, visible when search term is not empty */}
            {searchTerm && (
              <button
                className='clear-search-btn'
                onClick={() => setSearchTerm('')}
              >
                ✖
              </button>
            )}
          </div>
          {/* Dropdown for filtering recipes by item type */}
          <div className='filter-dropdown'>
            <span className='filter-icon'></span>
            <label htmlFor='itemTypeFilter' className='visually-hidden'>
              Filter by Item Type
            </label>
            <select
              id='itemTypeFilter'
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value)}
            >
              <option value=''>All Item Types</option>
              {/* Renders options for each ItemType */}
              {allItemTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages for empty states (no recipes, or no matching recipes) */}
      {filteredRecipes.length === 0 && recipes.length === 0 && (
        <p>No recipes defined yet. Use the form above to add one!</p>
      )}

      {filteredRecipes.length === 0 &&
        recipes.length > 0 &&
        (searchTerm || selectedItemType) && (
          <p>No recipes found matching your criteria.</p>
        )}

      {/* Renders the recipe list and bulk actions if there are filtered recipes */}
      {filteredRecipes.length > 0 && (
        <>
          {/* Controls for selecting all visible recipes and deleting selected */}
          <div className='select-all-container'>
            <input
              type='checkbox'
              id='selectAll'
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              disabled={filteredRecipes.length === 0}
            />
            <label htmlFor='selectAll'>Select All Visible</label>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRecipes.size === 0}
              className='delete-selected-btn'
            >
              Delete Selected ({selectedRecipes.size})
            </button>
          </div>

          {/* List of recipes */}
          <ul className='recipe-list'>
            {filteredRecipes.map((recipe) => {
              const isExpanded = expandedRecipes.has(recipe.itemName);
              return (
                <li key={recipe.itemName} className='recipe-item'>
                  <div
                    className='recipe-header'
                    onClick={() => handleToggleExpand(recipe.itemName)}
                  >
                    {/* Checkbox for individual recipe selection */}
                    <div className='recipe-checkbox-container'>
                      <input
                        type='checkbox'
                        checked={selectedRecipes.has(recipe.itemName)}
                        onChange={(e) =>
                          handleSelectRecipe(recipe.itemName, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()} // Prevent recipe expansion when checkbox is clicked
                      />
                    </div>
                    <h3 className='recipe-title'>{recipe.itemName}</h3>
                    {/* Button to toggle recipe details expansion */}
                    <button
                      className='toggle-details-btn'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent li click from also toggling
                        handleToggleExpand(recipe.itemName);
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>

                  {/* Expanded recipe details, shown only when isExpanded is true */}
                  {isExpanded && (
                    <div className='recipe-details-expanded'>
                      <p>
                        <strong>Type:</strong> {recipe.itemType}
                      </p>
                      <p>
                        <strong>Acquisition:</strong> {recipe.acquisition.type}
                        <br />
                        {/* Displays specific acquisition details based on type */}
                        <span>{getAcquisitionDetails(recipe.acquisition)}</span>
                      </p>
                      {/* Conditionally renders ingredients for blacksmithing recipes */}
                      {recipe.acquisition.type === 'blacksmithing' &&
                        recipe.acquisition.ingredients.length > 0 && (
                          <div className='ingredients-list'>
                            <h4>Ingredients:</h4>
                            <ul>
                              {recipe.acquisition.ingredients.map(
                                (ing, idx) => (
                                  <li key={idx}>
                                    {ing.name} (x{ing.quantity})
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      {/* Action buttons for individual recipes */}
                      <div className='recipe-actions'>
                        <button
                          onClick={() => handleEditRecipe(recipe.itemName)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Confirmation toast for deleting a single recipe
                            toast((t) => (
                              <span>
                                Delete '{recipe.itemName}'?
                                <button
                                  onClick={() => {
                                    deleteRecipe(recipe.itemName);
                                    toast.dismiss(t.id);
                                    toast.success('Recipe deleted.');
                                  }}
                                  className='toast-confirm-btn'
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className='toast-cancel-btn'
                                >
                                  Cancel
                                </button>
                              </span>
                            ));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default RecipeList;
