import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;"><h1>Javascript Error</h1><pre>${event.error?.stack || event.message}</pre></div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;"><h1>Unhandled Promise Rejection</h1><pre>${event.reason?.stack || event.reason}</pre></div>`;
});

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
