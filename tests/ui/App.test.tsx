import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';

describe('App', () => {
  it('renders the fastRetro heading', () => {
    render(<App repository={new InMemoryRetroRepository()} />);
    expect(
      screen.getByRole('heading', { name: /fastRetro/i }),
    ).toBeInTheDocument();
  });
});
