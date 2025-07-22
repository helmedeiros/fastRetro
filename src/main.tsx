import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/index.css';
import { BrowserClock } from './adapters/clock/BrowserClock';
import { LocalStorageTeamRepository } from './adapters/storage/LocalStorageTeamRepository';
import { RandomPicker } from './adapters/random/RandomPicker';
import { CryptoIdGenerator } from './adapters/id/CryptoIdGenerator';
import { BrowserDownloader } from './adapters/export/BrowserDownloader';
import { App } from './ui/App';

const teamRepository = new LocalStorageTeamRepository(window.localStorage);
const clock = new BrowserClock();
const picker = new RandomPicker<string>();
const idGenerator = new CryptoIdGenerator();
const downloader = new BrowserDownloader();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App
      teamRepository={teamRepository}
      clock={clock}
      picker={picker}
      idGenerator={idGenerator}
      downloader={downloader}
      storage={window.localStorage}
    />
  </React.StrictMode>,
);
