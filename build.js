const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const chalk = require('chalk');
const url = require('url'); // <-- Add URL module
const zlib = require('zlib'); // <-- Add Zlib module
const { pipeline } = require('stream/promises'); // <-- For async stream handling

// Project structure paths
const PROJECT_ROOT = path.resolve(__dirname);
const DEV_APP_DIR = PROJECT_ROOT;
const BUILD_DIR = path.join(DEV_APP_DIR, 'build');
const JS_DIR = path.join(BUILD_DIR, 'static', 'js');
const CSS_DIR = path.join(BUILD_DIR, 'static', 'css');
const MEDIA_DIR = path.join(BUILD_DIR, 'static', 'media');

// Log with colors and timestamps
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
        case 'success':
            console.log(chalk.green(`${prefix} ✓ ${message}`));
            break;
        case 'error':
            console.error(chalk.red(`${prefix} ✗ ${message}`));
            break;
        case 'warn':
            console.warn(chalk.yellow(`${prefix} ⚠ ${message}`));
            break;
        default:
            console.log(chalk.blue(`${prefix} ℹ ${message}`));
    }
}

// Run command and return result
function runCommand(command, options = {}) {
    try {
        log(`Running: ${command}`);
        execSync(command, { stdio: 'inherit', ...options, cwd: options.cwd || DEV_APP_DIR });
        return true;
    } catch (error) {
        log(`Command failed: ${command}`, 'error');
        // Don't log the full error message by default, it can be verbose
        // log(error.message, 'error');
        return false;
    }
}

// Check if a command exists (less reliable on Windows for non-.exe/.cmd)
function commandExists(command) {
    const cmd = command.split(' ')[0];
    try {
        if (process.platform === 'win32') {
            // `where` is more reliable on Windows
            execSync(`where ${cmd}`, { stdio: 'ignore' });
        } else {
            execSync(`command -v ${cmd}`, { stdio: 'ignore' });
        }
        return true;
    } catch (error) {
        return false;
    }
}

// Ensure a directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        try {
            fs.mkdirSync(directory, { recursive: true });
            log(`Created directory: ${directory}`, 'success');
        } catch (err) {
            log(`Failed to create directory: ${directory}`, 'error');
            log(err.message, 'error');
            process.exit(1); // Exit if we can't create essential directories
        }
    }
}

// Step 1: Build the React application with production optimizations
function buildReactApp() {
    log('Starting React build process');
    process.env.NODE_ENV = 'production';
    process.env.GENERATE_SOURCEMAP = 'false';

    if (!runCommand('npm run build')) {
        log('React build failed. Aborting optimization.', 'error');
        process.exit(1);
    }
    log('React build completed successfully', 'success');
}

// Step 2: Optimize CSS with PurgeCSS
function purgeCss() {
    log('Purging unused CSS');
    const configFileName = 'purgecss.config.js';
    const configPath = path.join(DEV_APP_DIR, configFileName);

    if (!fs.existsSync(configPath)) {
        log(`PurgeCSS config (${configFileName}) not found. Creating default...`, 'warn');
        const defaultConfig = `module.exports = {
  content: [
    './build/**/*.html',
    './build/static/js/**/*.js',
    // Add src files for better class detection
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    './public/**/*.html'
  ],
  css: ['./build/static/css/**/*.css'],
  output: './build/static/css/', // Output purged files to the same directory
  safelist: {
    standard: [
        /^(modal|fade|show|collapse|collapsing|carousel|dropdown|offcanvas|tooltip|popover|alert)/, // Common Bootstrap patterns
        /^(Toastify)/, // React-Toastify if used
        /^(leaflet-)/, // Leaflet classes
        /^(Mui)/,      // Material UI if used
        /^(ant-)/,     // Ant Design if used
        /^(rc-)/       // rc- components (often used by libraries)
    ],
    deep: [/^(modal|fade|show|collapse|collapsing|carousel|dropdown|offcanvas)/], // Match nested classes
    greedy: [] // Avoid greedy unless necessary
  },
  // Important: Specify extractors if needed for special characters or syntax
  // defaultExtractor: content => content.match(/[^\\s"'<>:\`]+/g) || []
};`;
        try {
            fs.writeFileSync(configPath, defaultConfig);
            log('Created default PurgeCSS configuration.', 'success');
        } catch (err) {
            log(`Failed to create PurgeCSS config: ${err.message}`, 'error');
            log('Skipping CSS purging.', 'warn');
            return;
        }
    }

    // --- FIX for Windows path issue ---
    // Convert the config path to a file URL
    const configUrl = url.pathToFileURL(configPath).toString();
    // --- End Fix ---

    const purgecssCmd = 'npx purgecss'; // Prefer npx to use local version

    // Run purgecss command using the file URL
    if (!runCommand(`${purgecssCmd} --config "${configUrl}"`)) {
         log('PurgeCSS command failed.', 'error');
    } else {
        log('CSS purging potentially completed (check PurgeCSS output above).', 'success');
    }
}


// Helper function for globbing with logging
function findFiles(pattern, description) {
    // Normalize path separators for glob consistency
    const normalizedPattern = pattern.replace(/\\/g, '/');
    log(`Searching for ${description} using pattern: ${normalizedPattern}`);
    try {
      const files = glob.sync(normalizedPattern, { cwd: BUILD_DIR, absolute: true, nodir: true });        
        log(`Found ${files.length} ${description}.`);
        if (files.length === 0) {
             log(`No ${description} found. Check the build output and pattern.`, 'warn');
        }
        return files;
    } catch(error) {
        log(`Error while searching for ${description}: ${error.message}`, 'error');
        return [];
    }
}

// Step 3: Optimize JavaScript
function optimizeJavaScript() {
    log('Optimizing JavaScript files (using javascript-obfuscator)');

    // Use helper function to find JS files
    const jsFiles = findFiles('static/js/*.js', 'JavaScript files');

    if (jsFiles.length === 0) {
        return; // Warning already logged by findFiles
    }

    // Check for javascript-obfuscator installation
     const obfuscatorCmd = fs.existsSync(path.join(DEV_APP_DIR, 'node_modules', '.bin', 'javascript-obfuscator'))
        ? 'npx javascript-obfuscator'
        : 'javascript-obfuscator';

    if (obfuscatorCmd === 'javascript-obfuscator' && !commandExists('javascript-obfuscator')) {
         log('javascript-obfuscator command not found globally.', 'warn');
         log('Attempting to install locally: npm install javascript-obfuscator --save-dev');
         if (!runCommand('npm install javascript-obfuscator --save-dev')) {
            log('Failed to install javascript-obfuscator. Skipping JS optimization.', 'error');
            return;
         }
         // Now use npx after potential install
         obfuscatorCmd = 'npx javascript-obfuscator';
    }


    // Lighter obfuscation settings to minimize runtime impact
    const obfuscationOptions = {
        'compact': 'true',
        'control-flow-flattening': 'false', // Can impact performance
        'dead-code-injection': 'false',     // Can impact performance & size
        'string-array': 'true',
        'string-array-encoding': 'base64', // 'none' or 'base64' are usually safe
        'string-array-threshold': '0.75',   // Apply less often
        'unicode-escape-sequence': 'false', // Avoid unless needed
        // Added options:
        'numbers-to-expressions': 'false', // Avoid potential perf issues
        'simplify': 'true',               // Generally safe
        'split-strings': 'false',         // Avoid potential perf issues
        'rename-globals': 'false'         // Safer, avoids breaking external dependencies
    };

    const optionsStr = Object.entries(obfuscationOptions)
        .map(([key, value]) => `--${key} ${value}`)
        .join(' ');

    let successCount = 0;
    jsFiles.forEach(file => {
        // Exclude source map files if any accidentally slipped through
        if (file.endsWith('.map')) return;

        const fileName = path.basename(file);
        // Use a temporary file in the same directory
        const tempFile = file + '.tmp';
        log(`Optimizing JS: ${fileName}`);

        // Ensure output path is quoted if it contains spaces
        const command = `${obfuscatorCmd} "${file}" --output "${tempFile}" ${optionsStr}`;

        if (runCommand(command)) {
            try {
                // Replace original with optimized version
                fs.renameSync(tempFile, file);
                log(`Successfully optimized JS: ${fileName}`, 'success');
                successCount++;
            } catch (renameError) {
                log(`Failed to replace original file ${fileName} after optimization: ${renameError.message}`, 'error');
                // Clean up temp file if rename failed
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }
        } else {
            log(`Failed to optimize JS: ${fileName}`, 'error');
            // Clean up temp file if command failed
            if (fs.existsSync(tempFile)) {
                 try { fs.unlinkSync(tempFile); } catch (_) {}
            }
        }
    });
    log(`JavaScript optimization finished. ${successCount}/${jsFiles.length} files processed.`);
}

// Step 4: Optimize images
function optimizeImages() {
    log('Optimizing images in build directory');

    const imagePatterns = [
        'static/media/**/*.png',
        'static/media/**/*.{jpg,jpeg}',
        'static/media/**/*.svg',
        // Add other formats if needed, like gif, webp
    ];

    let totalImagesFound = 0;
    let processedCount = 0;

    // Process PNGs
    const pngFiles = findFiles('static/media/**/*.png', 'PNG images');
    totalImagesFound += pngFiles.length;
    if (pngFiles.length > 0) {
        const optipngCmd = commandExists('optipng') ? 'optipng' : null;
        if (optipngCmd) {
            pngFiles.forEach(file => {
                log(`Optimizing PNG: ${path.basename(file)}`);
                if (runCommand(`${optipngCmd} -o2 "${file}"`)) { // Use level 2 for balance
                    processedCount++;
                } else {
                    log(`Failed to optimize PNG: ${path.basename(file)}`, 'warn');
                }
            });
        } else {
            log('optipng command not found. Skipping PNG optimization.', 'warn');
            log('Install optipng or ensure it is in your PATH.', 'warn');
        }
    }

    // Process JPGs
    const jpgFiles = findFiles('static/media/**/*.{jpg,jpeg}', 'JPEG images');
    totalImagesFound += jpgFiles.length;
    if (jpgFiles.length > 0) {
        // Prefer mozjpeg if available, otherwise try ImageMagick's convert
        let jpegToolCmd = null;
        if (fs.existsSync(path.join(DEV_APP_DIR, 'node_modules', '.bin', 'mozjpeg'))) {
            jpegToolCmd = `npx mozjpeg -quality 80 -outfile "{output}" "{input}"`; // mozjpeg syntax
        } else if (commandExists('convert')) {
             jpegToolCmd = `convert "{input}" -quality 85 "{output}"`; // ImageMagick syntax
             log('Using ImageMagick convert for JPEGs. Consider installing mozjpeg for potentially better results (npm install mozjpeg --save-dev).', 'info')
        } else if (commandExists('magick')) {
             jpegToolCmd = `magick convert "{input}" -quality 85 "{output}"`; // Newer ImageMagick syntax
             log('Using ImageMagick (magick) convert for JPEGs. Consider installing mozjpeg for potentially better results (npm install mozjpeg --save-dev).', 'info')
        }


        if (jpegToolCmd) {
            jpgFiles.forEach(file => {
                log(`Optimizing JPG: ${path.basename(file)}`);
                // Command needs input and output placeholders replaced
                const cmd = jpegToolCmd.replace("{input}", file).replace("{output}", file);
                if (runCommand(cmd)) {
                    processedCount++;
                } else {
                     log(`Failed to optimize JPG: ${path.basename(file)}`, 'warn');
                }
            });
        } else {
            log('No suitable JPEG optimizer found (mozjpeg, convert/magick). Skipping JPG optimization.', 'warn');
            log('Install mozjpeg (npm install mozjpeg --save-dev), ImageMagick, or ensure they are in your PATH.', 'warn');
        }
    }

    // Process SVGs
    const svgFiles = findFiles('static/media/**/*.svg', 'SVG images');
    totalImagesFound += svgFiles.length;
    if (svgFiles.length > 0) {
        const svgoCmd = fs.existsSync(path.join(DEV_APP_DIR, 'node_modules', '.bin', 'svgo')) ? 'npx svgo' : (commandExists('svgo') ? 'svgo' : null);
        if (svgoCmd) {
             svgFiles.forEach(file => {
                log(`Optimizing SVG: ${path.basename(file)}`);
                // SVGO modifies in place by default with -o same as -i
                if (runCommand(`${svgoCmd} -i "${file}" -o "${file}"`)) {
                    processedCount++;
                } else {
                     log(`Failed to optimize SVG: ${path.basename(file)}`, 'warn');
                }
            });
        } else {
            log('svgo command not found. Skipping SVG optimization.', 'warn');
             log('Install svgo (npm install svgo --save-dev) or ensure it is in your PATH.', 'warn');
        }
    }

    log(`Image optimization finished. ${processedCount}/${totalImagesFound} images processed.`);
}


// Step 5: Gzip compression for static assets using Node.js zlib
async function compressAssets() {
    log('Compressing assets using Node.js zlib');

    const assetPatterns = [
        'static/js/*.js',
        'static/css/*.css',
        '*.html',
        '*.json',
        '*.ico',
        'manifest.json' // Common CRA files
        // Add other text-based assets if needed (e.g., 'static/media/**/*.svg')
    ];

    const assets = assetPatterns.flatMap(pattern => findFiles(pattern, 'assets for compression'));

    if (assets.length === 0) {
        log('No assets found for compression.', 'warn');
        return;
    }

    log(`Found ${assets.length} assets to compress.`);
    let successCount = 0;
    let failCount = 0;

    // Process files concurrently
    const compressionPromises = assets.map(async (file) => {
        const sourcePath = file;
        const destinationPath = `${file}.gz`;
        const fileName = path.basename(file);

        try {
            log(`Compressing: ${fileName}`);
            const sourceStream = fs.createReadStream(sourcePath);
            const destinationStream = fs.createWriteStream(destinationPath);
            const gzipStream = zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }); // Max compression

            // Use pipeline for robust stream handling
            await pipeline(sourceStream, gzipStream, destinationStream);

            // Optional: Verify compression ratio
            const originalSize = fs.statSync(sourcePath).size;
            const compressedSize = fs.statSync(destinationPath).size;
            const ratio = compressedSize / originalSize;
            log(`Compressed ${fileName} (${formatBytes(originalSize)} -> ${formatBytes(compressedSize)}, ratio: ${ratio.toFixed(2)})`, 'success');

            successCount++;
        } catch (error) {
            log(`Failed to compress ${fileName}: ${error.message}`, 'error');
            failCount++;
            // Clean up partial .gz file if compression failed
            if (fs.existsSync(destinationPath)) {
                try { fs.unlinkSync(destinationPath); } catch (_) {}
            }
        }
    });

    // Wait for all compressions to complete
    await Promise.all(compressionPromises);

    log(`Asset compression completed. ${successCount} successful, ${failCount} failed.`, failCount > 0 ? 'warn' : 'success');
}


// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


// Create a report file with optimization details
function createOptimizationReport(startTime, endTime) {
    const reportPath = path.join(BUILD_DIR, 'optimization-report.json');
    log(`Generating optimization report...`);

    try {
        const jsFiles = findFiles('static/js/*.js', 'JS files for report')
            .map(file => ({
                name: path.basename(file),
                size: fs.statSync(file).size,
                sizeFormatted: formatBytes(fs.statSync(file).size),
                gzippedSize: fs.existsSync(`${file}.gz`) ? fs.statSync(`${file}.gz`).size : null,
                gzippedSizeFormatted: fs.existsSync(`${file}.gz`) ? formatBytes(fs.statSync(`${file}.gz`).size) : null,
            }));

        const cssFiles = findFiles('static/css/*.css', 'CSS files for report')
             .map(file => ({
                name: path.basename(file),
                size: fs.statSync(file).size,
                sizeFormatted: formatBytes(fs.statSync(file).size),
                gzippedSize: fs.existsSync(`${file}.gz`) ? fs.statSync(`${file}.gz`).size : null,
                gzippedSizeFormatted: fs.existsSync(`${file}.gz`) ? formatBytes(fs.statSync(`${file}.gz`).size) : null,
            }));


        const totalJsSize = jsFiles.reduce((acc, file) => acc + file.size, 0);
        const totalCssSize = cssFiles.reduce((acc, file) => acc + file.size, 0);
        const totalGzippedJsSize = jsFiles.reduce((acc, file) => acc + (file.gzippedSize || 0), 0);
        const totalGzippedCssSize = cssFiles.reduce((acc, file) => acc + (file.gzippedSize || 0), 0);


        const report = {
            optimizationDate: new Date().toISOString(),
            durationSeconds: ((endTime - startTime) / 1000).toFixed(2),
            totalJsSize: formatBytes(totalJsSize),
            totalCssSize: formatBytes(totalCssSize),
            totalGzippedJsSize: formatBytes(totalGzippedJsSize),
            totalGzippedCssSize: formatBytes(totalGzippedCssSize),
            jsFiles: jsFiles,
            cssFiles: cssFiles
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log(`Optimization report created at: ${reportPath}`, 'success');
    } catch (error) {
        log(`Failed to generate optimization report: ${error.message}`, 'error');
    }
}

// Clean up temporary files
function cleanupTempFiles() {
    log('Cleaning up temporary files');
    // Add .tmp extension used by JS obfuscation
    const tempPatterns = [
        'static/js/*.tmp',
        'static/css/*.tmp',
        'static/media/**/*.tmp',
        '*.tmp'
    ];
    let cleanedCount = 0;

    tempPatterns.forEach(pattern => {
        const tempFiles = findFiles(pattern, 'temporary files');
        tempFiles.forEach(file => {
            try {
                log(`Removing temp file: ${path.basename(file)}`);
                fs.unlinkSync(file);
                cleanedCount++;
            } catch (error) {
                log(`Failed to remove temporary file: ${path.basename(file)} - ${error.message}`, 'warn');
            }
        });
    });

    if (cleanedCount > 0) {
         log(`Removed ${cleanedCount} temporary files.`, 'success');
    } else {
         log('No temporary files found to clean up.');
    }
}

// Main optimization function
async function runOptimization() {
    const startTime = Date.now();
    log('Starting React build and optimization process');

    // Ensure build directory exists before build
    // ensureDirectoryExists(BUILD_DIR); // Build command usually handles this

    // Step 1: Build
    buildReactApp(); // Exits on failure

    // Ensure build directory and subdirectories exist AFTER build
    ensureDirectoryExists(BUILD_DIR);
    ensureDirectoryExists(JS_DIR);
    ensureDirectoryExists(CSS_DIR);
    ensureDirectoryExists(MEDIA_DIR);


    // Step 2: Purge CSS
    purgeCss();

    // Step 3: Optimize JS
    optimizeJavaScript(); // Contains internal error handling

    // Step 4: Optimize Images
    optimizeImages(); // Contains internal error handling

    // Step 5: Compress Assets (Async)
    await compressAssets(); // Contains internal error handling

    // Step 6: Clean up
    cleanupTempFiles();

    const endTime = Date.now();

    // Step 7: Report
    createOptimizationReport(startTime, endTime);

    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`React build and optimization process finished in ${duration} seconds`, 'success');
}

// Execute the optimization process
runOptimization().catch(error => {
    log(`Unhandled error during optimization: ${error.message}`, 'error');
    console.error(error.stack); // Print stack trace for debugging
    process.exit(1);
});