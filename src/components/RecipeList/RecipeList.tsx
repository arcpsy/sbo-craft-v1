import React, { useState } from 'react';
import './RecipeList.css';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useRecipeFormStore } from '../../store/useRecipeFormStore';
import { type Acquisition, type Recipe } from '../../types'; // @ts-ignore
import { ItemType } from '../../types';
import { toast } from 'react-hot-toast';

interface RecipeListProps {}

const RecipeList: React.FC<RecipeListProps> = () => {
  const recipes = useRecipeStore((state) => state.recipes);
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);
  const deleteSelectedRecipesFromStore = useRecipeStore(
    (state) => state.deleteSelectedRecipes,
  );
  const setRecipeToEdit = useRecipeFormStore((state) => state.setRecipeToEdit);

  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');

  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set(),
  );

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
      toast((t) => (
        <span>
          Delete {selectedRecipes.size} recipes?
          <button
            onClick={() => {
              deleteSelectedRecipesFromStore(Array.from(selectedRecipes));
              setSelectedRecipes(new Set());
              setSelectAll(false);
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

  const handleEditRecipe = (itemName: string) => {
    const recipeFound = recipes.find((r) => r.itemName === itemName);
    if (recipeFound) {
      setRecipeToEdit(recipeFound);
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
          <div className='search-input-wrapper'>
            <span className='search-icon'></span>
            <input
              type='text'
              placeholder='Search recipes by item name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className='clear-search-btn'
                onClick={() => setSearchTerm('')}
              >
                ✖
              </button>
            )}
          </div>
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
            {filteredRecipes.map((recipe) => {
              const isExpanded = expandedRecipes.has(recipe.itemName);
              return (
                <li key={recipe.itemName} className='recipe-item'>
                  <div
                    className='recipe-header'
                    onClick={() => handleToggleExpand(recipe.itemName)}
                  >
                    <div className='recipe-checkbox-container'>
                      <input
                        type='checkbox'
                        checked={selectedRecipes.has(recipe.itemName)}
                        onChange={(e) =>
                          handleSelectRecipe(recipe.itemName, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()} // Prevent toggle when checkbox is clicked
                      />
                    </div>
                    <h3 className='recipe-title'>{recipe.itemName}</h3>
                    <button
                      className='toggle-details-btn'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent li click
                        handleToggleExpand(recipe.itemName);
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className='recipe-details-expanded'>
                      <p>
                        <strong>Type:</strong> {recipe.itemType}
                      </p>
                      <p>
                        <strong>Acquisition:</strong> {recipe.acquisition.type}
                        <br />
                        <span>{getAcquisitionDetails(recipe.acquisition)}</span>
                      </p>
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
                      <div className='recipe-actions'>
                        <button
                          onClick={() => handleEditRecipe(recipe.itemName)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
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
