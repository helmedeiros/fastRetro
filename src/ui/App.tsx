import type { RetroRepository } from '../domain/ports/RetroRepository';
import { SetupPage } from './pages/SetupPage';

export interface AppProps {
  repository: RetroRepository;
}

export function App({ repository }: AppProps): JSX.Element {
  return (
    <main>
      <h1>fastRetro</h1>
      <SetupPage repository={repository} />
    </main>
  );
}
