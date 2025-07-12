import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  onExportRecipes: () => void;
  onImportRecipes: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImportFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onExportRecipes,
  onImportRecipes,
  fileInputRef,
  onImportFileChange,
}) => {
  const location = useLocation();
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <>
      <button className='sidebar-toggle' onClick={toggleSidebar}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <line x1='3' y1='12' x2='21' y2='12'></line>
          <line x1='3' y1='6' x2='21' y2='6'></line>
          <line x1='3' y1='18' x2='21' y2='18'></line>
        </svg>
      </button>
      <div className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        <div className='sidebar-header'>
          <h1 className='app-title'>SBO Crafting Tree</h1>
        </div>
        <nav className='sidebar-nav'>
          <ul>
            <li>
              <Link
                to='/add-edit-recipe'
                className={
                  location.pathname === '/add-edit-recipe' ? 'active' : ''
                }
              >
                Add/Edit Recipe
              </Link>
            </li>
            <li>
              <Link
                to='/view-recipes'
                className={
                  location.pathname === '/view-recipes' ? 'active' : ''
                }
              >
                View Recipes
              </Link>
            </li>
            <li>
              <Link
                to='/crafting-tree'
                className={
                  location.pathname === '/crafting-tree' ? 'active' : ''
                }
              >
                Crafting Tree
              </Link>
            </li>
          </ul>
        </nav>
        <div className='sidebar-data-management'>
          <button
            onClick={onExportRecipes}
            className='sidebar-button export-btn'
          >
            Export Data
          </button>
          <button
            onClick={onImportRecipes}
            className='sidebar-button import-btn'
          >
            Import Data
          </button>
          <input
            type='file'
            ref={fileInputRef}
            onChange={onImportFileChange}
            style={{ display: 'none' }}
            accept='.json'
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
