// src/App.tsx
import React, { useRef } from 'react'; // Removed useState
import './App.css';
import RecipeForm from './components/RecipeForm';
import RecipeList from './components/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer';
import { useRecipeStore } from './store/useRecipeStore';
import type { AcquisitionType } from './types'; // 'type' for union type
import { ItemType } from './types'; // Regular import for enum

function App() {
  const { recipes, setRecipes } = useRecipeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(recipes, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sbo_recipes.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Recipes exported successfully!');
    } catch (error) {
      console.error('Failed to export recipes:', error);
      alert('Failed to export recipes. Please check the console for details.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (!Array.isArray(importedData)) {
          throw new Error('Imported file is not a valid JSON array.');
        }

        // Define valid AcquisitionType values as a runtime array for validation
        const validAcquisitionTypes: AcquisitionType[] = [
          'blacksmithing',
          'mob-drop',
          'merchant',
          'mining',
          'quest-rewards',
        ];

        const isValidData = importedData.every((item: any) => {
          // Basic checks for essential properties
          const hasBaseProps =
            item.itemName && item.itemType && item.acquisition;

          // Check if item.itemType is one of the valid ItemType enum values
          const hasValidItemType = Object.values(ItemType).includes(
            item.itemType,
          );

          // Check if item.acquisition.type is one of the valid AcquisitionType string literals
          const hasValidAcquisitionType = validAcquisitionTypes.includes(
            item.acquisition.type,
          );

          return hasBaseProps && hasValidItemType && hasValidAcquisitionType;
        });

        if (!isValidData) {
          throw new Error(
            'Imported data contains invalid recipe entries or missing essential fields.',
          );
        }

        setRecipes(importedData);
        alert(`Successfully imported ${importedData.length} recipes!`);
      } catch (error: any) {
        console.error('Failed to import recipes:', error);
        alert(
          `Failed to import recipes: ${error.message}. Please check the console.`,
        );
      } finally {
        event.target.value = ''; // Reset the file input
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  return (
    <div className='App'>
      <h1>Crafting Tree Manager</h1>

      <div className='data-management-buttons'>
        <button onClick={handleExport} className='export-btn'>
          Export Recipes
        </button>
        <button onClick={handleImportClick} className='import-btn'>
          Import Recipes
        </button>
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleImport}
          style={{ display: 'none' }}
          accept='.json'
        />
      </div>

      <RecipeForm />
      <RecipeList />
      <CraftingTreeViewer />
    </div>
  );
}

export default App;
