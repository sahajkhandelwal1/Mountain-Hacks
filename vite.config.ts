import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

// Custom plugin to rename HTML files and copy assets
function renameHtmlPlugin() {
  return {
    name: 'rename-html',
    generateBundle(options, bundle) {
      // Rename HTML files based on entry name
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'asset' && chunk.fileName && chunk.fileName.endsWith('.html')) {
          // Check which entry this HTML belongs to
          if (fileName.includes('popup') || chunk.fileName.includes('popup')) {
            chunk.fileName = 'popup.html';
          } else if (fileName.includes('newtab') || chunk.fileName.includes('newtab')) {
            chunk.fileName = 'newtab.html';
          }
        }
      }
    },
    writeBundle() {
      // Move HTML files from src subdirectories to root
      const htmlFiles = [
        { src: 'dist/src/popup/index.html', dest: 'dist/popup.html' },
        { src: 'dist/src/newtab/index.html', dest: 'dist/newtab.html' }
      ];
      
      htmlFiles.forEach(({ src, dest }) => {
        if (existsSync(src)) {
          // Ensure destination directory exists
          const destDir = dest.substring(0, dest.lastIndexOf('/'));
          if (destDir && !existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          copyFileSync(src, dest);
          // Remove source file
          try {
            unlinkSync(src);
          } catch (e) {
            // Ignore if file doesn't exist
          }
        }
      });
      
      // Copy manifest.json
      if (existsSync('manifest.json')) {
        copyFileSync('manifest.json', 'dist/manifest.json');
      }
      // Copy blocked.html
      if (existsSync('blocked.html')) {
        copyFileSync('blocked.html', 'dist/blocked.html');
      }
      // Copy icons directory
      if (existsSync('icons')) {
        if (!existsSync('dist/icons')) {
          mkdirSync('dist/icons', { recursive: true });
        }
        // Icons will be handled manually or via a script
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    renameHtmlPlugin()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Handle HTML files - put them in root with proper names
          if (assetInfo.name && assetInfo.name.endsWith('.html')) {
            if (assetInfo.name.includes('popup')) {
              return 'popup.html';
            }
            if (assetInfo.name.includes('newtab')) {
              return 'newtab.html';
            }
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@newtab': resolve(__dirname, 'src/newtab'),
      '@background': resolve(__dirname, 'src/background'),
      '@content': resolve(__dirname, 'src/content')
    }
  }
});

