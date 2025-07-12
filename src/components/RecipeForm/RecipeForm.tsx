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

/**
 * Props for the RecipeForm component.
 * Currently empty, but can be extended if parent components need to pass data.
 */
interface RecipeFormProps {}

/**
 * Represents a single ingredient for form handling, allowing quantity to be a string.
 */
interface FormIngredient extends Omit<Ingredient, 'quantity'> {
  quantity: number | string;
}

/**
 * Defines the shape of the form data state within the RecipeForm component.
 * This mirrors the `Recipe` type but flattens acquisition-specific fields
 * to manage them uniformly in the form. This allows for a single state object
 * to handle all possible input fields across different acquisition types.
 */
interface RecipeFormState {
  itemName: string;
  itemType: ItemTypeType;
  acquisitionType: AcquisitionType;
  ingredients: FormIngredient[]; // Use FormIngredient
  smithingSkillRequired?: number;
  mobSources: {
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion';
    floor: number | string; // Allow string for input field
  }[];
  itemWorthCol?: number;
  merchantFloor?: number;
  mineableFloor?: number;
  questName: string;
  questFloor?: number;
}

/**
 * Initial state for the `formData` used in the RecipeForm.
 * Ensures the form starts with default values when creating a new recipe,
 * providing a clean slate for user input.
 */
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

/**
 * Defines the shape of the errors object used for form validation.
 * Each property corresponds to a form field that might have a validation error message.
 * This allows for dynamic display of error messages next to their respective input fields.
 */
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

/**
 * `RecipeForm` component allows users to define new crafting recipes or edit existing ones.
 * It dynamically renders input fields based on the selected acquisition type and handles form submission,
 * including validation and interaction with the global recipe store.
 * It serves as the primary interface for managing recipe data within the application.
 */
const RecipeForm: React.FC<RecipeFormProps> = () => {
  // Access global state and actions from the recipe store (Zustand).
  // `recipes` for checking duplicates, `addRecipe` for new entries, `updateRecipe` for modifications.
  const { recipes, addRecipe, updateRecipe } = useRecipeStore();
  // Access state and actions from the recipe form-specific store (Zustand) for managing the recipe being edited.
  // `recipeToEdit` holds the recipe object if in edit mode, `setRecipeToEdit` updates it.
  const { recipeToEdit, setRecipeToEdit } = useRecipeFormStore();

  // Component state for managing form input values.
  const [formData, setFormData] = useState<RecipeFormState>(initialFormData);
  // Stores the original item name when editing a recipe. Used to identify the recipe to update
  // and to correctly handle duplicate name validation.
  const [oldItemName, setOldItemName] = useState<string | null>(null);
  // Stores validation error messages for each form field.
  const [errors, setErrors] = useState<Errors>({});

  /**
   * Effect hook to populate the form when a `recipeToEdit` is set (i.e., when editing an existing recipe).
   * It extracts relevant data from the `recipeToEdit` object and sets the form state.
   * If `recipeToEdit` is null, the form resets to its initial state for new recipe creation.
   * This ensures the form accurately reflects the data of the recipe being edited.
   */
  useEffect(() => {
    if (recipeToEdit) {
      setOldItemName(recipeToEdit.itemName); // Store the original name for updates
      setFormData({
        itemName: recipeToEdit.itemName,
        itemType: recipeToEdit.itemType,
        acquisitionType: recipeToEdit.acquisition.type,
        // Conditionally set acquisition-specific fields based on the acquisition type.
        // Type assertions are used here to safely access properties specific to each acquisition type.
        ingredients:
          recipeToEdit.acquisition.type === 'blacksmithing'
            ? (
                recipeToEdit.acquisition as BlacksmithingAcquisition
              ).ingredients.map((ing) => ({
                // Map to ensure quantity is string for input
                ...ing,
                quantity: ing.quantity.toString(),
              }))
            : [],
        smithingSkillRequired:
          recipeToEdit.acquisition.type === 'blacksmithing'
            ? (recipeToEdit.acquisition as BlacksmithingAcquisition)
                .smithingSkillRequired
            : undefined,
        mobSources:
          recipeToEdit.acquisition.type === 'mob-drop'
            ? (recipeToEdit.acquisition as MobDropAcquisition).mobSources.map(
                (source) => ({
                  // Map to ensure floor is string for input
                  ...source,
                  floor: source.floor.toString(),
                }),
              )
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
      // Reset form for new recipe creation when no recipe is being edited.
      setFormData(initialFormData);
      setOldItemName(null);
    }
  }, [recipeToEdit]); // Re-run effect whenever `recipeToEdit` changes.

  /**
   * Handles changes to general form input fields (text, number, select).
   * This is a memoized callback to prevent unnecessary re-renders of child components.
   * It updates the `formData` state based on the input's `name` and `value`.
   * Converts numeric inputs to `number` or `undefined` as appropriate, ensuring correct data types.
   * @param e The change event from the input element.
   */
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;

      setFormData((prevData) => {
        let updatedValue: string | number | undefined | AcquisitionType = value;

        // Handle specific fields that require number conversion or remain as string.
        // This ensures that number inputs are stored as numbers, not strings.
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
          // Convert to number, or undefined if the input string is empty.
          updatedValue = value === '' ? undefined : Number(value);
        }

        return { ...prevData, [name]: updatedValue };
      });
    },
    [], // Dependencies: No external dependencies, so this function is memoized once.
  );

  /**
   * Handles changes to the acquisition type selection (tabs).
   * Updates the `acquisitionType` in `formData` and implicitly changes
   * which acquisition-specific fields are rendered by `renderAcquisitionFields`.
   * @param type The selected `AcquisitionType` (e.g., 'blacksmithing', 'mob-drop').
   */
  const handleAcquisitionTypeChange = (type: AcquisitionType) => {
    setFormData((prevData) => ({ ...prevData, acquisitionType: type }));
  };

  /**
   * Handles changes to individual ingredient fields within the blacksmithing acquisition type.
   * This is a memoized callback.
   * It updates the `name` or `quantity` of a specific ingredient in the `ingredients` array
   * based on the input field that changed.
   * @param index The index of the ingredient in the `ingredients` array.
   * @param e The change event from the ingredient input element.
   */
  const handleIngredientChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const newIngredients = [...formData.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [name]:
          name === 'quantity' ? (value === '' ? '' : Number(value)) : value, // Handle quantity as string for input
      };

      setFormData((prevData) => ({
        ...prevData,
        ingredients: newIngredients,
      }));
    },
    [formData.ingredients], // Re-create this callback if the `ingredients` array reference changes.
  );

  /**
   * Adds a new empty ingredient row to the `ingredients` array.
   * This is a memoized callback.
   * Provides a default structure for a new ingredient, ready for user input.
   */
  const handleAddIngredient = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      ingredients: [...prevData.ingredients, { name: '', quantity: '' }], // Initialize quantity as empty string
    }));
  }, []); // No dependencies, so this function is memoized once.

  /**
   * Removes an ingredient row from the `ingredients` array by its index.
   * This is a memoized callback.
   * Filters out the ingredient at the specified index, effectively deleting it from the list.
   * @param index The index of the ingredient to remove.
   */
  const handleRemoveIngredient = useCallback((index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      ingredients: prevData.ingredients.filter((_, i) => i !== index),
    }));
  }, []); // No dependencies, so this function is memoized once.

  /**
   * Handles changes to individual mob source fields within the mob-drop acquisition type.
   * This is a memoized callback.
   * Updates the `mobName`, `mobType`, or `floor` of a specific mob source.
   * Converts the `floor` value to a number.
   * @param index The index of the mob source in the `mobSources` array.
   * @param e The change event from the mob source input/select element.
   */
  const handleMobSourceChange = useCallback(
    (
      index: number,
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      const { name, value } = e.target;
      const newMobSources = [...formData.mobSources];
      newMobSources[index] = {
        ...newMobSources[index],
        [name]: name === 'floor' ? (value === '' ? '' : Number(value)) : value, // Handle floor as string for input
      };

      setFormData((prevData) => ({
        ...prevData,
        mobSources: newMobSources,
      }));
    },
    [formData.mobSources], // Re-create this callback if the `mobSources` array reference changes.
  );

  /**
   * Adds a new empty mob source row to the `mobSources` array.
   * This is a memoized callback.
   * Provides a default structure for a new mob source, ready for user input.
   */
  const handleAddMobSource = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      mobSources: [
        ...prevData.mobSources,
        { mobName: '', mobType: 'Minion', floor: '' }, // Initialize floor as empty string
      ],
    }));
  }, []); // No dependencies, so this function is memoized once.

  /**
   * Removes a mob source row from the `mobSources` array by its index.
   * This is a memoized callback.
   * Filters out the mob source at the specified index, effectively deleting it from the list.
   * @param index The index of the mob source to remove.
   */
  const handleRemoveMobSource = useCallback((index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      mobSources: prevData.mobSources.filter((_, i) => i !== index),
    }));
  }, []); // No dependencies, so this function is memoized once.

  /**
   * Validates the form data based on the selected acquisition type.
   * This is a memoized callback.
   * Sets error messages in the `errors` state and returns `true` if the form is valid, `false` otherwise.
   * Includes checks for required fields, valid numbers (e.g., non-negative, greater than 0),
   * and ensures item names are unique (unless editing the same item).
   */
  const validateForm = useCallback(() => {
    const newErrors: Errors = {};
    let isValid = true;

    // Validate Item Name: Ensures it's not empty and is unique.
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item Name is required.';
      isValid = false;
    } else if (
      // Check for duplicate item names, excluding the original name if editing.
      recipes.some(
        (recipe) =>
          recipe.itemName === formData.itemName &&
          recipe.itemName !== oldItemName,
      )
    ) {
      newErrors.itemName = 'Item with this name already exists.';
      isValid = false;
    }

    // Validate acquisition-specific fields based on the selected type.
    // Each case handles the validation rules pertinent to its acquisition method.
    switch (formData.acquisitionType) {
      case 'blacksmithing':
        if (formData.ingredients.length === 0) {
          newErrors.ingredients = 'At least one ingredient is required.';
          isValid = false;
        }
        for (const ingredient of formData.ingredients) {
          // Validate quantity: must be a number and greater than 0
          const quantityValue = Number(ingredient.quantity);
          if (
            !ingredient.name.trim() ||
            isNaN(quantityValue) ||
            quantityValue <= 0
          ) {
            newErrors.ingredients =
              'All ingredients must have a name and a quantity greater than 0.';
            isValid = false;
            break;
          }
        }
        break;
      case 'mob-drop':
        if (formData.mobSources.length === 0) {
          newErrors.mobSources = 'At least one mob source is required.';
          isValid = false;
        }
        for (const source of formData.mobSources) {
          // Validate floor: must be a number and greater than 0
          const floorValue = Number(source.floor);
          if (!source.mobName.trim() || isNaN(floorValue) || floorValue <= 0) {
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

    setErrors(newErrors); // Update the error state with any new validation messages.
    return isValid;
  }, [formData, recipes, oldItemName]); // Dependencies: re-validate when form data, recipes, or old item name changes.

  /**
   * Handles the form submission event.
   * This is a memoized callback.
   * Prevents default browser form submission, validates the form, constructs a `Recipe` object
   * based on the current form data, and then either adds a new recipe or updates an existing one
   * using the global recipe store.
   * Finally, it resets the form and clears any editing state, providing user feedback via toasts.
   * @param e The form submission event.
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default browser form submission.

      if (!validateForm()) {
        toast.error('Please fix the errors before submitting.');
        return; // Stop submission if validation fails.
      }

      let acquisition: Acquisition; // Declare a variable to hold the specific acquisition object.

      // Construct the `acquisition` object based on the selected `acquisitionType`.
      // This ensures the correct structure for the `acquisition` field in the `Recipe` object.
      switch (formData.acquisitionType) {
        case 'blacksmithing':
          acquisition = {
            type: 'blacksmithing',
            ingredients: formData.ingredients.map((ing) => ({
              // Convert quantity back to number for storage
              ...ing,
              quantity: Number(ing.quantity),
            })),
            smithingSkillRequired: formData.smithingSkillRequired,
          };
          break;
        case 'mob-drop':
          acquisition = {
            type: 'mob-drop',
            mobSources: formData.mobSources.map((source) => ({
              // Convert floor back to number for storage
              ...source,
              floor: Number(source.floor),
            })),
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
          // Fallback for unknown acquisition types (should not happen with proper type checking).
          throw new Error('Unknown acquisition type');
      }

      // Create the final Recipe object using the form data and the constructed acquisition.
      const newRecipe: Recipe = {
        itemName: formData.itemName,
        itemType: formData.itemType,
        acquisition,
      };

      // Determine whether to add a new recipe or update an existing one.
      // This logic differentiates between creating a new recipe and saving changes to an existing one.
      if (recipeToEdit && oldItemName) {
        updateRecipe(oldItemName, newRecipe); // Update existing recipe using its original name.
        toast.success(`Recipe "${newRecipe.itemName}" updated successfully!`);
      } else {
        addRecipe(newRecipe); // Add new recipe to the store.
        toast.success(`Recipe "${newRecipe.itemName}" added successfully!`);
      }
      setRecipeToEdit(null); // Clear editing state after submission.
      setOldItemName(null); // Clear old item name.
      setFormData(initialFormData); // Reset form to initial state for next input.
    },
    [
      formData,
      validateForm,
      addRecipe,
      updateRecipe,
      recipeToEdit,
      setRecipeToEdit,
      oldItemName,
    ], // Dependencies for useCallback: ensures the function re-creates if these values change.
  );

  /**
   * Renders the acquisition-specific input fields based on the currently selected `acquisitionType`.
   * This function uses a switch statement to conditionally render different form sections,
   * ensuring that only relevant fields are displayed to the user.
   * Each case returns a JSX block corresponding to a specific acquisition method.
   */
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
            {/* Renders a list of ingredient input fields, allowing dynamic addition/removal. */}
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
                  value={ingredient.quantity === '' ? '' : ingredient.quantity} // Display empty string for 0
                  onChange={(e) => handleIngredientChange(index, e)}
                  min='0' // Allow 0 for temporary input
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
            {/* Renders a list of mob source input fields, allowing dynamic addition/removal. */}
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
                  placeholder='Floor' // Changed placeholder
                  value={source.floor === '' ? '' : source.floor} // Display empty string for 0
                  onChange={(e) => handleMobSourceChange(index, e)}
                  min='0' // Allow 0 for temporary input
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

  /**
   * Handles the cancellation of an edit operation.
   * This is a memoized callback.
   * Resets the `recipeToEdit` state in `useRecipeFormStore` to `null`,
   * clears `oldItemName`, and resets the form data to its initial empty state.
   * This effectively exits the edit mode and prepares the form for a new recipe entry.
   */
  const handleCancelEdit = useCallback(() => {
    setRecipeToEdit(null);
    setOldItemName(null);
    setFormData(initialFormData);
  }, [setRecipeToEdit]); // Dependency: `setRecipeToEdit` from Zustand ensures the callback is stable.

  return (
    <div className='recipe-form-container card'>
      {/* Dynamically changes the form title based on whether a recipe is being edited or a new one is being defined. */}
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
              {/* Renders options for item types based on the `ItemType` enum. */}
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

        {/* Navigation tabs for selecting the acquisition type. */}
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

        {/* Content area where acquisition-specific fields are rendered based on the selected tab. */}
        <div className='tab-content'>{renderAcquisitionFields()}</div>

        {/* Form action buttons: Submit and Cancel (if in edit mode). */}
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
