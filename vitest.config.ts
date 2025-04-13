import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// NOTE: Coverage is initially collected from src/domain/** and src/application/**
// only — those are the parts under strict TDD with a hard 80% gate from commit #1.
// UI (src/ui/**) and adapters (src/adapters/**) will get their own thresholds in
// later commits once they have meaningful logic and tests. This keeps the gate
// honest instead of padding coverage with trivial scaffolding.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/application/**'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
