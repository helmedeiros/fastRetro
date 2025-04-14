import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocalStorageRetroRepository } from './adapters/storage/LocalStorageRetroRepository';
import { App } from './ui/App';

const repository = new LocalStorageRetroRepository(window.localStorage);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App repository={repository} />
  </React.StrictMode>,
);
