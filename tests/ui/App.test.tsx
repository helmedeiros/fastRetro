import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';

describe('App', () => {
  it('renders the fastRetro heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /fastRetro/i }),
    ).toBeInTheDocument();
  });
});
