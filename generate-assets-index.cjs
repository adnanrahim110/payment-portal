// generate-assets-index.js
const fs = require('fs');
const path = require('path');

// Define the directories
const assetsDir = path.join(__dirname, 'src', 'assets');
const imagesDir = path.join(assetsDir, 'images');
const outputFile = path.join(assetsDir, 'index.js');

// Define allowed image extensions
const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.mp4', '.woff'];

// Array to hold each export line
const exportLines = [];

/**
 * Recursively process a directory to generate export lines for image files.
 * @param {string} dir - The directory to process.
 */
function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      // Recurse into subdirectories
      processDirectory(fullPath);
    } else if (stats.isFile() && validExtensions.includes(path.extname(item).toLowerCase())) {
      // Build a relative path from the assets directory for the import
      const relativePath = './' + path.relative(assetsDir, fullPath).replace(/\\/g, '/');

      // Generate a valid export name:
      // 1. Start with the file name (without extension)
      let name = path.basename(item, path.extname(item));

      // 2. If the file is in a subfolder (not directly under images), include the folder path in the name.
      const relativeDir = path.relative(imagesDir, path.dirname(fullPath)).replace(/\\/g, '/');
      if (relativeDir) {
        // Convert folder separators to underscores and prepend to the file name.
        name = relativeDir.split('/').join('_') + '_' + name;
      }

      // 3. Replace characters that are invalid in JS identifiers (e.g., dashes, spaces)
      name = name.replace(/[-\s]/g, '_');

      // 4. If the name starts with a number, prefix with an underscore.
      if (/^\d/.test(name)) {
        name = '_' + name;
      }

      // Create the export line.
      exportLines.push(`export { default as ${name} } from '${relativePath}';`);
    }
  });
}

// Start processing from the images folder
processDirectory(imagesDir);

// Combine all export lines into a single string
const fileContent = exportLines.join('\n') + '\n';

// Write the content to the output file
fs.writeFileSync(outputFile, fileContent, 'utf8');

console.log(`Generated ${outputFile} with ${exportLines.length} exports.`);
