import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Move HTML files from src subdirectories to root
function moveHtmlFiles() {
  const htmlFiles = [
    { src: path.join(__dirname, '../dist/src/popup/index.html'), dest: path.join(__dirname, '../dist/popup.html') },
    { src: path.join(__dirname, '../dist/src/newtab/index.html'), dest: path.join(__dirname, '../dist/newtab.html') }
  ];
  
  htmlFiles.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`Moved ${path.basename(src)} to ${path.basename(dest)}`);
      // Remove source file
      try {
        fs.unlinkSync(src);
      } catch (e) {
        // Ignore if file doesn't exist
      }
    }
  });
}

// Copy icons directory
function copyIcons() {
  const srcDir = path.join(__dirname, '../icons');
  const destDir = path.join(__dirname, '../dist/icons');
  
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const files = fs.readdirSync(srcDir);
    let copied = 0;
    files.forEach(file => {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      if (fs.statSync(srcPath).isFile() && file.endsWith('.png')) {
        fs.copyFileSync(srcPath, destPath);
        copied++;
      }
    });
    if (copied > 0) {
      console.log(`Copied ${copied} icon(s) successfully`);
    } else {
      console.warn('No PNG icons found in icons directory. Please create icon16.png, icon48.png, and icon128.png');
    }
  } else {
    console.warn('Icons directory not found. Please create placeholder icons.');
    // Create the directory structure
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
  }
}

// Copy manifest.json
function copyManifest() {
  const srcPath = path.join(__dirname, '../manifest.json');
  const destPath = path.join(__dirname, '../dist/manifest.json');
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Manifest copied successfully');
  }
}

// Copy blocked.html
function copyBlocked() {
  const srcPath = path.join(__dirname, '../blocked.html');
  const destPath = path.join(__dirname, '../dist/blocked.html');
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Blocked.html copied successfully');
  }
}

// Run all copy operations
moveHtmlFiles();
copyIcons();
copyManifest();
copyBlocked();

