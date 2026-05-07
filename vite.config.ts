import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Excluimos bootstrap, declaraciones puras de tipos y entry points;
      // medimos cobertura sobre código con lógica real (helpers, primitivos UI,
      // viewmodels, páginas de feature).
      include: [
        'src/shared/components/ui/**/*.{ts,tsx}',
        'src/shared/lib/**/*.{ts,tsx}',
        'src/shared/api/httpClient.ts',
        'src/routes/**/*.tsx'
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/app/**',
        'src/shared/api/contracts.ts',
        'src/shared/components/AppShell.tsx',
        'src/shared/components/SystemStatus.tsx',
        'src/shared/components/ui/Stepper.tsx', // legacy del wizard, ya no se usa
        'src/shared/components/ui/SedePickerDialog.tsx', // testeado a nivel E2E
        'src/test/**'
      ],
      thresholds: {
        lines: 55,
        functions: 50,
        branches: 60,
        statements: 55
      }
    }
  }
});
