/**
 * main.tsx — Application Entry Point
 *
 * Bootstraps the React app into the DOM.
 * Wraps the tree with:
 *  - React.StrictMode  : Highlights potential issues during development
 *  - ErrorBoundary     : Catches top-level render errors with a fallback UI
 *  - LanguageProvider  : Provides i18n translations and current language state
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackMessage="App failed to initialise. Please reload the page.">
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
