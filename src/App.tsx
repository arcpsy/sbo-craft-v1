// src/App.tsx
import { useState } from 'react'; // useState is still used internally in App.tsx for its own state if any, but not for form/list interaction
import './App.css'; // Assuming your main CSS is here
import RecipeForm from './components/RecipeForm';
import RecipeList from './components/RecipeList';
import CraftingTreeViewer from './components/CraftingTreeViewer';

function App() {
  // We no longer need editingItemName state or handleEditRecipe/handleFormReset functions here
  // as the editing state is now managed by useRecipeFormStore.

  return (
    <div className='App'>
      <h1>Crafting Tree Manager</h1>
      {/* RecipeForm no longer needs editingItemName or onFormReset props */}
      <RecipeForm />
      {/* RecipeList no longer needs onEditRecipe prop */}
      <RecipeList />
      <CraftingTreeViewer />
    </div>
  );
}

export default App;
