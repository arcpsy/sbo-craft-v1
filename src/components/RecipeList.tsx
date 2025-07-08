// src/components/RecipeList.tsx
import React from 'react';
import type {
  Recipe,
  Acquisition,
  BlacksmithingAcquisition,
  MobDropAcquisition,
  MerchantAcquisition,
  MiningAcquisition,
  QuestRewardAcquisition, // ✅ Import new QuestRewardAcquisition type
} from '../types';
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
  const selectAllRecipes = useRecipeStore((state) => state.selectAllRecipes);

  // Helper function to render acquisition-specific details
  const getAcquisitionDetails = (acquisition: Acquisition) => {
    switch (acquisition.type) {
      case 'blacksmithing':
        const blacksmithingAcq = acquisition as BlacksmithingAcquisition;
        return (
          <>
            <p>
              <strong>Type:</strong> Blacksmithing (Crafted)
            </p>
            {blacksmithingAcq.smithingSkillRequired !== undefined && (
              <p>
                <strong>Skill Required:</strong>{' '}
                {blacksmithingAcq.smithingSkillRequired}
              </p>
            )}
            {blacksmithingAcq.ingredients.length > 0 && (
              <div>
                <strong>Ingredients:</strong>
                <ul>
                  {blacksmithingAcq.ingredients.map((ing, index) => (
                    <li key={index}>
                      {ing.name} (x{ing.quantity})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      case 'mob_drop':
        const mobDropAcq = acquisition as MobDropAcquisition;
        return (
          <>
            <p>
              <strong>Type:</strong> Mob Drop
            </p>
            {mobDropAcq.sources.length > 0 && (
              <div>
                <strong>Sources:</strong>
                <ul>
                  {mobDropAcq.sources.map((source, index) => (
                    <li key={index}>
                      {source.mobName} ({source.mobType}) on F{source.floor}
                      {/* ✅ Updated mob source display with mobType and F prefix */}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      case 'merchant':
        const merchantAcq = acquisition as MerchantAcquisition;
        return (
          <>
            <p>
              <strong>Type:</strong> Merchant Purchase
            </p>
            {merchantAcq.itemWorth !== undefined && (
              <p>
                <strong>Worth:</strong> {merchantAcq.itemWorth} Col{' '}
                {/* ✅ Added Col suffix */}
              </p>
            )}
            {merchantAcq.merchantFloor !== undefined && ( // ✅ Display merchantFloor
              <p>
                <strong>Location:</strong> F{merchantAcq.merchantFloor}
              </p>
            )}
          </>
        );
      case 'mining':
        const miningAcq = acquisition as MiningAcquisition;
        return (
          <>
            <p>
              <strong>Type:</strong> Mining
            </p>
            {miningAcq.mineableFloor !== undefined && (
              <p>
                <strong>Mineable at:</strong> F{miningAcq.mineableFloor}
              </p>
            )}
          </>
        );
      case 'quest_rewards': // ✅ New case for Quest Rewards
        const questRewardAcq = acquisition as QuestRewardAcquisition;
        return (
          <>
            <p>
              <strong>Type:</strong> Quest Rewards
            </p>
            <p>
              <strong>Quest Name:</strong> {questRewardAcq.questName}
            </p>
            {questRewardAcq.questFloor !== undefined && (
              <p>
                <strong>Quest Location:</strong> F{questRewardAcq.questFloor}
              </p>
            )}
          </>
        );
      default:
        return <p>No specific details available.</p>;
    }
  };

  const handleDelete = (itemName: string) => {
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      deleteRecipe(itemName);
    }
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedRecipeIds.size} selected recipes?`,
      )
    ) {
      deleteSelectedRecipes();
    }
  };

  const handleToggleAllSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      selectAllRecipes();
    } else {
      clearRecipeSelection();
    }
  };

  const isAllSelected =
    recipes.length > 0 && selectedRecipeIds.size === recipes.length;
  const isAnySelected = selectedRecipeIds.size > 0;

  return (
    <div className='recipe-list-container'>
      <h2>Defined Recipes ({recipes.length})</h2>
      {recipes.length > 0 && (
        <div className='recipes-summary-header'>
          <label className='select-all-checkbox-label'>
            <input
              type='checkbox'
              onChange={handleToggleAllSelection}
              checked={isAllSelected}
            />{' '}
            Select All
          </label>
          {isAnySelected && (
            <button
              onClick={handleDeleteSelected}
              className='btn secondary-btn delete-selected-btn'
            >
              <i className='fas fa-trash-alt'></i> Delete Selected (
              {selectedRecipeIds.size})
            </button>
          )}
        </div>
      )}

      <ul className='recipes-list'>
        {recipes.length === 0 ? (
          <p>
            No recipes defined yet. Use the form above to add your first recipe!
          </p>
        ) : (
          recipes.map((recipe) => (
            <li key={recipe.itemName} className='recipe-item card'>
              <div className='recipe-header'>
                <input
                  type='checkbox'
                  checked={selectedRecipeIds.has(recipe.itemName)}
                  onChange={() => toggleRecipeSelection(recipe.itemName)}
                  className='recipe-checkbox'
                />
                <h3>{recipe.itemName}</h3>
                <div className='recipe-actions'>
                  <button
                    onClick={() => onEditRecipe(recipe.itemName)}
                    className='btn secondary-btn edit-btn'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.itemName)}
                    className='btn secondary-btn delete-btn'
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className='recipe-details'>
                <p>
                  <strong>Item Type:</strong> {recipe.itemType}
                </p>
                {getAcquisitionDetails(recipe.acquisition)}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RecipeList;
