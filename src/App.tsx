import React, { useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RecipeForm from './components/RecipeForm/RecipeForm';
import RecipeList from './components/RecipeList/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer/CraftingTreeViewer';
import Sidebar from './components/Sidebar/Sidebar';
import OwnedMaterials from './components/OwnedMaterials/OwnedMaterials';
import { useRecipeStore } from './store/useRecipeStore';
import { useOwnedMaterialsStore } from './store/useOwnedMaterialsStore';
import { ItemType } from './types';
import type { AcquisitionType, Recipe, OwnedMaterial } from './types';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const { recipes, setRecipes } = useRecipeStore();
  const { ownedMaterials, setOwnedMaterials } = useOwnedMaterialsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleExport = () => {
    try {
      const dataToExport = { recipes, ownedMaterials };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sbo_data.json';
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

        const importedOwnedMaterials: OwnedMaterial[] =
          importedData.ownedMaterials || [];
        if (!Array.isArray(importedOwnedMaterials)) {
          throw new Error(
            'Imported owned materials data is not a valid array.',
          );
        }

        const isValidOwnedMaterials = importedOwnedMaterials.every(
          (item: any) => {
            return (
              typeof item.itemName === 'string' &&
              typeof item.quantity === 'number' &&
              item.quantity >= 0
            );
          },
        );

        if (!isValidOwnedMaterials) {
          throw new Error(
            'Imported owned materials data contains invalid entries or missing essential fields.',
          );
        }

        setRecipes(importedRecipes);
        setOwnedMaterials(importedOwnedMaterials);
        toast.success(
          `Successfully imported ${importedRecipes.length} recipes and ${importedOwnedMaterials.length} owned materials!`,
        );
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
    <BrowserRouter>
      <div className='App'>
        <Toaster position='top-center' reverseOrder={false} />
        <Sidebar
          onExportRecipes={handleExport}
          onImportRecipes={handleImportClick}
          fileInputRef={fileInputRef}
          onImportFileChange={handleImport}
          isSidebarVisible={isSidebarVisible}
          toggleSidebar={toggleSidebar}
        />

        <div
          className={`main-content scrollbar-custom ${!isSidebarVisible ? 'main-content-expanded' : ''}`}
        >
          {/* Removed main-content-header */}
          <Routes>
            <Route
              path='/'
              element={<Navigate to='/add-edit-recipe' replace />}
            />
            <Route path='/add-edit-recipe' element={<RecipeForm />} />
            <Route path='/view-recipes' element={<RecipeList />} />
            <Route path='/crafting-tree' element={<CraftingTreeViewer />} />
          </Routes>
        </div>
        <div className='right-sidebar'>
          <OwnedMaterials />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
