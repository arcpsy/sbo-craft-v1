// src/App.tsx
import { useState } from 'react';
// import './App.css'; // Assuming your main CSS is here
import RecipeForm from './components/RecipeForm';
import RecipeList from './components/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer'; // ✅ Import the new component

function App() {
  const [editingItemName, setEditingItemName] = useState<string | null>(null);

  const handleEditRecipe = (itemName: string) => {
    setEditingItemName(itemName);
  };

  const handleFormReset = () => {
    setEditingItemName(null);
  };

  return (
    <div className='App'>
      <h1>Crafting Tree Manager</h1>
      <RecipeForm
        editingItemName={editingItemName}
        onFormReset={handleFormReset}
      />
      <RecipeList onEditRecipe={handleEditRecipe} />
      <CraftingTreeViewer /> {/* ✅ Add the CraftingTreeViewer here */}
    </div>
  );
}

export default App;
