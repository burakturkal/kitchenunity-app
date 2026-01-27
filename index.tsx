
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { StoreProvider } from './components/StoreProvider';
import ResetPassword from './components/ResetPassword';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function getAllParams() {
  let params = new URLSearchParams(window.location.search);
  if (!params.has('type') && window.location.hash) {
    let hash = window.location.hash.replace(/^#\/?/, '');
    params = new URLSearchParams(hash);
  }
  return params;
}

const allParams = getAllParams();
const isRecovery = allParams.get('type') === 'recovery';

if (isRecovery) {
  root.render(
    <React.StrictMode>
      <ResetPassword />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <StoreProvider>
        <App />
      </StoreProvider>
    </React.StrictMode>
  );
}
