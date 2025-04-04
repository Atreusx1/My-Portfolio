const webp = require('webp-converter');
const fs = require('fs');
const path = require('path');

// Define input and output folders
const inputFolder = './src/assets';
const outputFolder = './src/assets';

// Create output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

// Get all image files in the input folder
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
const files = fs.readdirSync(inputFolder).filter(file => 
  imageExtensions.some(ext => file.endsWith(ext))
);

// Convert each image to WebP
files.forEach(file => {
  const inputFile = path.join(inputFolder, file);
  const outputFile = path.join(outputFolder, path.basename(file, path.extname(file)) + '.webp');
  
  webp.cwebp(inputFile, outputFile, '-q 80')
    .then(response => console.log(`Converted ${file}`))
    .catch(error => console.error(`Error converting ${file}:`, error));
});