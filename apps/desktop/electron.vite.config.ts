import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspacePackages = [
  '@cm-flow-manager/ipc-contracts',
  '@cm-flow-manager/pdf-engine',
  '@cm-flow-manager/pdf-password-remover',
  '@cm-flow-manager/file-utils',
];

const rendererSrc = resolve('src/renderer/src');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts'),
        },
      },
    },
  },
  preload: {
    // Sandboxed preload cannot load ESM (`import`). Bundle as a single CJS file.
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          inlineDynamicImports: true,
        },
      },
    },
  },
  renderer: {
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        '@': rendererSrc,
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
        },
      },
    },
    plugins: [react(), tailwindcss()],
  },
});
