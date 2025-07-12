import React from 'react';
import './Header.css';

interface HeaderProps {
  onExportRecipes: () => void;
  onImportRecipes: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExportRecipes, onImportRecipes }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">SBO Crafting Tree</h1>
      </div>
      <div className="header-right">
        <div className="button-group">
          <button onClick={onExportRecipes} className="header-button">Export Recipes</button>
          <button onClick={onImportRecipes} className="header-button">Import Recipes</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
