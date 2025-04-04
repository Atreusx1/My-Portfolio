const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const chalk = require('chalk');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// --- Configuration ---
const USE_PURGECSS = true; // Set to false to skip PurgeCSS
const USE_JS_OBFUSCATION = true; // Set to false to skip JS Obfuscation
const USE_IMAGE_OPTIMIZATION = true; // Set to false to skip Image Optimization
const USE_GZIP = true; // Set to false to skip Gzipping (Vercel does this, but useful for local checks)
// --- End Configuration ---


// Project structure paths (Absolute)
const PROJECT_ROOT = path.resolve(__dirname);
// DEV_APP_DIR removed, use PROJECT_ROOT
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');
const JS_DIR = path.join(BUILD_DIR, 'static', 'js');
const CSS_DIR = path.join(BUILD_DIR, 'static', 'css');
const MEDIA_DIR = path.join(BUILD_DIR, 'static', 'media');
const OBFUSCATED_JS_DIR = path.join(BUILD_DIR, 'obfuscated_js'); // Temp dir for JS
const OBFUSCATOR_CONFIG_FILE = path.join(PROJECT_ROOT, 'obfuscator.config.js'); // Path to your config


// Log with colors and timestamps
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    const relativePath = (p) => path.isAbsolute(p) ? path.relative(PROJECT_ROOT, p) : p;

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
        execSync(command, { stdio: 'inherit', ...options, cwd: PROJECT_ROOT }); // Ensure CWD
        return true;
    } catch (error) {
        log(`Command failed: ${command}`, 'error');
        log(error.message, 'error'); // Log specific error message
        return false;
    }
}

// Check if a command exists
function commandExists(command) {
    const cmd = command.split(' ')[0];
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    try {
        execSync(checkCmd, { stdio: 'ignore' });
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
            log(`Created directory: ${path.relative(PROJECT_ROOT, directory)}`, 'success');
        } catch (err) {
            log(`Failed to create directory: ${path.relative(PROJECT_ROOT, directory)} - ${err.message}`, 'error');
            process.exit(1);
        }
    }
}

// Helper function for globbing with logging
function findFiles(pattern, description, baseDir = BUILD_DIR) {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const searchDir = baseDir; // Expect absolute path
    log(`Searching for ${description} in ${path.relative(PROJECT_ROOT, searchDir)} using pattern: ${normalizedPattern}`);
    try {
        const files = glob.sync(normalizedPattern, { cwd: searchDir, absolute: true, nodir: true });
        log(`Found ${files.length} ${description}.`);
        if (files.length === 0 && !description.includes('temporary') && !description.includes('assets for compression')) {
            log(`No ${description} found. Check pattern and directory.`, 'warn');
        }
        return files;
    } catch (error) {
        log(`Error while searching for ${description}: ${error.message}`, 'error');
        return [];
    }
}

// Step 1: Build the React application
function buildReactApp() {
    log('Starting React build process');
    process.env.NODE_ENV = 'production';
    process.env.GENERATE_SOURCEMAP = 'false'; // Ensure no sourcemaps

    // Clean previous build if it exists
    if (fs.existsSync(BUILD_DIR)) {
        log(`Removing existing build directory: ${path.relative(PROJECT_ROOT, BUILD_DIR)}`);
        try {
            fs.rmSync(BUILD_DIR, { recursive: true, force: true });
            log('Previous build directory removed.', 'success');
        } catch (err) {
            log(`Failed to remove previous build directory: ${err.message}`, 'warn');
        }
    }

    if (!runCommand('npm run build')) {
        log('React build failed. Aborting optimization.', 'error');
        process.exit(1);
    }
    log('React build completed successfully', 'success');
}

// Step 2: Optimize CSS with PurgeCSS
function purgeCss() {
    if (!USE_PURGECSS) {
        log('Skipping CSS Purging (USE_PURGECSS is false).');
        return;
    }
    log('Purging unused CSS (using config from package.json or purgecss.config.js)');
    // Assumes configuration is in package.json or purgecss.config.js
    const purgecssCmd = 'npx purgecss';

    if (!commandExists(purgecssCmd.split(' ')[0])) {
         log('PurgeCSS command (npx purgecss) not found or failed. Skipping.', 'warn');
         return;
    }

    if (!runCommand(`${purgecssCmd}`)) {
        log('PurgeCSS command failed. Check configuration.', 'error');
        // Decide if this should be fatal: process.exit(1);
    } else {
        log('CSS purging completed (or command ran successfully).', 'success');
    }
}

// Step 3: Optimize JavaScript (Vercel-safe strategy)
function optimizeJavaScript() {
    if (!USE_JS_OBFUSCATION) {
        log('Skipping JavaScript Obfuscation (USE_JS_OBFUSCATION is false).');
        return;
    }
    log('Optimizing JavaScript files using javascript-obfuscator');

    if (!fs.existsSync(OBFUSCATOR_CONFIG_FILE)) {
        log(`Obfuscator config file not found at: ${path.relative(PROJECT_ROOT, OBFUSCATOR_CONFIG_FILE)}. Skipping JS optimization.`, 'error');
        return;
    }
    log(`Using obfuscator config: ${path.relative(PROJECT_ROOT, OBFUSCATOR_CONFIG_FILE)}`);


    const jsFiles = findFiles('static/js/*.js', 'JavaScript files to obfuscate', BUILD_DIR);
    if (jsFiles.length === 0) {
        log('No JavaScript files found in build/static/js to optimize.', 'warn');
        return;
    }

    // 1. Prepare temporary directory
    try {
        if (fs.existsSync(OBFUSCATED_JS_DIR)) {
            log(`Removing existing temporary obfuscation directory: ${path.relative(PROJECT_ROOT, OBFUSCATED_JS_DIR)}`);
            fs.rmSync(OBFUSCATED_JS_DIR, { recursive: true, force: true });
        }
        ensureDirectoryExists(OBFUSCATED_JS_DIR);
        log(`Created temporary directory: ${path.relative(PROJECT_ROOT, OBFUSCATED_JS_DIR)}`);
    } catch (dirError) {
        log(`Failed to prepare temporary obfuscation directory: ${dirError.message}`, 'error');
        return;
    }

    // Prefer local binary, fall back to global
    const obfuscatorCmdPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'javascript-obfuscator');
    const obfuscatorCmd = fs.existsSync(obfuscatorCmdPath)
        ? `"${obfuscatorCmdPath}"` // Quote path
        : (commandExists('javascript-obfuscator') ? 'javascript-obfuscator' : null);

    if (!obfuscatorCmd) {
        log('javascript-obfuscator command not found (checked node_modules/.bin and global path). Skipping JS optimization.', 'error');
        return;
    }

    // --- Use Config File --- No need for optionsStr here
    // const optionsStr = ...

    let successCount = 0;
    let failedFiles = [];
    const filesToProcess = jsFiles.filter(f => !f.endsWith('.map')); // Exclude source maps implicitly

    // 2. Obfuscate each file into the temporary directory
    filesToProcess.forEach(inputFileAbs => {
        const fileName = path.basename(inputFileAbs);
        const outputFileAbs = path.join(OBFUSCATED_JS_DIR, fileName); // Absolute path

        log(`Optimizing JS: ${path.relative(PROJECT_ROOT, inputFileAbs)} -> temp dir`);

        // Construct command using the config file
        const command = `${obfuscatorCmd} "${inputFileAbs}" --output "${outputFileAbs}" --config "${OBFUSCATOR_CONFIG_FILE}"`;

        if (runCommand(command)) {
            if (fs.existsSync(outputFileAbs)) {
                // Basic sanity check: output size shouldn't be zero
                if (fs.statSync(outputFileAbs).size > 0) {
                    successCount++;
                } else {
                     log(`Obfuscation resulted in an empty file for ${fileName}. Marking as failed.`, 'error');
                     failedFiles.push(fileName);
                }
            } else {
                log(`Obfuscation command succeeded for ${fileName}, but output file ${path.relative(PROJECT_ROOT, outputFileAbs)} was not created.`, 'error');
                failedFiles.push(fileName);
            }
        } else {
            failedFiles.push(fileName);
        }
    });

    log(`JavaScript obfuscation to temporary directory finished. ${successCount}/${filesToProcess.length} files processed successfully.`);

    // 3. Copy optimized files back ONLY if ALL were successful
    if (failedFiles.length > 0) {
        log(`Skipping copy-back step due to ${failedFiles.length} obfuscation failures: ${failedFiles.join(', ')}. Original JS files remain.`, 'warn');
    } else if (successCount > 0) {
        log('Copying optimized files back to build/static/js...');
        const optimizedFiles = findFiles('*.js', 'optimized JS files in temp dir', OBFUSCATED_JS_DIR); // Find files in temp dir
        let copySuccessCount = 0;

        optimizedFiles.forEach(optimizedFileAbs => {
            const fileName = path.basename(optimizedFileAbs);
            const finalDestinationAbs = path.join(JS_DIR, fileName); // Absolute final path
            try {
                log(`Copying ${path.relative(PROJECT_ROOT, optimizedFileAbs)} -> ${path.relative(PROJECT_ROOT, finalDestinationAbs)}`);
                fs.copyFileSync(optimizedFileAbs, finalDestinationAbs); // Overwrite original
                copySuccessCount++;
            } catch (copyError) {
                log(`Failed to copy optimized file ${fileName} back: ${copyError.message}`, 'error');
            }
        });
        if (copySuccessCount === optimizedFiles.length) {
            log(`Finished copying back ${copySuccessCount}/${optimizedFiles.length} optimized files.`, 'success');
        } else {
             log(`Failed to copy back all optimized files (${copySuccessCount}/${optimizedFiles.length})! Check errors above.`, 'error');
        }
    } else {
        log('No JS files were successfully obfuscated, skipping copy-back.');
    }

    // 4. Clean up the temporary directory (always attempt this)
    try {
        if (fs.existsSync(OBFUSCATED_JS_DIR)) {
            log(`Cleaning up temporary obfuscation directory: ${path.relative(PROJECT_ROOT, OBFUSCATED_JS_DIR)}`);
            fs.rmSync(OBFUSCATED_JS_DIR, { recursive: true, force: true });
            log('Temporary directory cleaned up.', 'success');
        }
    } catch (cleanupError) {
        log(`Failed to clean up temporary obfuscation directory: ${cleanupError.message}`, 'warn');
    }
}


// Step 4: Optimize images
function optimizeImages() {
    if (!USE_IMAGE_OPTIMIZATION) {
        log('Skipping Image Optimization (USE_IMAGE_OPTIMIZATION is false).');
        return;
    }
    log('Optimizing images in build directory');
    let totalProcessed = 0;
    let totalFound = 0;

    // --- PNG ---
    const pngFiles = findFiles('static/media/**/*.png', 'PNG images', BUILD_DIR);
    totalFound += pngFiles.length;
    if (pngFiles.length > 0) {
        const optipngCmd = commandExists('optipng') ? 'optipng' : null;
        if (optipngCmd) {
            // Batch processing is faster if possible, but individual is safer for errors
            pngFiles.forEach(fileAbs => {
                log(`Optimizing PNG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                // Use -strip all to remove metadata, -o2 for decent compression level
                if (runCommand(`${optipngCmd} -strip all -o2 "${fileAbs}"`)) { totalProcessed++; }
            });
        } else {
            log('optipng command not found. Skipping PNG optimization.', 'warn');
        }
    }

    // --- JPEG ---
    const jpgFiles = findFiles('static/media/**/*.{jpg,jpeg}', 'JPEG images', BUILD_DIR);
    totalFound += jpgFiles.length;
    if (jpgFiles.length > 0) {
        let jpegToolCmdStr = null;
        const mozjpegPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'mozjpeg');
        if (fs.existsSync(mozjpegPath)) {
            log('Using mozjpeg for JPEGs.');
            // Quality 80-85 is usually a good balance. -optimize for Huffman table optimization.
            jpegToolCmdStr = `"${mozjpegPath}" -quality 80 -optimize -outfile "{output}" "{input}"`;
        } else if (commandExists('convert')) { // ImageMagick v6
            log('Using ImageMagick convert for JPEGs. mozjpeg (devDependency) is recommended for better results.', 'info');
             // Strip metadata, quality 85
            jpegToolCmdStr = `convert "{input}" -strip -quality 85 "{output}"`;
        } else if (commandExists('magick')) { // ImageMagick v7
            log('Using ImageMagick (magick) convert for JPEGs. mozjpeg (devDependency) is recommended for better results.', 'info');
            jpegToolCmdStr = `magick convert "{input}" -strip -quality 85 "{output}"`;
        }

        if (jpegToolCmdStr) {
            jpgFiles.forEach(fileAbs => {
                log(`Optimizing JPG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                const cmd = jpegToolCmdStr.replace("{input}", `"${fileAbs}"`).replace("{output}", `"${fileAbs}"`); // Input and output are the same file
                if (runCommand(cmd)) { totalProcessed++; }
            });
        } else {
            log('No suitable JPEG optimizer found (mozjpeg, convert/magick). Skipping JPEG optimization.', 'warn');
        }
    }

    // --- SVG ---
    const svgFiles = findFiles('static/media/**/*.svg', 'SVG images', BUILD_DIR);
    totalFound += svgFiles.length;
    if (svgFiles.length > 0) {
        const svgoPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'svgo');
        const svgoCmd = fs.existsSync(svgoPath) ? `"${svgoPath}"` : (commandExists('svgo') ? 'svgo' : null);
        if (svgoCmd) {
             svgFiles.forEach(fileAbs => {
                log(`Optimizing SVG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                // Using default SVGO settings is usually good.
                if (runCommand(`${svgoCmd} --input "${fileAbs}" --output "${fileAbs}"`)) { totalProcessed++; }
            });
        } else {
            log('svgo command not found (checked node_modules/.bin and global path). Skipping SVG optimization.', 'warn');
        }
    }
    log(`Image optimization finished. ${totalProcessed}/${totalFound} images processed.`);
}


// Step 5: Gzip compression for static assets
async function compressAssets() {
    if (!USE_GZIP) {
        log('Skipping Gzip Compression (USE_GZIP is false).');
        return;
    }
    log('Compressing assets using Node.js zlib (for reporting/local testing)');
    // Note: Vercel applies Brotli/Gzip automatically, this is mainly for analysis
    const assetPatterns = [
        'static/js/*.js', 'static/css/*.css', '*.html', '*.json', '*.ico',
        'manifest.json', 'asset-manifest.json', 'robots.txt',
        'static/media/**/*.svg' // Compress SVGs too
    ];
    const assets = assetPatterns.flatMap(pattern =>
        findFiles(pattern, `assets for compression ('${pattern}')`, BUILD_DIR)
    );

    if (assets.length === 0) {
         log('No assets found matching patterns for compression.', 'warn');
         return;
    }
    log(`Found ${assets.length} assets to compress.`);
    let successCount = 0;
    let failCount = 0;

    const compressionPromises = assets.map(async (sourcePathAbs) => {
        // Skip if source doesn't exist (might happen with patterns)
        if (!fs.existsSync(sourcePathAbs)) return;

        const destinationPathAbs = `${sourcePathAbs}.gz`;
        const fileName = path.basename(sourcePathAbs);
        try {
            const sourceStream = fs.createReadStream(sourcePathAbs);
            const destinationStream = fs.createWriteStream(destinationPathAbs);
            const gzipStream = zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION });

            await pipeline(sourceStream, gzipStream, destinationStream);

            // Verify output file exists and has size > 0 before logging success
            if (fs.existsSync(destinationPathAbs) && fs.statSync(destinationPathAbs).size > 0) {
                const originalSize = fs.statSync(sourcePathAbs).size;
                const compressedSize = fs.statSync(destinationPathAbs).size;
                log(`Compressed ${fileName} (${formatBytes(originalSize)} -> ${formatBytes(compressedSize)}, ratio: ${(compressedSize / originalSize).toFixed(2)})`, 'success');
                successCount++;
            } else {
                 log(`Compression created an empty or missing file for ${fileName}. Removing broken file.`, 'error');
                 failCount++;
                 if (fs.existsSync(destinationPathAbs)) { try { fs.unlinkSync(destinationPathAbs); } catch (_) {} }
            }
        } catch (error) {
            log(`Failed to compress ${fileName}: ${error.message}`, 'error');
            failCount++;
            // Attempt to clean up potentially partially written file
            if (fs.existsSync(destinationPathAbs)) { try { fs.unlinkSync(destinationPathAbs); } catch (_) {} }
        }
    });

    await Promise.all(compressionPromises);

    log(`Asset compression completed. ${successCount} successful, ${failCount} failed.`, failCount > 0 ? 'warn' : 'success');
}

// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
    if (!Number.isFinite(bytes) || bytes === 0) return '0 Bytes'; // Check for valid number
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
    const index = Math.min(i, sizes.length - 1); // Ensure index is within bounds
    return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
}

// Create a report file with optimization details
function createOptimizationReport(startTime, endTime) {
    const reportPathAbs = path.join(BUILD_DIR, 'optimization-report.json');
    log(`Generating optimization report...`);

    try {
        const getFileStats = (fileAbs) => {
            if (!fs.existsSync(fileAbs)) return null;
            const stats = fs.statSync(fileAbs);
            const gzPath = `${fileAbs}.gz`;
            const gzStats = (USE_GZIP && fs.existsSync(gzPath)) ? fs.statSync(gzPath) : null;
            return {
                name: path.basename(fileAbs),
                size: stats.size,
                sizeFormatted: formatBytes(stats.size),
                gzippedSize: gzStats?.size, // Nullish coalescing
                gzippedSizeFormatted: formatBytes(gzStats?.size),
            };
        };

        const jsFileStats = findFiles('static/js/*.js', 'JS files for report', BUILD_DIR)
            .map(getFileStats).filter(Boolean); // filter(Boolean) removes nulls

        const cssFileStats = findFiles('static/css/*.css', 'CSS files for report', BUILD_DIR)
            .map(getFileStats).filter(Boolean);

        const totalJsSize = jsFileStats.reduce((acc, file) => acc + (file.size || 0), 0);
        const totalCssSize = cssFileStats.reduce((acc, file) => acc + (file.size || 0), 0);
        const totalGzippedJsSize = USE_GZIP ? jsFileStats.reduce((acc, file) => acc + (file.gzippedSize || 0), 0) : null;
        const totalGzippedCssSize = USE_GZIP ? cssFileStats.reduce((acc, file) => acc + (file.gzippedSize || 0), 0) : null;

        const report = {
            optimizationDate: new Date().toISOString(),
            durationSeconds: ((endTime - startTime) / 1000).toFixed(2),
            stepsSkipped: {
                purgeCss: !USE_PURGECSS,
                jsObfuscation: !USE_JS_OBFUSCATION,
                imageOptimization: !USE_IMAGE_OPTIMIZATION,
                gzip: !USE_GZIP,
            },
            totalJsSize: formatBytes(totalJsSize),
            totalCssSize: formatBytes(totalCssSize),
            totalGzippedJsSize: USE_GZIP ? formatBytes(totalGzippedJsSize) : 'N/A (Skipped)',
            totalGzippedCssSize: USE_GZIP ? formatBytes(totalGzippedCssSize) : 'N/A (Skipped)',
            jsFiles: jsFileStats,
            cssFiles: cssFileStats
        };

        fs.writeFileSync(reportPathAbs, JSON.stringify(report, null, 2));
        log(`Optimization report created at: ${path.relative(PROJECT_ROOT, reportPathAbs)}`, 'success');
    } catch (error) {
        log(`Failed to generate optimization report: ${error.message}`, 'error');
        console.error(error.stack); // Log stack for debugging
    }
}

// Clean up temporary files and directories (Only the obfuscation dir now)
function cleanupTempFiles() {
    log('Cleaning up temporary directories...');
    let cleanedCount = 0;
    const tempDirs = [OBFUSCATED_JS_DIR]; // Add other temp dirs here if needed

    tempDirs.forEach(dirPathAbs => {
        if (fs.existsSync(dirPathAbs)) {
            try {
                log(`Removing temporary directory: ${path.relative(PROJECT_ROOT, dirPathAbs)}`);
                fs.rmSync(dirPathAbs, { recursive: true, force: true });
                cleanedCount++;
            } catch (error) {
                 if (error.code !== 'ENOENT') { // Ignore if already gone
                    log(`Failed to remove temporary directory: ${path.relative(PROJECT_ROOT, dirPathAbs)} - ${error.message}`, 'warn');
                 }
            }
        }
    });

    if (cleanedCount > 0) {
        log(`Cleaned up ${cleanedCount} temporary items.`, 'success');
    } else {
        log('No temporary directories needed cleanup.');
    }
}

// Main optimization function
async function runOptimization() {
    const startTime = Date.now();
    console.log(chalk.cyan('==========================================='));
    log(`Starting Build & Optimization Process`);
    log(`Project Root: ${PROJECT_ROOT}`);
    log(`Node Version: ${process.version}, Platform: ${process.platform}`);
    console.log(chalk.cyan('==========================================='));

    // Step 1: Build (includes cleaning previous build)
    buildReactApp(); // Exits on failure

    // Ensure build subdirectories exist AFTER build
    ensureDirectoryExists(BUILD_DIR); // Should exist, but good practice
    ensureDirectoryExists(JS_DIR);
    ensureDirectoryExists(CSS_DIR);
    ensureDirectoryExists(MEDIA_DIR);

    // Step 2: Purge CSS
    purgeCss();

    // Step 3: Optimize JS (using config file)
    optimizeJavaScript();

    // Step 4: Optimize Images
    optimizeImages();

    // Step 5: Compress Assets (Async)
    await compressAssets();

    // Step 6: Clean up (only temp JS dir now)
    cleanupTempFiles(); // Cleanup before report

    const endTime = Date.now();

    // Step 7: Report
    createOptimizationReport(startTime, endTime);

    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(chalk.cyan('==========================================='));
    log(`Build & Optimization Process Finished`, 'success');
    log(`Total Time: ${duration} seconds`, 'success');
    console.log(chalk.cyan('==========================================='));
}

// Execute the optimization process
runOptimization().catch(error => {
    log(`Unhandled error during optimization: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
});