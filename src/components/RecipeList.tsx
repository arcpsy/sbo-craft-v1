// src/components/RecipeList.tsx
import React, { useState } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import { useRecipeFormStore } from '../store/useRecipeFormStore'; // Import the form store
import type { Acquisition, Recipe } from '../types'; // Also import Recipe type if not already
import { ItemType } from '../types';

// Import the RecipeFormState type to use for the selector
import type { RecipeFormState } from '../store/useRecipeFormStore';

interface RecipeListProps {} // No longer needs onEditRecipe prop directly

const RecipeList: React.FC<RecipeListProps> = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);
  const deleteSelectedRecipesFromStore = useRecipeStore(
    (state) => state.deleteSelectedRecipes,
  );
  // ✅ FIX: Explicitly type 'state' for the useRecipeFormStore selector
  const setRecipeToEdit = useRecipeFormStore(
    (state: RecipeFormState) => state.setRecipeToEdit,
  );

  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');

  const allItemTypes = Object.values(ItemType);

  const handleSelectRecipe = (itemName: string, isChecked: boolean) => {
    setSelectedRecipes((currentSelected) => {
      const newSelected = new Set(currentSelected);
      if (isChecked) {
        newSelected.add(itemName);
      } else {
        newSelected.delete(itemName);
      }
      const currentFilteredLength = recipes.filter(
        (recipe) =>
          recipe.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (selectedItemType === '' || recipe.itemType === selectedItemType),
      ).length;
      setSelectAll(
        newSelected.size === currentFilteredLength && currentFilteredLength > 0,
      );
      return newSelected;
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    setSelectAll(isChecked);
    setSelectedRecipes(() => {
      const newSelected = new Set<string>();
      if (isChecked) {
        filteredRecipes.forEach((recipe) => newSelected.add(recipe.itemName));
      }
      return newSelected;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedRecipes.size > 0) {
      if (
        window.confirm(
          `Are you sure you want to delete ${selectedRecipes.size} selected recipes?`,
        )
      ) {
        deleteSelectedRecipesFromStore(Array.from(selectedRecipes)); // Use the store action
        setSelectedRecipes(new Set()); // Clear local selection after deletion
        setSelectAll(false); // Reset select all checkbox
      }
    }
  };

  // Function to handle editing, uses the form store action
  const handleEditRecipe = (itemName: string) => {
    const recipeFound = recipes.find((r) => r.itemName === itemName);
    if (recipeFound) {
      setRecipeToEdit(recipeFound);
      // Optional: scroll to top or to form for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedItemType === '' || recipe.itemType === selectedItemType),
  );

  return (
    <div className='recipe-list-container card'>
      <h2>Defined Recipes</h2>

      {recipes.length > 0 && (
        <div className='filters-container'>
          {' '}
          <div className='search-bar'>
            <input
              type='text'
              placeholder='Search recipes by name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='filter-dropdown'>
            <label htmlFor='itemTypeFilter' className='visually-hidden'>
              Filter by Item Type
            </label>{' '}
            <select
              id='itemTypeFilter'
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value)}
            >
              <option value=''>All Item Types</option>
              {allItemTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filteredRecipes.length === 0 && recipes.length === 0 && (
        <p>No recipes defined yet. Use the form above to add one!</p>
      )}

      {filteredRecipes.length === 0 &&
        recipes.length > 0 &&
        (searchTerm || selectedItemType) && (
          <p>No recipes found matching your criteria.</p>
        )}

      {filteredRecipes.length > 0 && (
        <>
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

          <ul className='recipe-list'>
            {filteredRecipes.map((recipe) => (
              <li key={recipe.itemName} className='recipe-item'>
                <div className='recipe-checkbox-container'>
                  <input
                    type='checkbox'
                    checked={selectedRecipes.has(recipe.itemName)}
                    onChange={(e) =>
                      handleSelectRecipe(recipe.itemName, e.target.checked)
                    }
                  />
                </div>
                <div className='recipe-details'>
                  <h3>{recipe.itemName}</h3>
                  <p>
                    <strong>Type:</strong> {recipe.itemType}
                  </p>
                  <p>
                    <strong>Acquisition:</strong> {recipe.acquisition.type}{' '}
                    <br />
                    <span>{getAcquisitionDetails(recipe.acquisition)}</span>
                  </p>
                  {recipe.acquisition.type === 'blacksmithing' &&
                    recipe.acquisition.ingredients.length > 0 && (
                      <div className='ingredients-list'>
                        <h4>Ingredients:</h4>
                        <ul>
                          {recipe.acquisition.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              {ing.name} (x{ing.quantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
                <div className='recipe-actions'>
                  <button onClick={() => handleEditRecipe(recipe.itemName)}>
                    Edit
                  </button>
                  {/* ✅ FIX: Added confirmation dialog for individual delete */}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete '${recipe.itemName}'?`,
                        )
                      ) {
                        deleteRecipe(recipe.itemName);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default RecipeList;
