import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './design-system/index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Não foi possível encontrar o elemento raiz da aplicação.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
