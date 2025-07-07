// src/components/RecipeList.tsx
import React from 'react';
import type { Recipe, Acquisition } from '../types'; // Use type-only import
import { useRecipeStore } from '../store/useRecipeStore';

interface RecipeListProps {
  onEditRecipe: (recipeName: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ onEditRecipe }) => {
  const recipes = useRecipeStore((state) => state.recipes);
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);
  const selectedRecipeIds = useRecipeStore((state) => state.selectedRecipeIds);
  const toggleRecipeSelection = useRecipeStore(
    (state) => state.toggleRecipeSelection,
  );
  const clearRecipeSelection = useRecipeStore(
    (state) => state.clearRecipeSelection,
  );
  const deleteSelectedRecipes = useRecipeStore(
    (state) => state.deleteSelectedRecipes,
  );

  // Helper to display acquisition details
  const getAcquisitionDetails = (acquisition: Acquisition): string => {
    switch (acquisition.type) {
      case 'blacksmithing':
        const ingredients = acquisition.ingredients
          .map((i) => `${i.name} x${i.quantity}`)
          .join(', ');
        return (
          `Blacksmithing (Ingredients: ${ingredients})` +
          (acquisition.smithingSkillRequired
            ? ` | Skill: ${acquisition.smithingSkillRequired}`
            : '')
        );
      case 'mob_drop':
        const sources = acquisition.sources
          .map((s) => `${s.mobName} (F${s.floor})`)
          .join(', ');
        return (
          `Mob Drop (Sources: ${sources})` +
          (acquisition.dropType ? ` | Type: ${acquisition.dropType}` : '')
        );
      case 'merchant':
        return (
          `Merchant (Worth: ${acquisition.itemWorth || 'N/A'})` +
          (acquisition.merchantLocation
            ? ` | Loc: ${acquisition.merchantLocation}`
            : '')
        );
      case 'mining':
        return `Mining (Floor: ${acquisition.mineableFloor || 'N/A'})`;
      default:
        return `Unknown Acquisition`;
    }
  };

  const handleToggleAllSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all if not all are selected, otherwise clear all
      if (selectedRecipeIds.size < recipes.length) {
        recipes.forEach((recipe) => toggleRecipeSelection(recipe.itemName));
      }
    } else {
      clearRecipeSelection();
    }
  };

  const isAllSelected =
    recipes.length > 0 && selectedRecipeIds.size === recipes.length;

  return (
    <div className='recipes-list-container'>
      <div
        className='recipes-list-header'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-unit)',
        }}
      >
        <h2>Defined Recipes ({recipes.length})</h2>
        {recipes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type='checkbox'
              id='selectAllRecipes'
              checked={isAllSelected}
              onChange={handleToggleAllSelection}
              style={{ cursor: 'pointer' }}
            />
            <label
              htmlFor='selectAllRecipes'
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Select All
            </label>
            {selectedRecipeIds.size > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete ${selectedRecipeIds.size} selected recipe(s)?`,
                    )
                  ) {
                    deleteSelectedRecipes();
                  }
                }}
                className='btn secondary-btn delete-selected-btn'
                style={{ backgroundColor: 'var(--color-error)' }}
              >
                <i className='fas fa-trash-alt'></i> Delete Selected (
                {selectedRecipeIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {recipes.length === 0 ? (
        <p>
          No recipes defined yet. Use the form above to add your first recipe!
        </p>
      ) : (
        <ul className='recipes-list'>
          {recipes.map((recipe) => (
            <li
              key={recipe.itemName}
              className='card recipe-item'
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <input
                type='checkbox'
                checked={selectedRecipeIds.has(recipe.itemName)}
                onChange={() => toggleRecipeSelection(recipe.itemName)}
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
              />
              <div style={{ flexGrow: 1 }}>
                <h3>
                  {recipe.itemName}{' '}
                  <span className='item-type-tag'>({recipe.itemType})</span>
                </h3>
                <p className='acquisition-details-text'>
                  {getAcquisitionDetails(recipe.acquisition)}
                </p>
              </div>
              <div
                className='recipe-actions'
                style={{ display: 'flex', gap: '8px' }}
              >
                <button
                  onClick={() => onEditRecipe(recipe.itemName)}
                  className='btn primary-btn btn-sm'
                >
                  <i className='fas fa-edit'></i> Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete "${recipe.itemName}"?`,
                      )
                    ) {
                      deleteRecipe(recipe.itemName);
                    }
                  }}
                  className='btn secondary-btn btn-sm'
                  style={{ backgroundColor: 'var(--color-error)' }}
                >
                  <i className='fas fa-trash-alt'></i> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecipeList;
