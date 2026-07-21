import { lazy, StrictMode, Suspense } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const AdminConsole = lazy(() => import('./admin/AdminConsole.tsx'));
const isAdminRoute = window.location.pathname === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <Suspense fallback={null}><AdminConsole /></Suspense> : <App />}
  </StrictMode>,
);
