// src/components/RecipeForm.tsx
import React, { useState, useEffect } from 'react';
import type {
  // <-- ensure 'type' is here for all type imports
  Recipe,
  Ingredient,
  Acquisition,
  BlacksmithingAcquisition,
  MobDropAcquisition,
  MerchantAcquisition,
  MiningAcquisition,
} from '../types';
import { useRecipeStore } from '../store/useRecipeStore';

// Helper function to generate a unique ID for temporary keys (e.g., ingredients, mob sources)
let tempIdCounter = 0;
const generateUniqueTempId = () => `temp-${tempIdCounter++}`;

interface RecipeFormProps {
  editingItemName: string | null;
  onFormReset: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  editingItemName,
  onFormReset,
}) => {
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);
  const recipes = useRecipeStore((state) => state.recipes); // Used for finding recipe to edit

  // State for the form fields
  const [itemName, setItemName] = useState<string>('');
  const [itemType, setItemType] = useState<string>('');
  const [acquisitionType, setAcquisitionType] = useState<
    Acquisition['type'] | ''
  >('');

  // State for specific acquisition details
  const [ingredients, setIngredients] = useState<
    (Ingredient & { id: string })[]
  >([]); // Blacksmithing
  const [smithingSkillRequired, setSmithingSkillRequired] = useState<
    number | ''
  >(''); // Blacksmithing
  const [mobSources, setMobSources] = useState<
    (MobDropAcquisition['sources'][0] & { id: string })[]
  >([]); // Mob Drop
  const [dropType, setDropType] = useState<MobDropAcquisition['dropType'] | ''>(
    '',
  ); // Mob Drop
  const [itemWorth, setItemWorth] = useState<number | ''>(''); // Merchant
  const [merchantLocation, setMerchantLocation] = useState<string>(''); // Merchant
  const [mineableFloor, setMineableFloor] = useState<number | ''>(''); // Mining

  // Effect to populate form when editing an existing recipe, or clear it
  useEffect(() => {
    if (editingItemName) {
      const recipeToEdit = recipes.find((r) => r.itemName === editingItemName);
      if (recipeToEdit) {
        setItemName(recipeToEdit.itemName);
        setItemType(recipeToEdit.itemType);
        setAcquisitionType(recipeToEdit.acquisition.type);

        // Reset temporary ID counter before populating for consistent keys during edit
        tempIdCounter = 0;

        // Populate acquisition-specific fields
        switch (recipeToEdit.acquisition.type) {
          case 'blacksmithing':
            setIngredients(
              (
                recipeToEdit.acquisition as BlacksmithingAcquisition
              ).ingredients.map((ing) => ({
                ...ing,
                id: generateUniqueTempId(),
              })),
            );
            setSmithingSkillRequired(
              (recipeToEdit.acquisition as BlacksmithingAcquisition)
                .smithingSkillRequired || '',
            );
            break;
          case 'mob_drop':
            setMobSources(
              (recipeToEdit.acquisition as MobDropAcquisition).sources.map(
                (src) => ({
                  ...src,
                  id: generateUniqueTempId(),
                }),
              ),
            );
            setDropType(
              (recipeToEdit.acquisition as MobDropAcquisition).dropType || '',
            );
            break;
          case 'merchant':
            setItemWorth(
              (recipeToEdit.acquisition as MerchantAcquisition).itemWorth || '',
            );
            setMerchantLocation(
              (recipeToEdit.acquisition as MerchantAcquisition)
                .merchantLocation || '',
            );
            break;
          case 'mining':
            setMineableFloor(
              (recipeToEdit.acquisition as MiningAcquisition).mineableFloor ||
                '',
            );
            break;
        }
      }
    } else {
      // When editingItemName becomes null (i.e., not editing), clear the form
      resetAllFormFields();
    }
  }, [editingItemName, recipes]); // Depend on editingItemName and recipes

  // Function to reset all form fields (internal helper)
  const resetAllFormFields = () => {
    setItemName('');
    setItemType('');
    setAcquisitionType('');
    setIngredients([]);
    setSmithingSkillRequired('');
    setMobSources([]);
    setDropType('');
    setItemWorth('');
    setMerchantLocation('');
    setMineableFloor('');
    tempIdCounter = 0; // Reset counter for new items
  };

  // Public reset function called by parent or on submit/cancel
  const handleResetForm = () => {
    resetAllFormFields();
    onFormReset(); // Notify parent component to clear editing state
  };

  // Handlers for adding/removing ingredients (for blacksmithing)
  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: generateUniqueTempId(), name: '', quantity: 1 },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleIngredientChange = (
    id: string,
    field: 'name' | 'quantity',
    value: string | number,
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id
          ? {
              ...ing,
              [field]: field === 'quantity' ? Number(value) : String(value),
            }
          : ing,
      ),
    );
  };

  // Handlers for adding/removing mob sources
  const handleAddMobSource = () => {
    setMobSources([
      ...mobSources,
      { id: generateUniqueTempId(), mobName: '', floor: 1 },
    ]);
  };

  const handleRemoveMobSource = (id: string) => {
    setMobSources(mobSources.filter((src) => src.id !== id));
  };

  const handleMobSourceChange = (
    id: string,
    field: 'mobName' | 'floor',
    value: string | number,
  ) => {
    setMobSources(
      mobSources.map((src) =>
        src.id === id
          ? {
              ...src,
              [field]: field === 'floor' ? Number(value) : String(value),
            }
          : src,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!itemName || !itemType || !acquisitionType) {
      alert('Please fill in all primary fields.');
      return;
    }

    let acquisition: Acquisition;
    switch (acquisitionType) {
      case 'blacksmithing':
        if (
          ingredients.length === 0 ||
          ingredients.some((ing) => !ing.name || ing.quantity <= 0)
        ) {
          alert(
            'Blacksmithing recipes require at least one valid ingredient with quantity > 0.',
          );
          return;
        }
        acquisition = {
          type: 'blacksmithing',
          ingredients: ingredients.map(({ id, ...rest }) => rest), // Remove temp ID
          smithingSkillRequired:
            smithingSkillRequired !== ''
              ? Number(smithingSkillRequired)
              : undefined,
        } as BlacksmithingAcquisition;
        break;
      case 'mob_drop':
        if (
          mobSources.length === 0 ||
          mobSources.some((src) => !src.mobName || src.floor <= 0)
        ) {
          alert(
            'Mob drop recipes require at least one valid source with floor > 0.',
          );
          return;
        }
        acquisition = {
          type: 'mob_drop',
          sources: mobSources.map(({ id, ...rest }) => rest), // Remove temp ID
          dropType: dropType !== '' ? dropType : undefined,
        } as MobDropAcquisition;
        break;
      case 'merchant':
        acquisition = {
          type: 'merchant',
          itemWorth: itemWorth !== '' ? Number(itemWorth) : undefined,
          merchantLocation: merchantLocation || undefined,
        } as MerchantAcquisition;
        break;
      case 'mining':
        acquisition = {
          type: 'mining',
          mineableFloor:
            mineableFloor !== '' ? Number(mineableFloor) : undefined,
        } as MiningAcquisition;
        break;
      default:
        alert('Please select a valid acquisition type.');
        return;
    }

    const newRecipe: Recipe = {
      itemName,
      itemType,
      acquisition,
    };

    if (editingItemName) {
      updateRecipe(editingItemName, newRecipe);
      alert(`Recipe "${itemName}" updated!`);
    } else {
      addRecipe(newRecipe);
      alert(`Recipe "${itemName}" added!`);
    }

    handleResetForm(); // Call the public reset function
  };

  return (
    <form id='recipe-form' onSubmit={handleSubmit}>
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
          onChange={(e) => setItemType(e.target.value)}
          required
        >
          <option value=''>Select a type</option>
          <option value='Weapon'>Weapon</option>
          <option value='Armor'>Armor</option>
          <option value='Material'>Material</option>
          <option value='Potion'>Potion</option>
          <option value='Key Item'>Key Item</option>
          <option value='Ore'>Ore</option>
          {/* Add more types as needed */}
        </select>
      </div>

      <div className='form-group'>
        <label htmlFor='acquisitionTypeSelect'>Acquisition Type:</label>
        <select
          id='acquisitionTypeSelect'
          value={acquisitionType}
          onChange={(e) => {
            setAcquisitionType(e.target.value as Acquisition['type'] | '');
            // Reset specific acquisition fields when type changes
            setIngredients([]);
            setSmithingSkillRequired('');
            setMobSources([]);
            setDropType('');
            setItemWorth('');
            setMerchantLocation('');
            setMineableFloor('');
            tempIdCounter = 0; // Reset counter for new entries
          }}
          required
        >
          <option value=''>Select an acquisition method</option>
          <option value='blacksmithing'>Blacksmithing (Crafted)</option>
          <option value='mob_drop'>Mob Drop</option>
          <option value='merchant'>Merchant Purchase</option>
          <option value='mining'>Mining</option>
        </select>
      </div>

      {/* Conditional Rendering for Acquisition Details */}
      {acquisitionType === 'blacksmithing' && (
        <div className='acquisition-details'>
          <h3>Blacksmithing Details</h3>
          <div className='form-group'>
            <label htmlFor='smithingSkill'>
              Smithing Skill Required (Optional):
            </label>
            <input
              type='number'
              id='smithingSkill'
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
            <div
              key={ing.id}
              className='ingredient-input-group'
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <input
                type='text'
                placeholder='Ingredient Name'
                value={ing.name}
                onChange={(e) =>
                  handleIngredientChange(ing.id, 'name', e.target.value)
                }
                required
                style={{ flex: 3 }}
              />
              <input
                type='number'
                placeholder='Quantity'
                value={ing.quantity}
                onChange={(e) =>
                  handleIngredientChange(ing.id, 'quantity', e.target.value)
                }
                required
                min='1'
                style={{ flex: 1 }}
              />
              <button
                type='button'
                onClick={() => handleRemoveIngredient(ing.id)}
                className='btn secondary-btn'
                style={{ flex: 0.5 }}
              >
                <i className='fas fa-minus'></i>
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={handleAddIngredient}
            className='btn secondary-btn btn-full-width'
          >
            <i className='fas fa-plus'></i> Add Ingredient
          </button>
        </div>
      )}

      {acquisitionType === 'mob_drop' && (
        <div className='acquisition-details'>
          <h3>Mob Drop Details</h3>
          <div className='form-group'>
            <label htmlFor='dropType'>Drop Type (Optional):</label>
            <select
              id='dropType'
              value={dropType}
              onChange={(e) =>
                setDropType(
                  e.target.value as MobDropAcquisition['dropType'] | '',
                )
              }
            >
              <option value=''>Select Drop Type</option>
              <option value='Material'>Material</option>
              <option value='Equipment'>Equipment</option>
              <option value='Key Item'>Key Item</option>
            </select>
          </div>
          <h4>Mob Sources:</h4>
          {mobSources.map((src) => (
            <div
              key={src.id}
              className='mob-source-input-group'
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <input
                type='text'
                placeholder='Mob Name'
                value={src.mobName}
                onChange={(e) =>
                  handleMobSourceChange(src.id, 'mobName', e.target.value)
                }
                required
                style={{ flex: 3 }}
              />
              <input
                type='number'
                placeholder='Floor'
                value={src.floor}
                onChange={(e) =>
                  handleMobSourceChange(src.id, 'floor', e.target.value)
                }
                required
                min='1'
                style={{ flex: 1 }}
              />
              <button
                type='button'
                onClick={() => handleRemoveMobSource(src.id)}
                className='btn secondary-btn'
                style={{ flex: 0.5 }}
              >
                <i className='fas fa-minus'></i>
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={handleAddMobSource}
            className='btn secondary-btn btn-full-width'
          >
            <i className='fas fa-plus'></i> Add Mob Source
          </button>
        </div>
      )}

      {acquisitionType === 'merchant' && (
        <div className='acquisition-details'>
          <h3>Merchant Details</h3>
          <div className='form-group'>
            <label htmlFor='itemWorth'>Item Worth (Optional):</label>
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
            />
          </div>
          <div className='form-group'>
            <label htmlFor='merchantLocation'>
              Merchant Location (Optional):
            </label>
            <input
              type='text'
              id='merchantLocation'
              value={merchantLocation}
              onChange={(e) => setMerchantLocation(e.target.value)}
            />
          </div>
        </div>
      )}

      {acquisitionType === 'mining' && (
        <div className='acquisition-details'>
          <h3>Mining Details</h3>
          <div className='form-group'>
            <label htmlFor='mineableFloor'>Mineable Floor (Optional):</label>
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

      <button type='submit' className='btn accent-btn btn-full-width'>
        {editingItemName ? 'Update Recipe' : 'Add Recipe'}
      </button>
      {editingItemName && (
        <button
          type='button'
          onClick={handleResetForm}
          className='btn secondary-btn btn-full-width'
          style={{ marginTop: '8px' }}
        >
          Cancel Edit
        </button>
      )}
    </form>
  );
};

export default RecipeForm;
