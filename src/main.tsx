import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/index.css';
import { BrowserClock } from './adapters/clock/BrowserClock';
import { LocalStorageRetroRepository } from './adapters/storage/LocalStorageRetroRepository';
import { RandomPicker } from './adapters/random/RandomPicker';
import { CryptoIdGenerator } from './adapters/id/CryptoIdGenerator';
import { BrowserDownloader } from './adapters/export/BrowserDownloader';
import { App } from './ui/App';

const repository = new LocalStorageRetroRepository(window.localStorage);
const clock = new BrowserClock();
const picker = new RandomPicker<string>();
const idGenerator = new CryptoIdGenerator();
const downloader = new BrowserDownloader();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App
      repository={repository}
      clock={clock}
      picker={picker}
      idGenerator={idGenerator}
      downloader={downloader}
    />
  </React.StrictMode>,
);
