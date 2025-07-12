import React, { useRef } from 'react';
import './App.css';
import RecipeForm from './components/RecipeForm/RecipeForm';
import RecipeList from './components/RecipeList/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer/CraftingTreeViewer';
import Header from './components/Header/Header'; // Import the new Header component
import { useRecipeStore } from './store/useRecipeStore';
import type { AcquisitionType } from './types';
import { ItemType } from './types';
import { Toaster, toast } from 'react-hot-toast';

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
      toast.success('Recipes exported successfully!');
    } catch (error) {
      console.error('Failed to export recipes:', error);
      toast.error(
        'Failed to export recipes. Please check the console for details.',
      );
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

        const validAcquisitionTypes: AcquisitionType[] = [
          'blacksmithing',
          'mob-drop',
          'merchant',
          'mining',
          'quest-rewards',
        ];

        const isValidData = importedData.every((item: any) => {
          const hasBaseProps =
            item.itemName && item.itemType && item.acquisition;

          const hasValidItemType = Object.values(ItemType).includes(
            item.itemType,
          );

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
        toast.success(`Successfully imported ${importedData.length} recipes!`);
      } catch (error: any) {
        console.error('Failed to import recipes:', error);
        toast.error(
          `Failed to import recipes: ${error.message}. Please check the console.`,
        );
      } finally {
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      toast.error('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  return (
    <div className='App'>
      <Toaster position='top-center' reverseOrder={false} />
      <Header onExportRecipes={handleExport} onImportRecipes={handleImportClick} /> {/* Use the new Header component */}

      {/* Main content area, adjusted for fixed header */}
      <div className='main-content'>
        <div className='form-list-row'>
          <RecipeForm />
          <RecipeList />
        </div>

        <div className='viewer-row'>
          <CraftingTreeViewer />
        </div>
      </div>

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleImport}
        style={{ display: 'none' }}
        accept='.json'
      />
    </div>
  );
}

export default App;