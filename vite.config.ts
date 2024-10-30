// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    mode: 'production',
    build: {
        lib: {
            entry: 'index.ts',
            name: 'InfiniteScroll', // This is the global variable name for UMD/IIFE
            formats: ['umd'], // Change 'es' to 'umd' or 'iife'
            fileName: 'pure-infinite-scroll', // Output filename
        }
    },
    resolve: {
        alias: {
            src: resolve('src/')
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        mockReset: true,
        testTimeout: 2000
    },
});
