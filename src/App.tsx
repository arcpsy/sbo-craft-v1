// src/App.tsx
import React, { useState } from 'react'; // ✅ Import useState
// import './App.css'; // You can keep or remove this if not needed
import RecipeForm from './components/RecipeForm'; // ✅ Import RecipeForm
import RecipeList from './components/RecipeList'; // ✅ Import RecipeList

function App() {
  const [editingRecipeName, setEditingRecipeName] = useState<string | null>(
    null,
  );

  // Function passed to RecipeList to initiate editing
  const handleEditRecipe = (recipeName: string) => {
    setEditingRecipeName(recipeName);
    // Optionally, scroll to the form if it's not visible
    document
      .getElementById('recipe-form-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function passed to RecipeForm to clear editing state after submit/cancel
  const handleFormReset = () => {
    setEditingRecipeName(null);
  };

  return (
    <>
      <header>
        <h1>Crafting Tree Visualizer</h1>
      </header>

      <main className='container'>
        <section id='recipe-form-section' className='card'>
          <h2>{editingRecipeName ? 'Edit Recipe' : 'Define New Recipe'}</h2>
          {/* Pass the recipe name to the form when editing */}
          <RecipeForm
            editingItemName={editingRecipeName}
            onFormReset={handleFormReset}
          />
        </section>

        <section id='recipes-summary-section' className='card'>
          {/* No longer need the h2 and button here as RecipeList handles them */}
          <RecipeList onEditRecipe={handleEditRecipe} />
        </section>

        {/* Placeholder for Visualization section - we'll build this later */}
        <section
          id='visualization-section'
          className='card'
          style={{ display: 'none' }}
        >
          <h2>Crafting Tree Visualization</h2>
          <p>This section will contain the tree visualization and controls.</p>
          {/* Placeholder for Visualization components */}
        </section>

        {/* Placeholder for File Management - we'll build this later */}
        <section
          id='file-management-section'
          className='card'
          style={{ display: 'none' }}
        >
          <h2>File Management</h2>
          <p>This section will contain import/export functionality.</p>
          {/* Placeholder for File Management components */}
        </section>
      </main>

      <footer>
        <p>&copy; 2024 Crafting Tree Visualizer. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;
