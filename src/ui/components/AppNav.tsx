export type AppTab = 'home' | 'retrospectives' | 'checks';

export interface AppNavProps {
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
}

export function AppNav({ currentTab, onNavigate }: AppNavProps): JSX.Element {
  return (
    <nav className="app-nav" aria-label="Main navigation">
      <button
        type="button"
        className={`app-nav-item${currentTab === 'home' ? ' active' : ''}`}
        onClick={(): void => { onNavigate('home'); }}
      >
        HOME
      </button>
      <button
        type="button"
        className={`app-nav-item${currentTab === 'retrospectives' ? ' active' : ''}`}
        onClick={(): void => { onNavigate('retrospectives'); }}
      >
        RETROSPECTIVES
      </button>
      <button
        type="button"
        className={`app-nav-item${currentTab === 'checks' ? ' active' : ''}`}
        onClick={(): void => { onNavigate('checks'); }}
      >
        CHECKS
      </button>
    </nav>
  );
}
