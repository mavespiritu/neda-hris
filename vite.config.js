import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import Unfonts from 'unplugin-fonts/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        /* Unfonts({
            custom: {
              families: [
                {
                  name: 'Geist',
                  src: './src/assets/fonts/geist/*.woff2',
                },
                {
                    name: 'Geist Mono',
                    src: './src/assets/fonts/geist-mono/*.woff2',
                },
              ],
            },
          }), */
    ],
});
