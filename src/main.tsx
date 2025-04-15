import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserClock } from './adapters/clock/BrowserClock';
import { LocalStorageRetroRepository } from './adapters/storage/LocalStorageRetroRepository';
import { RandomPicker } from './adapters/random/RandomPicker';
import { CryptoIdGenerator } from './adapters/id/CryptoIdGenerator';
import { App } from './ui/App';

const repository = new LocalStorageRetroRepository(window.localStorage);
const clock = new BrowserClock();
const picker = new RandomPicker<string>();
const idGenerator = new CryptoIdGenerator();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App
      repository={repository}
      clock={clock}
      picker={picker}
      idGenerator={idGenerator}
    />
  </React.StrictMode>,
);
