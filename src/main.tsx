// Ensure window.fetch has a setter if any environment script attempts reassignment
(function() {
  try {
    const win = typeof window !== 'undefined' ? window : globalThis;
    if (win && win.fetch) {
      let _fetch = win.fetch.bind(win);
      Object.defineProperty(win, 'fetch', {
        get: () => _fetch,
        set: (fn) => { _fetch = fn; },
        configurable: true,
        enumerable: true
      });
    }
  } catch {
    // Ignore if not permitted
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
