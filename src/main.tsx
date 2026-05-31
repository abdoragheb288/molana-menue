import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA installability on mobile phones
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Moulana PWA Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('Moulana Service Worker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev mode if needed to test installability, using the correct path
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Dev SW registered:', reg.scope))
      .catch((err) => console.log('Dev SW failing is fine:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

