import React, { useState, useEffect, useCallback } from 'react';
import './RecipeForm.css';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useRecipeFormStore } from '../../store/useRecipeFormStore';
import { ItemType, type ItemTypeType } from '../../types';
import type {
  Recipe,
  AcquisitionType,
  Ingredient,
  MobDropAcquisition,
  BlacksmithingAcquisition,
  Acquisition,
} from '../../types';
import { toast } from 'react-hot-toast';

interface RecipeFormProps {}

interface RecipeFormState {
  itemName: string;
  itemType: ItemTypeType;
  acquisitionType: AcquisitionType;
  ingredients: Ingredient[];
  smithingSkillRequired?: number;
  mobSources: {
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion';
    floor: number;
  }[];
  itemWorthCol?: number;
  merchantFloor?: number;
  mineableFloor?: number;
  questName: string;
  questFloor?: number;
}

const initialFormData: RecipeFormState = {
  itemName: '',
  itemType: ItemType.Items,
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
  ingredients?: string;
  smithingSkillRequired?: string;
  mobSources?: string;
  itemWorthCol?: string;
  merchantFloor?: string;
  mineableFloor?: string;
  questName?: string;
  questFloor?: string;
}

const RecipeForm: React.FC<RecipeFormProps> = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipeStore();
  const { recipeToEdit, setRecipeToEdit } = useRecipeFormStore();

  const [formData, setFormData] = useState<RecipeFormState>(initialFormData);
  const [oldItemName, setOldItemName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (recipeToEdit) {
      setOldItemName(recipeToEdit.itemName);
      setFormData({
        itemName: recipeToEdit.itemName,
        itemType: recipeToEdit.itemType,
        acquisitionType: recipeToEdit.acquisition.type,
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
      setFormData(initialFormData);
      setOldItemName(null);
    }
  }, [recipeToEdit]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;

      setFormData((prevData) => {
        let updatedValue: string | number | undefined | AcquisitionType = value;

        if (name === 'itemName' || name === 'itemType') {
          updatedValue = value;
        } else if (
          [
            'smithingSkillRequired',
            'itemWorthCol',
            'merchantFloor',
            'mineableFloor',
            'questFloor',
          ].includes(name)
        ) {
          updatedValue = value === '' ? undefined : Number(value);
        }

        return { ...prevData, [name]: updatedValue };
      });
    },
    [],
  );

  const handleAcquisitionTypeChange = (type: AcquisitionType) => {
    setFormData((prevData) => ({ ...prevData, acquisitionType: type }));
  };

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
      const { name, value } = e.target;
      const newMobSources = [...formData.mobSources];
      newMobSources[index] = {
        ...newMobSources[index],
        [name]: name === 'floor' ? Number(value) : value,
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
        { mobName: '', mobType: 'Minion', floor: 1 },
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
    const newErrors: Errors = {};
    let isValid = true;

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item Name is required.';
      isValid = false;
    } else if (
      recipes.some(
        (recipe) =>
          recipe.itemName === formData.itemName &&
          recipe.itemName !== oldItemName,
      )
    ) {
      newErrors.itemName = 'Item with this name already exists.';
      isValid = false;
    }

    switch (formData.acquisitionType) {
      case 'blacksmithing':
        if (formData.ingredients.length === 0) {
          newErrors.ingredients = 'At least one ingredient is required.';
          isValid = false;
        }
        for (const ingredient of formData.ingredients) {
          if (!ingredient.name.trim() || ingredient.quantity <= 0) {
            newErrors.ingredients =
              'All ingredients must have a name and a quantity greater than 0.';
            isValid = false;
            break;
          }
        }
        if (
          formData.smithingSkillRequired !== undefined &&
          formData.smithingSkillRequired < 0
        ) {
          newErrors.smithingSkillRequired =
            'Smithing skill cannot be negative.';
          isValid = false;
        }
        break;
      case 'mob-drop':
        if (formData.mobSources.length === 0) {
          newErrors.mobSources = 'At least one mob source is required.';
          isValid = false;
        }
        for (const source of formData.mobSources) {
          if (!source.mobName.trim() || source.floor <= 0) {
            newErrors.mobSources =
              'All mob sources must have a name and a floor greater than 0.';
            isValid = false;
            break;
          }
        }
        break;
      case 'merchant':
        if (formData.itemWorthCol !== undefined && formData.itemWorthCol < 0) {
          newErrors.itemWorthCol = 'Item worth cannot be negative.';
          isValid = false;
        }
        if (
          formData.merchantFloor !== undefined &&
          formData.merchantFloor <= 0
        ) {
          newErrors.merchantFloor = 'Merchant floor must be greater than 0.';
          isValid = false;
        }
        break;
      case 'mining':
        if (
          formData.mineableFloor !== undefined &&
          formData.mineableFloor <= 0
        ) {
          newErrors.mineableFloor = 'Mineable floor must be greater than 0.';
          isValid = false;
        }
        break;
      case 'quest-rewards':
        if (!formData.questName.trim()) {
          newErrors.questName = 'Quest Name is required.';
          isValid = false;
        }
        if (formData.questFloor !== undefined && formData.questFloor <= 0) {
          newErrors.questFloor = 'Quest floor must be greater than 0.';
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, recipes, oldItemName]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error('Please fix the errors before submitting.');
        return;
      }

      let acquisition: Acquisition;

      switch (formData.acquisitionType) {
        case 'blacksmithing':
          acquisition = {
            type: 'blacksmithing',
            ingredients: formData.ingredients,
            smithingSkillRequired: formData.smithingSkillRequired,
          };
          break;
        case 'mob-drop':
          acquisition = {
            type: 'mob-drop',
            mobSources: formData.mobSources,
          };
          break;
        case 'merchant':
          acquisition = {
            type: 'merchant',
            itemWorthCol: formData.itemWorthCol,
            merchantFloor: formData.merchantFloor,
          };
          break;
        case 'mining':
          acquisition = {
            type: 'mining',
            mineableFloor: formData.mineableFloor,
          };
          break;
        case 'quest-rewards':
          acquisition = {
            type: 'quest-rewards',
            questName: formData.questName,
            questFloor: formData.questFloor,
          };
          break;
        default:
          throw new Error('Unknown acquisition type');
      }

      const newRecipe: Recipe = {
        itemName: formData.itemName,
        itemType: formData.itemType,
        acquisition,
      };

      if (recipeToEdit && oldItemName) {
        updateRecipe(oldItemName, newRecipe);
        toast.success(`Recipe "${newRecipe.itemName}" updated successfully!`);
      } else {
        addRecipe(newRecipe);
        toast.success(`Recipe "${newRecipe.itemName}" added successfully!`);
      }
      setRecipeToEdit(null);
      setOldItemName(null);
      setFormData(initialFormData);
    },
    [
      formData,
      validateForm,
      addRecipe,
      updateRecipe,
      recipeToEdit,
      setRecipeToEdit,
      oldItemName,
    ],
  );

  const renderAcquisitionFields = () => {
    switch (formData.acquisitionType) {
      case 'blacksmithing':
        return (
          <div className='acquisition-fields form-section'>
            <h3>Blacksmithing Details</h3>
            <div className='form-group'>
              <label htmlFor='smithingSkillRequired'>
                Smithing Skill Required
              </label>
              <input
                type='number'
                id='smithingSkillRequired'
                name='smithingSkillRequired'
                value={formData.smithingSkillRequired || ''}
                onChange={handleChange}
              />
            </div>
            {errors.smithingSkillRequired && (
              <span className='error-message'>
                {errors.smithingSkillRequired}
              </span>
            )}
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
                >
                  Remove
                </button>
              </div>
            ))}
            {errors.ingredients && (
              <span className='error-message'>{errors.ingredients}</span>
            )}
            <button type='button' onClick={handleAddIngredient}>
              Add Ingredient
            </button>
          </div>
        );
      case 'mob-drop':
        return (
          <div className='acquisition-fields form-section'>
            <h3>Mob Drop Details</h3>
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
                  <option value='Boss'>Boss</option>
                  <option value='Miniboss'>Miniboss</option>
                  <option value='Minion'>Minion</option>
                </select>
                <input
                  type='number'
                  name='floor'
                  placeholder='Floor'
                  value={source.floor}
                  onChange={(e) => handleMobSourceChange(index, e)}
                />
                <button
                  type='button'
                  onClick={() => handleRemoveMobSource(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            {errors.mobSources && (
              <span className='error-message'>{errors.mobSources}</span>
            )}
            <button type='button' onClick={handleAddMobSource}>
              Add Mob Source
            </button>
          </div>
        );
      case 'merchant':
        return (
          <div className='acquisition-fields form-section'>
            <h3>Merchant Details</h3>
            <div className='form-group'>
              <label htmlFor='itemWorthCol'>Item Worth (Col)</label>
              <input
                type='number'
                id='itemWorthCol'
                name='itemWorthCol'
                value={formData.itemWorthCol || ''}
                onChange={handleChange}
              />
            </div>
            {errors.itemWorthCol && (
              <span className='error-message'>{errors.itemWorthCol}</span>
            )}
            <div className='form-group'>
              <label htmlFor='merchantFloor'>Merchant Floor</label>
              <input
                type='number'
                id='merchantFloor'
                name='merchantFloor'
                value={formData.merchantFloor || ''}
                onChange={handleChange}
              />
            </div>
            {errors.merchantFloor && (
              <span className='error-message'>{errors.merchantFloor}</span>
            )}
          </div>
        );
      case 'mining':
        return (
          <div className='acquisition-fields form-section'>
            <h3>Mining Details</h3>
            <div className='form-group'>
              <label htmlFor='mineableFloor'>Mineable Floor</label>
              <input
                type='number'
                id='mineableFloor'
                name='mineableFloor'
                value={formData.mineableFloor || ''}
                onChange={handleChange}
              />
            </div>
            {errors.mineableFloor && (
              <span className='error-message'>{errors.mineableFloor}</span>
            )}
          </div>
        );
      case 'quest-rewards':
        return (
          <div className='acquisition-fields form-section'>
            <h3>Quest Rewards Details</h3>
            <div className='form-group'>
              <label htmlFor='questName'>Quest Name</label>
              <input
                type='text'
                id='questName'
                name='questName'
                value={formData.questName}
                onChange={handleChange}
              />
            </div>
            {errors.questName && (
              <span className='error-message'>{errors.questName}</span>
            )}
            <div className='form-group'>
              <label htmlFor='questFloor'>Quest Floor</label>
              <input
                type='number'
                id='questFloor'
                name='questFloor'
                value={formData.questFloor || ''}
                onChange={handleChange}
              />
            </div>
            {errors.questFloor && (
              <span className='error-message'>{errors.questFloor}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const handleCancelEdit = useCallback(() => {
    setRecipeToEdit(null);
    setOldItemName(null);
    setFormData(initialFormData);
  }, [setRecipeToEdit]);

  return (
    <div className='recipe-form-container card'>
      <h2>{recipeToEdit ? 'Edit Recipe' : 'Define New Recipe'}</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-grid'>
          <div className='form-group'>
            <label htmlFor='itemName'>Item Name</label>
            <input
              type='text'
              id='itemName'
              name='itemName'
              value={formData.itemName}
              onChange={handleChange}
            />
            {errors.itemName && (
              <span className='error-message'>{errors.itemName}</span>
            )}
          </div>
          <div className='form-group'>
            <label htmlFor='itemType'>Item Type</label>
            <select
              id='itemType'
              name='itemType'
              value={formData.itemType}
              onChange={handleChange}
            >
              {Object.values(ItemType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.itemType && (
              <span className='error-message'>{errors.itemType}</span>
            )}
          </div>
        </div>

        <div className='tabs'>
          <button
            type='button'
            className={
              formData.acquisitionType === 'blacksmithing' ? 'active' : ''
            }
            onClick={() => handleAcquisitionTypeChange('blacksmithing')}
          >
            Blacksmithing
          </button>
          <button
            type='button'
            className={formData.acquisitionType === 'mob-drop' ? 'active' : ''}
            onClick={() => handleAcquisitionTypeChange('mob-drop')}
          >
            Mob Drop
          </button>
          <button
            type='button'
            className={formData.acquisitionType === 'merchant' ? 'active' : ''}
            onClick={() => handleAcquisitionTypeChange('merchant')}
          >
            Merchant
          </button>
          <button
            type='button'
            className={formData.acquisitionType === 'mining' ? 'active' : ''}
            onClick={() => handleAcquisitionTypeChange('mining')}
          >
            Mining
          </button>
          <button
            type='button'
            className={
              formData.acquisitionType === 'quest-rewards' ? 'active' : ''
            }
            onClick={() => handleAcquisitionTypeChange('quest-rewards')}
          >
            Quest Rewards
          </button>
        </div>

        <div className='tab-content'>{renderAcquisitionFields()}</div>

        <div className='form-actions'>
          <button type='submit' className='submit-btn'>
            {recipeToEdit ? 'Update Recipe' : 'Add Recipe'}
          </button>
          {recipeToEdit && (
            <button
              type='button'
              onClick={handleCancelEdit}
              className='cancel-btn'
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
