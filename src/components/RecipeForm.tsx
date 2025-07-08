// src/components/RecipeForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import { useRecipeFormStore } from '../store/useRecipeFormStore'; // ✅ Ensure this import is correct and file exists
import { ItemType } from '../types';
import type {
  Recipe,
  AcquisitionType,
  Ingredient,
  MobDropAcquisition,
  BlacksmithingAcquisition,
} from '../types';

// Define a type for the form state to match Recipe structure more closely
// but with optional fields based on acquisition type
interface RecipeFormState {
  itemName: string;
  itemType: (typeof ItemType)[keyof typeof ItemType]; // Use the derived ItemType
  acquisitionType: AcquisitionType;
  // Blacksmithing
  ingredients: Ingredient[];
  smithingSkillRequired?: number;
  // Mob Drop
  mobSources: {
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion';
    floor: number;
  }[];
  // Merchant
  itemWorthCol?: number;
  merchantFloor?: number;
  // Mining
  mineableFloor?: number;
  // Quest Rewards
  questName: string;
  questFloor?: number;
}

const initialFormData: RecipeFormState = {
  itemName: '',
  itemType: ItemType.Items, // Default to a valid ItemType from your enum
  acquisitionType: 'blacksmithing',
  ingredients: [],
  smithingSkillRequired: undefined,
  mobSources: [],
  itemWorthCol: undefined,
  merchantFloor: undefined,
  mineableFloor: undefined,
  questName: '',
  questFloor: undefined,
};

interface Errors {
  itemName?: string;
  itemType?: string;
  acquisitionType?: string;
  // Blacksmithing
  ingredients?: string;
  smithingSkillRequired?: string;
  // Mob Drop
  mobSources?: string;
  // Merchant
  itemWorthCol?: string;
  merchantFloor?: string;
  // Mining
  mineableFloor?: string;
  // Quest Rewards
  questName?: string;
  questFloor?: string;
}

const RecipeForm: React.FC = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipeStore();
  // Get recipeToEdit and setRecipeToEdit from the form store
  const { recipeToEdit, setRecipeToEdit } = useRecipeFormStore();

  const [formData, setFormData] = useState<RecipeFormState>(initialFormData);
  const [oldItemName, setOldItemName] = useState<string | null>(null); // To track original name during edit
  const [errors, setErrors] = useState<Errors>({});

  // Populate form when recipeToEdit changes (for editing)
  useEffect(() => {
    if (recipeToEdit) {
      setOldItemName(recipeToEdit.itemName);
      // Map recipeToEdit to formData. Ensure all fields are correctly mapped.
      setFormData({
        itemName: recipeToEdit.itemName,
        itemType: recipeToEdit.itemType,
        acquisitionType: recipeToEdit.acquisition.type,
        // Cast based on type for specific acquisition properties
        ingredients:
          recipeToEdit.acquisition.type === 'blacksmithing'
            ? (recipeToEdit.acquisition as BlacksmithingAcquisition).ingredients
            : [],
        smithingSkillRequired:
          recipeToEdit.acquisition.type === 'blacksmithing'
            ? (recipeToEdit.acquisition as BlacksmithingAcquisition)
                .smithingSkillRequired
            : undefined,
        mobSources:
          recipeToEdit.acquisition.type === 'mob-drop'
            ? (recipeToEdit.acquisition as MobDropAcquisition).mobSources
            : [],
        itemWorthCol:
          recipeToEdit.acquisition.type === 'merchant'
            ? recipeToEdit.acquisition.itemWorthCol
            : undefined,
        merchantFloor:
          recipeToEdit.acquisition.type === 'merchant'
            ? recipeToEdit.acquisition.merchantFloor
            : undefined,
        mineableFloor:
          recipeToEdit.acquisition.type === 'mining'
            ? recipeToEdit.acquisition.mineableFloor
            : undefined,
        questName:
          recipeToEdit.acquisition.type === 'quest-rewards'
            ? recipeToEdit.acquisition.questName
            : '',
        questFloor:
          recipeToEdit.acquisition.type === 'quest-rewards'
            ? recipeToEdit.acquisition.questFloor
            : undefined,
      });
    } else {
      // Clear form when recipeToEdit is null
      setFormData(initialFormData);
      setOldItemName(null);
    }
  }, [recipeToEdit]);

  // ✅ FIX: itemName validation useEffect
  useEffect(() => {
    // Only validate if itemName has content or if it's being cleared from a previous error
    if (formData.itemName.trim() === '') {
      // If it's empty, and we're not in an initial edit load where it might be empty temporarily
      // This condition ensures we only show "required" error when appropriate
      if (
        recipeToEdit &&
        formData.itemName === recipeToEdit.itemName &&
        recipeToEdit.itemName.trim() !== ''
      ) {
        // Do nothing if it's the original name and not empty, but we somehow triggered this.
        // This case might be tricky, ensuring 'required' doesn't pop up immediately on load.
        // For simplicity, let's keep it as is, or adjust logic to be more robust.
      } else {
        setErrors((prev) => ({ ...prev, itemName: 'Item name is required.' }));
      }
    } else {
      const isDuplicate = recipes.some(
        (recipe) =>
          recipe.itemName.toLowerCase() === formData.itemName.toLowerCase() &&
          recipe.itemName !== oldItemName,
      );
      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          itemName: 'Recipe with this name already exists.',
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.itemName;
          return newErrors;
        });
      }
    }
  }, [formData.itemName, recipes, oldItemName, recipeToEdit]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target; // 'type' is no longer destructured here, as per previous fix

      setFormData((prevData) => {
        let updatedValue: string | number | undefined | AcquisitionType = value;

        if (name === 'itemName') {
          updatedValue = value;
        } else if (name === 'acquisitionType') {
          // ✅ FIX: Explicitly specify acquisitionType in the return object when type changes
          // This makes the type clear to TypeScript for this specific branch
          return {
            ...prevData,
            acquisitionType: value as AcquisitionType, // Make sure it's explicitly cast here too
            // Reset acquisition-specific fields when type changes
            ingredients: [],
            smithingSkillRequired: undefined,
            mobSources: [],
            itemWorthCol: undefined,
            merchantFloor: undefined,
            mineableFloor: undefined,
            questName: '',
            questFloor: undefined,
          };
        } else if (
          [
            'smithingSkillRequired',
            'itemWorthCol',
            'merchantFloor',
            'mineableFloor',
            'questFloor',
          ].includes(name)
        ) {
          // Convert number inputs, handle empty string as undefined
          updatedValue = value === '' ? undefined : Number(value);
        }

        // For all other cases, return the updated prevData
        return { ...prevData, [name]: updatedValue };
      });
    },
    [], // Dependencies are empty because state setters and primitive types are stable
  );

  const handleIngredientChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const newIngredients = [...formData.ingredients];
      newIngredients[index] = { ...newIngredients[index], [name]: value };

      setFormData((prevData) => ({
        ...prevData,
        ingredients: newIngredients,
      }));
    },
    [formData.ingredients],
  );

  const handleAddIngredient = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      ingredients: [...prevData.ingredients, { name: '', quantity: 1 }],
    }));
  }, []);

  const handleRemoveIngredient = useCallback((index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      ingredients: prevData.ingredients.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMobSourceChange = useCallback(
    (
      index: number,
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      // ✅ FIX: Destructure 'type' from e.target
      const { name, value, type } = e.target;
      const newMobSources = [...formData.mobSources];
      // ✅ FIX: Use 'type' for conditional number conversion
      newMobSources[index] = {
        ...newMobSources[index],
        [name]: type === 'number' ? Number(value) : value,
      };

      setFormData((prevData) => ({
        ...prevData,
        mobSources: newMobSources,
      }));
    },
    [formData.mobSources],
  );

  const handleAddMobSource = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      mobSources: [
        ...prevData.mobSources,
        { mobName: '', mobType: 'Minion', floor: 1 }, // Default mobType
      ],
    }));
  }, []);

  const handleRemoveMobSource = useCallback((index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      mobSources: prevData.mobSources.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback(() => {
    let newErrors: Errors = {};
    let isValid = true;

    // Item Name validation (now also handled by useEffect, but re-checked on submit)
    if (formData.itemName.trim() === '') {
      newErrors.itemName = 'Item name is required.';
      isValid = false;
    } else {
      const isDuplicate = recipes.some(
        (recipe) =>
          recipe.itemName.toLowerCase() === formData.itemName.toLowerCase() &&
          recipe.itemName !== oldItemName,
      );
      if (isDuplicate) {
        newErrors.itemName = 'Recipe with this name already exists.';
        isValid = false;
      }
    }

    // Acquisition specific validations
    if (formData.acquisitionType === 'blacksmithing') {
      if (formData.ingredients.length === 0) {
        newErrors.ingredients = 'At least one ingredient is required.';
        isValid = false;
      } else if (
        formData.ingredients.some(
          (ing) => ing.name.trim() === '' || ing.quantity <= 0,
        )
      ) {
        newErrors.ingredients =
          'All ingredients must have a name and quantity greater than 0.';
        isValid = false;
      }
    } else if (formData.acquisitionType === 'mob-drop') {
      if (formData.mobSources.length === 0) {
        newErrors.mobSources = 'At least one mob source is required.';
        isValid = false;
      } else if (
        formData.mobSources.some(
          (source) => source.mobName.trim() === '' || source.floor <= 0,
        )
      ) {
        newErrors.mobSources =
          'All mob sources must have a name and floor greater than 0.';
        isValid = false;
      }
    } else if (formData.acquisitionType === 'merchant') {
      if (formData.itemWorthCol === undefined || formData.itemWorthCol <= 0) {
        newErrors.itemWorthCol =
          'Item worth (Col) is required and must be greater than 0.';
        isValid = false;
      }
      if (formData.merchantFloor === undefined || formData.merchantFloor <= 0) {
        newErrors.merchantFloor =
          'Merchant floor is required and must be greater than 0.';
        isValid = false;
      }
    } else if (formData.acquisitionType === 'mining') {
      if (formData.mineableFloor === undefined || formData.mineableFloor <= 0) {
        newErrors.mineableFloor =
          'Mineable floor is required and must be greater than 0.';
        isValid = false;
      }
    } else if (formData.acquisitionType === 'quest-rewards') {
      if (formData.questName.trim() === '') {
        newErrors.questName = 'Quest name is required.';
        isValid = false;
      }
      if (formData.questFloor === undefined || formData.questFloor <= 0) {
        newErrors.questFloor =
          'Quest floor is required and must be greater than 0.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, recipes, oldItemName]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        console.error('Form validation failed:', errors);
        return;
      }

      const newRecipe: Recipe = {
        itemName: formData.itemName,
        itemType: formData.itemType,
        acquisition: {
          type: formData.acquisitionType,
          ...(formData.acquisitionType === 'blacksmithing' && {
            ingredients: formData.ingredients,
            smithingSkillRequired: formData.smithingSkillRequired,
          }),
          ...(formData.acquisitionType === 'mob-drop' && {
            mobSources: formData.mobSources,
          }),
          ...(formData.acquisitionType === 'merchant' && {
            itemWorthCol: formData.itemWorthCol,
            merchantFloor: formData.merchantFloor,
          }),
          ...(formData.acquisitionType === 'mining' && {
            mineableFloor: formData.mineableFloor,
          }),
          ...(formData.acquisitionType === 'quest-rewards' && {
            questName: formData.questName,
            questFloor: formData.questFloor,
          }),
        } as Recipe['acquisition'], // Cast to ensure correct union type based on 'type'
      };

      if (recipeToEdit && oldItemName) {
        updateRecipe(oldItemName, newRecipe);
        setRecipeToEdit(null); // Clear edit mode
        setOldItemName(null);
        alert(`Recipe "${newRecipe.itemName}" updated successfully!`);
      } else {
        addRecipe(newRecipe);
        alert(`Recipe "${newRecipe.itemName}" added successfully!`);
      }
      setFormData(initialFormData); // Clear form after submission
    },
    [
      formData,
      validateForm,
      addRecipe,
      updateRecipe,
      recipeToEdit,
      setRecipeToEdit,
      oldItemName,
      errors, // Include errors in dependencies to log them correctly on validation fail
    ],
  );

  const renderAcquisitionFields = useCallback(() => {
    switch (formData.acquisitionType) {
      case 'blacksmithing':
        return (
          <div className='form-section'>
            <h3>Blacksmithing Details</h3>
            <div className='form-group'>
              {' '}
              {/* Add this div */}           {' '}
              <label htmlFor='smithingSkillRequired'>
                              Smithing Skill Required:            {' '}
              </label>
                         {' '}
              <input
                type='number'
                id='smithingSkillRequired'
                name='smithingSkillRequired'
                value={formData.smithingSkillRequired || ''}
                onChange={handleChange}
                min='0'
              />
                         {' '}
              {errors.smithingSkillRequired && (
                <p className='error-message'>{errors.smithingSkillRequired}</p>
              )}
                       {' '}
            </div>{' '}
            {/* Close this div */}
            <h4>Ingredients</h4>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className='ingredient-item'>
                <input
                  type='text'
                  name='name'
                  placeholder='Ingredient Name'
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, e)}
                />
                <input
                  type='number'
                  name='quantity'
                  placeholder='Quantity'
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, e)}
                  min='1'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveIngredient(index)}
                  className='remove-btn'
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={handleAddIngredient}
              className='add-btn'
            >
              Add Ingredient
            </button>
            {errors.ingredients && (
              <p className='error-message'>{errors.ingredients}</p>
            )}
          </div>
        );
      case 'mob-drop':
        return (
          <div className='form-section'>
            <h3>Mob Drop Details</h3>
            <h4>Mob Sources</h4>
            {formData.mobSources.map((source, index) => (
              <div key={index} className='mob-source-item'>
                <input
                  type='text'
                  name='mobName'
                  placeholder='Mob Name'
                  value={source.mobName}
                  onChange={(e) => handleMobSourceChange(index, e)}
                />
                <select
                  name='mobType'
                  value={source.mobType}
                  onChange={(e) => handleMobSourceChange(index, e)}
                >
                  <option value='Minion'>Minion</option>
                  <option value='Miniboss'>Miniboss</option>
                  <option value='Boss'>Boss</option>
                </select>
                <input
                  type='number'
                  name='floor'
                  placeholder='Floor'
                  value={source.floor}
                  onChange={(e) => handleMobSourceChange(index, e)}
                  min='1'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveMobSource(index)}
                  className='remove-btn'
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={handleAddMobSource}
              className='add-btn'
            >
              Add Mob Source
            </button>
            {errors.mobSources && (
              <p className='error-message'>{errors.mobSources}</p>
            )}
          </div>
        );
      case 'merchant':
        return (
          <div className='form-section'>
            <h3>Merchant Details</h3>
            <label htmlFor='itemWorthCol'>Item Worth (Col):</label>
            <input
              type='number'
              id='itemWorthCol'
              name='itemWorthCol'
              value={formData.itemWorthCol || ''}
              onChange={handleChange}
              min='0'
            />
            {errors.itemWorthCol && (
              <p className='error-message'>{errors.itemWorthCol}</p>
            )}

            <label htmlFor='merchantFloor'>Merchant Floor:</label>
            <input
              type='number'
              id='merchantFloor'
              name='merchantFloor'
              value={formData.merchantFloor || ''}
              onChange={handleChange}
              min='1'
            />
            {errors.merchantFloor && (
              <p className='error-message'>{errors.merchantFloor}</p>
            )}
          </div>
        );
      case 'mining':
        return (
          <div className='form-section'>
            <h3>Mining Details</h3>
            <label htmlFor='mineableFloor'>Mineable Floor:</label>
            <input
              type='number'
              id='mineableFloor'
              name='mineableFloor'
              value={formData.mineableFloor || ''}
              onChange={handleChange}
              min='1'
            />
            {errors.mineableFloor && (
              <p className='error-message'>{errors.mineableFloor}</p>
            )}
          </div>
        );
      case 'quest-rewards':
        return (
          <div className='form-section'>
            <h3>Quest Reward Details</h3>
            <label htmlFor='questName'>Quest Name:</label>
            <input
              type='text'
              id='questName'
              name='questName'
              value={formData.questName}
              onChange={handleChange}
            />
            {errors.questName && (
              <p className='error-message'>{errors.questName}</p>
            )}

            <label htmlFor='questFloor'>Quest Floor:</label>
            <input
              type='number'
              id='questFloor'
              name='questFloor'
              value={formData.questFloor || ''}
              onChange={handleChange}
              min='1'
            />
            {errors.questFloor && (
              <p className='error-message'>{errors.questFloor}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [
    formData,
    handleChange,
    handleIngredientChange,
    handleAddIngredient,
    handleRemoveIngredient,
    handleMobSourceChange,
    handleAddMobSource,
    handleRemoveMobSource,
    errors,
  ]);

  return (
    <div className='recipe-form-container card'>
      <h2>{recipeToEdit ? 'Edit Recipe' : 'Define New Recipe'}</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-section'>
          <div className='form-group'>
            {' '}
            {/* Add this div */}       {' '}
            <label htmlFor='itemName'>Item Name:</label>       {' '}
            <input
              type='text'
              id='itemName'
              name='itemName'
              value={formData.itemName}
              onChange={handleChange}
            />
                   {' '}
            {errors.itemName && (
              <p className='error-message'>{errors.itemName}</p>
            )}
                 {' '}
          </div>{' '}
          {/* Close this div */}
          <div className='form-group'>
                    <label htmlFor='itemType'>Item Type:</label>       {' '}
            <select
              id='itemType'
              name='itemType'
              value={formData.itemType}
              onChange={handleChange}
            >
                       {' '}
              {Object.values(ItemType).map((type) => (
                <option key={type} value={type}>
                                {type}           {' '}
                </option>
              ))}
                     {' '}
            </select>
                   {' '}
            {errors.itemType && (
              <p className='error-message'>{errors.itemType}</p>
            )}
                 {' '}
          </div>
          <div className='form-group'>
                    <label htmlFor='acquisitionType'>Acquisition Type:</label> 
                 {' '}
            <select
              id='acquisitionType'
              name='acquisitionType'
              value={formData.acquisitionType}
              onChange={handleChange}
            >
                        <option value='blacksmithing'>Blacksmithing</option>   
                    <option value='mob-drop'>Mob Drop</option>         {' '}
              <option value='merchant'>Merchant</option>         {' '}
              <option value='mining'>Mining</option>         {' '}
              <option value='quest-rewards'>Quest Rewards</option>       {' '}
            </select>
                   {' '}
            {errors.acquisitionType && (
              <p className='error-message'>{errors.acquisitionType}</p>
            )}
                 {' '}
          </div>
        </div>

        {renderAcquisitionFields()}

        <button type='submit' className='submit-btn'>
          {recipeToEdit ? 'Update Recipe' : 'Add Recipe'}
        </button>
        {recipeToEdit && (
          <button
            type='button'
            onClick={() => setRecipeToEdit(null)}
            className='cancel-btn'
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default RecipeForm;
