import React, { useRef } from 'react';
import './App.css';
import RecipeForm from './components/RecipeForm/RecipeForm';
import RecipeList from './components/RecipeList/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer/CraftingTreeViewer';
import Header from './components/Header/Header'; // Import the new Header component
import { useRecipeStore } from './store/useRecipeStore';
import { useOwnedMaterialsStore } from './store/useOwnedMaterialsStore'; // Import owned materials store
import { ItemType } from './types';
import type { AcquisitionType, Recipe, OwnedMaterial } from './types'; // Import OwnedMaterial type
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const { recipes, setRecipes } = useRecipeStore();
  const { ownedMaterials, setOwnedMaterials } = useOwnedMaterialsStore(); // Get ownedMaterials and setOwnedMaterials
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataToExport = { recipes, ownedMaterials }; // Include ownedMaterials in export
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sbo_data.json'; // Changed filename to reflect all data
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error(
        'Failed to export data. Please check the console for details.',
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

        // Validate recipes
        const importedRecipes: Recipe[] = importedData.recipes || [];
        if (!Array.isArray(importedRecipes)) {
          throw new Error('Imported recipes data is not a valid array.');
        }

        const validAcquisitionTypes: AcquisitionType[] = [
          'blacksmithing',
          'mob-drop',
          'merchant',
          'mining',
          'quest-rewards',
        ];

        const isValidRecipes = importedRecipes.every((item: any) => {
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

        if (!isValidRecipes) {
          throw new Error(
            'Imported recipes data contains invalid entries or missing essential fields.',
          );
        }

        // Validate owned materials
        const importedOwnedMaterials: OwnedMaterial[] = importedData.ownedMaterials || [];
        if (!Array.isArray(importedOwnedMaterials)) {
          throw new Error('Imported owned materials data is not a valid array.');
        }

        const isValidOwnedMaterials = importedOwnedMaterials.every((item: any) => {
          return typeof item.itemName === 'string' && typeof item.quantity === 'number' && item.quantity >= 0;
        });

        if (!isValidOwnedMaterials) {
          throw new Error(
            'Imported owned materials data contains invalid entries or missing essential fields.',
          );
        }

        setRecipes(importedRecipes);
        setOwnedMaterials(importedOwnedMaterials); // Set owned materials
        toast.success(`Successfully imported ${importedRecipes.length} recipes and ${importedOwnedMaterials.length} owned materials!`);
      } catch (error: any) {
        console.error('Failed to import data:', error);
        toast.error(
          `Failed to import data: ${error.message}. Please check the console.`,
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
