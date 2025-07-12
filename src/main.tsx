import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/utils.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
