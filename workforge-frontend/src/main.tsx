import React from 'react';
import ReactDOM from 'react-dom/client';
import { Providers } from '@components/providers';
import App from './App';
import './index.css';
import './pages/employer/employer-design-system.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);