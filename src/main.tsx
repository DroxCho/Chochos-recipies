import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { UserRoleProvider } from './auth/UserRoleProvider';
import { LanguageProvider } from './i18n/LanguageProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserRoleProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </UserRoleProvider>
  </StrictMode>,
);
