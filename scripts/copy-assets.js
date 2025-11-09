import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fix HTML file paths to be relative (for Chrome extension)
function fixHtmlPaths(htmlPath) {
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    // Replace absolute paths with relative paths
    html = html.replace(/src="\/assets\//g, 'src="./assets/');
    html = html.replace(/href="\/assets\//g, 'href="./assets/');
    // Replace relative paths that go up directories (../../assets/) with ./assets/
    html = html.replace(/src="\.\.\/\.\.\/assets\//g, 'src="./assets/');
    html = html.replace(/href="\.\.\/\.\.\/assets\//g, 'href="./assets/');
    // Also handle any other relative path variations
    html = html.replace(/src="\.\.\/assets\//g, 'src="./assets/');
    html = html.replace(/href="\.\.\/assets\//g, 'href="./assets/');
    fs.writeFileSync(htmlPath, html);
    return true;
  }
  return false;
}

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
      // Fix paths in the copied file
      fixHtmlPaths(dest);
      console.log(`Moved ${path.basename(src)} to ${path.basename(dest)}`);
      // Remove source file
      try {
        fs.unlinkSync(src);
      } catch (e) {
        // Ignore if file doesn't exist
      }
    }
  });
  
  // Also fix paths in existing HTML files (in case they're already in place)
  const existingHtmlFiles = [
    path.join(__dirname, '../dist/popup.html'),
    path.join(__dirname, '../dist/newtab.html')
  ];
  
  existingHtmlFiles.forEach(htmlPath => {
    if (fixHtmlPaths(htmlPath)) {
      console.log(`Fixed paths in ${path.basename(htmlPath)}`);
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

// Copy images directory
function copyImages() {
  const srcDir = path.join(__dirname, '../public/images');
  const destDir = path.join(__dirname, '../dist/images');
  
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const files = fs.readdirSync(srcDir);
    let copied = 0;
    files.forEach(file => {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        copied++;
      }
    });
    if (copied > 0) {
      console.log(`Copied ${copied} image(s) successfully`);
    }
  }
}

// Run all copy operations
moveHtmlFiles();
copyIcons();
copyManifest();
copyBlocked();
copyImages();

