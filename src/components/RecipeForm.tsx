// src/components/RecipeForm.tsx
import React, { useState, useEffect } from 'react';
import type {
  Recipe,
  Ingredient,
  Acquisition,
  ItemType, // ✅ Import ItemType
  AcquisitionType, // ✅ Import AcquisitionType
  BlacksmithingAcquisition,
  MobDropAcquisition,
  MerchantAcquisition,
  MiningAcquisition,
  QuestRewardAcquisition, // ✅ Import new QuestRewardAcquisition
} from '../types';
import { useRecipeStore } from '../store/useRecipeStore';

interface RecipeFormProps {
  editingItemName: string | null;
  onFormReset: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  editingItemName,
  onFormReset,
}) => {
  const recipes = useRecipeStore((state) => state.recipes); // Get all recipes for uniqueness check
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);

  // --- State for core recipe fields ---
  const [itemName, setItemName] = useState<string>('');
  const [itemType, setItemType] = useState<ItemType>('Items'); // Default to 'Items'
  const [acquisitionType, setAcquisitionType] =
    useState<AcquisitionType>('blacksmithing'); // Default to 'blacksmithing'

  // --- State for acquisition-specific fields ---
  // Blacksmithing
  const [ingredients, setIngredients] = useState<
    (Ingredient & { id: string })[]
  >([]);
  const [smithingSkillRequired, setSmithingSkillRequired] = useState<
    number | ''
  >('');

  // Mob Drop
  const [mobSources, setMobSources] = useState<
    ({
      mobName: string;
      mobType: 'Boss' | 'Miniboss' | 'Minion';
      floor: number;
    } & {
      id: string;
    })[]
  >([]);
  // dropType removed based on discussion

  // Merchant
  const [itemWorth, setItemWorth] = useState<number | ''>('');
  const [merchantFloor, setMerchantFloor] = useState<number | ''>(''); // ✅ Added merchantFloor

  // Mining
  const [mineableFloor, setMineableFloor] = useState<number | ''>('');

  // Quest Rewards (✅ New State variables)
  const [questName, setQuestName] = useState<string>('');
  const [questFloor, setQuestFloor] = useState<number | ''>('');

  // --- Helper for generating unique temporary IDs for dynamic lists ---
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const generateUniqueTempId = () => {
    setTempIdCounter((prev) => prev + 1);
    return `temp-${tempIdCounter}`;
  };

  // --- Form Reset Logic ---
  const resetAllFormFields = () => {
    setItemName('');
    setItemType('Items');
    setAcquisitionType('blacksmithing');
    setIngredients([]);
    setSmithingSkillRequired('');
    setMobSources([]);
    setItemWorth('');
    setMerchantFloor(''); // ✅ Reset merchantFloor
    setMineableFloor('');
    setQuestName(''); // ✅ Reset questName
    setQuestFloor(''); // ✅ Reset questFloor
    setTempIdCounter(0); // Reset counter on form clear
  };

  const handleResetForm = () => {
    resetAllFormFields();
    onFormReset(); // Notify parent component (App.tsx) to clear editing state
  };

  // --- Effect for Editing Mode ---
  useEffect(() => {
    if (editingItemName) {
      const recipeToEdit = recipes.find((r) => r.itemName === editingItemName);
      if (recipeToEdit) {
        setItemName(recipeToEdit.itemName);
        setItemType(recipeToEdit.itemType);
        setAcquisitionType(recipeToEdit.acquisition.type);

        // Populate acquisition-specific fields based on type
        switch (recipeToEdit.acquisition.type) {
          case 'blacksmithing':
            const blacksmithingAcq =
              recipeToEdit.acquisition as BlacksmithingAcquisition;
            setIngredients(
              blacksmithingAcq.ingredients.map((ing) => ({
                ...ing,
                id: generateUniqueTempId(),
              })),
            );
            setSmithingSkillRequired(
              blacksmithingAcq.smithingSkillRequired ?? '',
            );
            break;
          case 'mob_drop':
            const mobDropAcq = recipeToEdit.acquisition as MobDropAcquisition;
            setMobSources(
              mobDropAcq.sources.map((source) => ({
                ...source,
                id: generateUniqueTempId(),
              })),
            );
            // dropType removed
            break;
          case 'merchant':
            const merchantAcq = recipeToEdit.acquisition as MerchantAcquisition;
            setItemWorth(merchantAcq.itemWorth ?? '');
            setMerchantFloor(merchantAcq.merchantFloor ?? ''); // ✅ Populate merchantFloor
            break;
          case 'mining':
            const miningAcq = recipeToEdit.acquisition as MiningAcquisition;
            setMineableFloor(miningAcq.mineableFloor ?? '');
            break;
          case 'quest_rewards': // ✅ Populate Quest Rewards fields
            const questRewardAcq =
              recipeToEdit.acquisition as QuestRewardAcquisition;
            setQuestName(questRewardAcq.questName);
            setQuestFloor(questRewardAcq.questFloor ?? '');
            break;
          default:
            break;
        }
      }
    } else {
      // If not editing, reset the form
      resetAllFormFields();
    }
  }, [editingItemName, recipes]); // Depend on editingItemName and recipes for updates

  // --- Handlers for dynamic ingredient lists ---
  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: generateUniqueTempId(), name: '', quantity: 0 },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleIngredientChange = (
    id: string,
    field: 'name' | 'quantity',
    value: string | number,
  ) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id
          ? { ...ing, [field]: field === 'quantity' ? Number(value) : value }
          : ing,
      ),
    );
  };

  // --- Handlers for dynamic mob source lists ---
  const handleAddMobSource = () => {
    setMobSources((prev) => [
      ...prev,
      { id: generateUniqueTempId(), mobName: '', mobType: 'Minion', floor: 0 }, // ✅ Default mobType
    ]);
  };

  const handleRemoveMobSource = (id: string) => {
    setMobSources((prev) => prev.filter((src) => src.id !== id));
  };

  const handleMobSourceChange = (
    id: string,
    field: 'mobName' | 'mobType' | 'floor', // ✅ Updated fields
    value: string | number,
  ) => {
    setMobSources((prev) =>
      prev.map((src) =>
        src.id === id
          ? { ...src, [field]: field === 'floor' ? Number(value) : value }
          : src,
      ),
    );
  };

  // --- Form Submission Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation ---
    if (!itemName.trim() || !itemType || !acquisitionType) {
      alert('Please fill in all core recipe fields.');
      return;
    }

    // Check for unique item name
    const isDuplicateName = recipes.some(
      (r) => r.itemName === itemName && r.itemName !== editingItemName,
    );
    if (isDuplicateName) {
      alert(
        `Recipe with name "${itemName}" already exists. Please use a unique name.`,
      );
      return;
    }

    let acquisition: Acquisition;

    switch (acquisitionType) {
      case 'blacksmithing':
        if (ingredients.length === 0) {
          alert('Blacksmithing recipes must have at least one ingredient.');
          return;
        }
        if (ingredients.some((ing) => !ing.name.trim() || ing.quantity <= 0)) {
          alert(
            'All ingredients must have a name and a quantity greater than 0.',
          );
          return;
        }
        acquisition = {
          type: 'blacksmithing',
          ingredients: ingredients.map(({ id, ...rest }) => rest), // Remove temp id
          smithingSkillRequired: smithingSkillRequired
            ? Number(smithingSkillRequired)
            : undefined,
        };
        break;
      case 'mob_drop':
        if (mobSources.length === 0) {
          alert('Mob drop recipes must have at least one mob source.');
          return;
        }
        if (
          mobSources.some(
            (src) => !src.mobName.trim() || !src.mobType || src.floor <= 0, // ✅ Validate mobType and floor
          )
        ) {
          alert(
            'All mob sources must have a name, type, and floor greater than 0.',
          );
          return;
        }
        acquisition = {
          type: 'mob_drop',
          sources: mobSources.map(({ id, ...rest }) => ({
            ...rest,
            floor: Number(rest.floor), // Ensure floor is number
          })), // Remove temp id
        };
        break;
      case 'merchant':
        if (itemWorth === '' || Number(itemWorth) <= 0) {
          alert('Merchant items must have a worth greater than 0.');
          return;
        }
        if (merchantFloor !== '' && Number(merchantFloor) <= 0) {
          // ✅ Validate merchantFloor
          alert(
            'Merchant floor must be a number greater than 0 or left empty.',
          );
          return;
        }
        acquisition = {
          type: 'merchant',
          itemWorth: Number(itemWorth),
          merchantFloor: merchantFloor ? Number(merchantFloor) : undefined, // ✅ Add merchantFloor
        };
        break;
      case 'mining':
        if (mineableFloor !== '' && Number(mineableFloor) <= 0) {
          alert(
            'Mineable floor must be a number greater than 0 or left empty.',
          );
          return;
        }
        acquisition = {
          type: 'mining',
          mineableFloor: mineableFloor ? Number(mineableFloor) : undefined,
        };
        break;
      case 'quest_rewards': // ✅ Handle new acquisition type
        if (!questName.trim()) {
          alert('Quest reward recipes must have a quest name.');
          return;
        }
        // Unique Quest Name Validation
        const isDuplicateQuestName = recipes.some(
          (r) =>
            r.acquisition.type === 'quest_rewards' &&
            (r.acquisition as QuestRewardAcquisition).questName === questName &&
            r.itemName !== editingItemName, // Allow editing current item without quest name conflict
        );
        if (isDuplicateQuestName) {
          alert(
            `A quest reward with quest name "${questName}" already exists.`,
          );
          return;
        }
        if (questFloor !== '' && Number(questFloor) <= 0) {
          alert('Quest floor must be a number greater than 0 or left empty.');
          return;
        }
        acquisition = {
          type: 'quest_rewards',
          questName: questName,
          questFloor: questFloor ? Number(questFloor) : undefined,
        };
        break;
      default:
        alert('Invalid acquisition type selected.');
        return;
    }

    const newRecipe: Recipe = {
      itemName: itemName,
      itemType: itemType,
      acquisition: acquisition,
    };

    if (editingItemName) {
      updateRecipe(editingItemName, newRecipe);
      alert(`Recipe '${itemName}' updated!`);
    } else {
      addRecipe(newRecipe);
      alert(`Recipe '${itemName}' added!`);
    }

    handleResetForm(); // Clear form after submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='form-group'>
        <label htmlFor='itemName'>Item Name:</label>
        <input
          type='text'
          id='itemName'
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
          disabled={!!editingItemName} // Disable if editing
        />
      </div>

      <div className='form-group'>
        <label htmlFor='itemTypeSelect'>Item Type:</label>
        <select
          id='itemTypeSelect'
          value={itemType}
          onChange={(e) => setItemType(e.target.value as ItemType)}
          required
        >
          {/* ✅ Updated ItemType options */}
          <option value='Items'>Items</option>
          <option value='One Handed'>One Handed</option>
          <option value='Two Handed'>Two Handed</option>
          <option value='Rapier'>Rapier</option>
          <option value='Dagger'>Dagger</option>
          <option value='Lower Headwear'>Lower Headwear</option>
          <option value='Upper Headwear'>Upper Headwear</option>
          <option value='Armor'>Armor</option>
          <option value='Shields'>Shields</option>
          <option value='Overlay'>Overlay</option>
        </select>
      </div>

      <div className='form-group'>
        <label htmlFor='acquisitionTypeSelect'>Acquisition Type:</label>
        <select
          id='acquisitionTypeSelect'
          value={acquisitionType}
          onChange={(e) =>
            setAcquisitionType(e.target.value as AcquisitionType)
          }
          required
        >
          {/* ✅ Updated AcquisitionType options */}
          <option value='blacksmithing'>Blacksmithing (Crafted)</option>
          <option value='mob_drop'>Mob Drop</option>
          <option value='merchant'>Merchant Purchase</option>
          <option value='mining'>Mining</option>
          <option value='quest_rewards'>Quest Rewards</option>{' '}
          {/* ✅ New option */}
        </select>
      </div>

      {/* --- Conditional Fields based on Acquisition Type --- */}
      {acquisitionType === 'blacksmithing' && (
        <div className='acquisition-fields'>
          <h3>Blacksmithing Details</h3>
          <div className='form-group'>
            <label htmlFor='smithingSkillRequired'>
              Smithing Skill Required (Optional):
            </label>
            <input
              type='number'
              id='smithingSkillRequired'
              value={smithingSkillRequired}
              onChange={(e) =>
                setSmithingSkillRequired(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              min='0'
            />
          </div>
          <h4>Ingredients:</h4>
          {ingredients.map((ing) => (
            <div key={ing.id} className='ingredient-item'>
              <input
                type='text'
                placeholder='Ingredient Name'
                value={ing.name}
                onChange={(e) =>
                  handleIngredientChange(ing.id, 'name', e.target.value)
                }
                required
              />
              <input
                type='number'
                placeholder='Quantity'
                value={ing.quantity === 0 ? '' : ing.quantity}
                onChange={(e) =>
                  handleIngredientChange(ing.id, 'quantity', e.target.value)
                }
                min='1'
                required
              />
              <button
                type='button'
                onClick={() => handleRemoveIngredient(ing.id)}
                className='btn secondary-btn remove-btn'
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={handleAddIngredient}
            className='btn secondary-btn'
          >
            Add Ingredient
          </button>
        </div>
      )}

      {acquisitionType === 'mob_drop' && (
        <div className='acquisition-fields'>
          <h3>Mob Drop Details</h3>
          <h4>Mob Sources:</h4>
          {mobSources.map((source) => (
            <div key={source.id} className='mob-source-item'>
              <input
                type='text'
                placeholder='Mob Name'
                value={source.mobName}
                onChange={(e) =>
                  handleMobSourceChange(source.id, 'mobName', e.target.value)
                }
                required
              />
              <select // ✅ Mob Type dropdown
                value={source.mobType}
                onChange={(e) =>
                  handleMobSourceChange(
                    source.id,
                    'mobType',
                    e.target.value as 'Boss' | 'Miniboss' | 'Minion',
                  )
                }
                required
              >
                <option value='Boss'>Boss</option>
                <option value='Miniboss'>Miniboss</option>
                <option value='Minion'>Minion</option>
              </select>
              <input
                type='number'
                placeholder='Floor'
                value={source.floor === 0 ? '' : source.floor}
                onChange={(e) =>
                  handleMobSourceChange(source.id, 'floor', e.target.value)
                }
                min='1'
                required
              />
              <button
                type='button'
                onClick={() => handleRemoveMobSource(source.id)}
                className='btn secondary-btn remove-btn'
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={handleAddMobSource}
            className='btn secondary-btn'
          >
            Add Mob Source
          </button>
        </div>
      )}

      {acquisitionType === 'merchant' && (
        <div className='acquisition-fields'>
          <h3>Merchant Details</h3>
          <div className='form-group'>
            <label htmlFor='itemWorth'>Item Worth (Col):</label>
            <input
              type='number'
              id='itemWorth'
              value={itemWorth}
              onChange={(e) =>
                setItemWorth(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              min='0'
              required
            />
          </div>
          <div className='form-group'>
            {' '}
            {/* ✅ merchantFloor input */}
            <label htmlFor='merchantFloor'>Merchant Floor:</label>
            <input
              type='number'
              id='merchantFloor'
              value={merchantFloor}
              onChange={(e) =>
                setMerchantFloor(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              min='1'
            />
          </div>
        </div>
      )}

      {acquisitionType === 'mining' && (
        <div className='acquisition-fields'>
          <h3>Mining Details</h3>
          <div className='form-group'>
            <label htmlFor='mineableFloor'>Mineable Floor:</label>
            <input
              type='number'
              id='mineableFloor'
              value={mineableFloor}
              onChange={(e) =>
                setMineableFloor(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              min='1'
            />
          </div>
        </div>
      )}

      {acquisitionType === 'quest_rewards' && ( // ✅ New Quest Rewards section
        <div className='acquisition-fields'>
          <h3>Quest Reward Details</h3>
          <div className='form-group'>
            <label htmlFor='questName'>Quest Name:</label>
            <input
              type='text'
              id='questName'
              value={questName}
              onChange={(e) => setQuestName(e.target.value)}
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='questFloor'>Quest Floor:</label>
            <input
              type='number'
              id='questFloor'
              value={questFloor}
              onChange={(e) =>
                setQuestFloor(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              min='1'
            />
          </div>
        </div>
      )}

      <div className='form-actions'>
        <button type='submit' className='btn accent-btn'>
          {editingItemName ? 'Update Recipe' : 'Add Recipe'}
        </button>
        {editingItemName && (
          <button
            type='button'
            onClick={handleResetForm}
            className='btn secondary-btn'
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default RecipeForm;
