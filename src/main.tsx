import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserClock } from './adapters/clock/BrowserClock';
import { LocalStorageRetroRepository } from './adapters/storage/LocalStorageRetroRepository';
import { RandomPicker } from './adapters/random/RandomPicker';
import { App } from './ui/App';

const repository = new LocalStorageRetroRepository(window.localStorage);
const clock = new BrowserClock();
const picker = new RandomPicker<string>();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App repository={repository} clock={clock} picker={picker} />
  </React.StrictMode>,
);
