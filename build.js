const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const chalk = require('chalk');
// const url = require('url'); // No longer needed for Vercel path fix
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// Project structure paths
const PROJECT_ROOT = path.resolve(__dirname);
const DEV_APP_DIR = PROJECT_ROOT; // DEV_APP_DIR might be redundant now, consider using PROJECT_ROOT directly
const BUILD_DIR = path.join(PROJECT_ROOT, 'build'); // Already absolute
const JS_DIR = path.join(BUILD_DIR, 'static', 'js'); // Already absolute
const CSS_DIR = path.join(BUILD_DIR, 'static', 'css'); // Already absolute
const MEDIA_DIR = path.join(BUILD_DIR, 'static', 'media'); // Already absolute
// Define path for temporary obfuscated JS files - Already absolute
const OBFUSCATED_JS_DIR = path.join(BUILD_DIR, 'obfuscated_js');


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
        // Ensure command runs from project root for consistency
        execSync(command, { stdio: 'inherit', ...options, cwd: PROJECT_ROOT });
        return true;
    } catch (error) {
        log(`Command failed: ${command}`, 'error');
        return false;
    }
}

// Check if a command exists
function commandExists(command) {
    const cmd = command.split(' ')[0];
    try {
        if (process.platform === 'win32') {
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
    // Expect absolute path here
    if (!fs.existsSync(directory)) {
        try {
            fs.mkdirSync(directory, { recursive: true });
            log(`Created directory: ${path.relative(PROJECT_ROOT, directory)}`, 'success'); // Log relative path
        } catch (err) {
            log(`Failed to create directory: ${path.relative(PROJECT_ROOT, directory)}`, 'error');
            log(err.message, 'error');
            process.exit(1);
        }
    }
}

// Step 1: Build the React application
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
// Step 2: Optimize CSS with PurgeCSS
function purgeCss() {
    log('Purging unused CSS (using config from package.json)');

    // --- REMOVE CONFIG FILE CHECK AND PATH LOGIC ---
    // No separate config file needed when using package.json

    const purgecssCmd = 'npx purgecss'; // Use locally installed version

    // --- REMOVE --config FLAG FROM COMMAND ---
    if (!runCommand(`${purgecssCmd}`)) { // Just run 'npx purgecss'
    // --- END REMOVAL ---
         log('PurgeCSS command failed.', 'error');
         // Consider if this should be a fatal error
    } else {
        log('CSS purging potentially completed.', 'success');
    }
}
// Helper function for globbing with logging - accepts optional baseDir
function findFiles(pattern, description, baseDir = BUILD_DIR) { // Default to BUILD_DIR (absolute)
    const normalizedPattern = pattern.replace(/\\/g, '/');
    // baseDir should already be absolute here
    const searchDir = baseDir;
    log(`Searching for ${description} in ${path.relative(PROJECT_ROOT, searchDir)} using pattern: ${normalizedPattern}`);
    try {
        const files = glob.sync(normalizedPattern, { cwd: searchDir, absolute: true, nodir: true });
        log(`Found ${files.length} ${description}.`);
        if (files.length === 0 && !description.includes('temporary')) {
             log(`No ${description} found. Check pattern and directory.`, 'warn');
        }
        return files;
    } catch(error) {
        log(`Error while searching for ${description}: ${error.message}`, 'error');
        return [];
    }
}

// Step 3: Optimize JavaScript (Vercel-safe strategy)
function optimizeJavaScript() {
    log('Optimizing JavaScript files (using javascript-obfuscator)');
    const jsFiles = findFiles('static/js/*.js', 'JavaScript files to obfuscate', BUILD_DIR); // Uses absolute BUILD_DIR

    if (jsFiles.length === 0) {
        return;
    }

    // 1. Ensure the temporary output directory exists and is empty
    try {
        // Use the already absolute OBFUSCATED_JS_DIR directly
        const tempDirFullPath = OBFUSCATED_JS_DIR; // Already absolute
        if (fs.existsSync(tempDirFullPath)) {
            log(`Removing existing temporary obfuscation directory: ${path.relative(PROJECT_ROOT, tempDirFullPath)}`);
            fs.rmSync(tempDirFullPath, { recursive: true, force: true });
        }
        ensureDirectoryExists(tempDirFullPath); // ensureDirectory expects absolute path
        log(`Created temporary directory for obfuscated JS: ${path.relative(PROJECT_ROOT, tempDirFullPath)}`);
    } catch (dirError) {
        log(`Failed to prepare temporary obfuscation directory: ${dirError.message}`, 'error');
        return; // Cannot proceed
    }

    const obfuscatorCmdPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'javascript-obfuscator');
    const obfuscatorCmd = fs.existsSync(obfuscatorCmdPath)
        ? `"${obfuscatorCmdPath}"` // Quote path in case of spaces
        : (commandExists('javascript-obfuscator') ? 'javascript-obfuscator' : null);

    if (!obfuscatorCmd) {
         log('javascript-obfuscator command not found (checked node_modules/.bin and global). Skipping JS optimization.', 'error');
         return;
    }

    const obfuscationOptions ={
        // Core Lightweight & Performance Options:
        'compact': true,                    // Good: Reduces code size, generally no perf impact or slightly positive.
        'simplify': true,                   // Good: Simplifies expressions, reduces size, potentially improves perf.
        'control-flow-flattening': false,   // CRITICAL for Perf: Keep FALSE. This is very slow.
        'dead-code-injection': false,       // Good for Perf/Size: Keep FALSE. Avoids adding unused code.
    
        // String Obfuscation (DISABLED for Maximum Performance):
        'string-array': false,              // ***CHANGED***: Set to false to avoid all string array overhead (setup, lookups). This yields the best runtime performance.
        // 'string-array-encoding': 'none', // Irrelevant when string-array is false
        // 'string-array-threshold': 0.8,   // Irrelevant when string-array is false
        // 'string-array-rotate': false,    // Irrelevant when string-array is false
        'split-strings': false,             // Good for Perf: Keep FALSE. Avoids string concatenation overhead at runtime.
    
        // Other Heavy Features to Keep Disabled:
        'numbers-to-expressions': false,    // Good for Perf: Keep FALSE. Avoids runtime evaluation overhead.
        'unicode-escape-sequence': false,   // Good for Perf/Size: Keep FALSE. Avoids bloating strings and potential minor parsing overhead.
        'rename-globals': false,            // Good for Safety/Simplicity: Keep FALSE. Avoids potential breakage.
        'transform-object-keys': false,     // Good for Perf/Safety: (Default is false) Keep FALSE. Adds overhead and risk.
        'rename-properties': false,         // Good for Perf/Safety: (Default is false) Keep FALSE. Very risky, can break code.
    
        // Anti-Debugging (DISABLE for Performance):
        'self-defending': false,            // CRITICAL for Perf/Size: (Default is false) Keep FALSE. Adds significant overhead and size.
        'debug-protection': false,          // CRITICAL for Perf: (Default is false) Keep FALSE. Adds runtime checks.
        'disable-console-output': false     // Good for Perf/Size: (Default is false) Keep FALSE. Avoids adding wrapper code.
    };
    const optionsStr = Object.entries(obfuscationOptions)
        .map(([key, value]) => `--${key} ${value}`)
        .join(' ');

    let successCount = 0;
    let failedFiles = [];

    // 2. Obfuscate each file into the temporary directory
    jsFiles.forEach(inputFileAbs => { // inputFileAbs is absolute path from findFiles
        if (inputFileAbs.endsWith('.map')) return;

        const fileName = path.basename(inputFileAbs);
        // Ensure outputFile path is absolute for the command
        const outputFileAbs = path.join(OBFUSCATED_JS_DIR, fileName); // Already absolute

        log(`Optimizing JS: ${path.relative(PROJECT_ROOT, inputFileAbs)} -> ${path.relative(PROJECT_ROOT, outputFileAbs)}`);

        // Ensure paths with spaces are quoted for the command line
        const command = `${obfuscatorCmd} "${inputFileAbs}" --output "${outputFileAbs}" ${optionsStr}`;

        if (runCommand(command)) {
            if (fs.existsSync(outputFileAbs)) {
                successCount++;
            } else {
                 log(`Obfuscation command seemed to succeed for ${fileName}, but output file ${outputFileAbs} was not created.`, 'error');
                 failedFiles.push(fileName);
            }
        } else {
            failedFiles.push(fileName);
        }
    });

    const totalToProcess = jsFiles.filter(f => !f.endsWith('.map')).length;
    log(`JavaScript obfuscation to temporary directory finished. ${successCount}/${totalToProcess} files processed.`);

    // 3. Copy optimized files back ONLY if ALL were successful
    if (failedFiles.length > 0) {
        log(`Skipping copy-back step due to ${failedFiles.length} obfuscation failures: ${failedFiles.join(', ')}`, 'warn');
    } else if (successCount > 0) {
        log('Copying optimized files back to build/static/js...');
        // Search for optimized files within the temporary directory (absolute path)
        const optimizedFiles = findFiles('*.js', 'optimized JS files in temp dir', OBFUSCATED_JS_DIR); // baseDir is absolute
        let copySuccessCount = 0;

        optimizedFiles.forEach(optimizedFileAbs => { // optimizedFileAbs is absolute
            const fileName = path.basename(optimizedFileAbs);
            // Final destination is also absolute
            const finalDestinationAbs = path.join(JS_DIR, fileName);
            try {
                log(`Copying ${path.relative(PROJECT_ROOT, optimizedFileAbs)} -> ${path.relative(PROJECT_ROOT, finalDestinationAbs)}`);
                fs.copyFileSync(optimizedFileAbs, finalDestinationAbs); // Overwrites original
                copySuccessCount++;
            } catch (copyError) {
                log(`Failed to copy optimized file ${fileName} back: ${copyError.message}`, 'error');
            }
        });
        log(`Finished copying back ${copySuccessCount}/${optimizedFiles.length} optimized files.`, 'success');
        if (copySuccessCount !== optimizedFiles.length) {
            log('Some optimized files failed to copy back!', 'error');
        }
    } else {
         log('No JS files were successfully obfuscated, skipping copy-back.');
    }

    // 4. Clean up the temporary directory (always attempt this)
    try {
        const tempDirFullPath = OBFUSCATED_JS_DIR; // Already absolute
        if (fs.existsSync(tempDirFullPath)) {
            log(`Cleaning up temporary obfuscation directory: ${path.relative(PROJECT_ROOT, tempDirFullPath)}`);
            fs.rmSync(tempDirFullPath, { recursive: true, force: true });
            log('Temporary directory cleaned up.', 'success');
        }
    } catch (cleanupError) {
        log(`Failed to clean up temporary obfuscation directory: ${cleanupError.message}`, 'warn');
    }
}

// Step 4: Optimize images
function optimizeImages() {
    log('Optimizing images in build directory');
    let totalProcessed = 0;
    let totalFound = 0;

    // Get absolute paths from findFiles using absolute BUILD_DIR
    const pngFiles = findFiles('static/media/**/*.png', 'PNG images', BUILD_DIR);
    totalFound += pngFiles.length;
    if (pngFiles.length > 0) {
        const optipngCmd = commandExists('optipng') ? 'optipng' : null;
        if (optipngCmd) {
            pngFiles.forEach(fileAbs => {
                log(`Optimizing PNG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                if (runCommand(`${optipngCmd} -o2 "${fileAbs}"`)) { totalProcessed++; } // Pass absolute path
            });
        } else {
            log('optipng command not found. Skipping PNG optimization.', 'warn');
        }
    }

    const jpgFiles = findFiles('static/media/**/*.{jpg,jpeg}', 'JPEG images', BUILD_DIR);
    totalFound += jpgFiles.length;
    if (jpgFiles.length > 0) {
        let jpegToolCmdStr = null;
        const mozjpegPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'mozjpeg');
        if (fs.existsSync(mozjpegPath)) {
             // Quote paths in command string for robustness
            jpegToolCmdStr = `"${mozjpegPath}" -quality 80 -outfile "{output}" "{input}"`;
        } else if (commandExists('convert')) {
            jpegToolCmdStr = `convert "{input}" -quality 85 "{output}"`;
            log('Using ImageMagick convert for JPEGs. mozjpeg (devDependency) recommended.', 'info');
        } else if (commandExists('magick')) {
            jpegToolCmdStr = `magick convert "{input}" -quality 85 "{output}"`;
            log('Using ImageMagick (magick) convert for JPEGs. mozjpeg (devDependency) recommended.', 'info');
        }

        if (jpegToolCmdStr) {
            jpgFiles.forEach(fileAbs => {
                log(`Optimizing JPG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                // Replace placeholders with quoted absolute paths
                const cmd = jpegToolCmdStr.replace("{input}", `"${fileAbs}"`).replace("{output}", `"${fileAbs}"`);
                if (runCommand(cmd)) { totalProcessed++; }
            });
        } else {
            log('No suitable JPEG optimizer found (mozjpeg, convert/magick). Skipping.', 'warn');
        }
    }

    const svgFiles = findFiles('static/media/**/*.svg', 'SVG images', BUILD_DIR);
    totalFound += svgFiles.length;
    if (svgFiles.length > 0) {
        const svgoPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'svgo');
        const svgoCmd = fs.existsSync(svgoPath) ? `"${svgoPath}"` : (commandExists('svgo') ? 'svgo' : null);
        if (svgoCmd) {
             svgFiles.forEach(fileAbs => {
                log(`Optimizing SVG: ${path.relative(PROJECT_ROOT, fileAbs)}`);
                 // Quote paths for command
                if (runCommand(`${svgoCmd} -i "${fileAbs}" -o "${fileAbs}"`)) { totalProcessed++; }
            });
        } else {
            log('svgo command not found (checked node_modules and global). Skipping.', 'warn');
        }
    }
    log(`Image optimization finished. ${totalProcessed}/${totalFound} images processed.`);
}


// Step 5: Gzip compression for static assets
async function compressAssets() {
    log('Compressing assets using Node.js zlib');
    const assetPatterns = [
        'static/js/*.js', 'static/css/*.css', '*.html', '*.json', '*.ico',
        'manifest.json', 'static/media/**/*.svg'
    ];
    // Find assets relative to BUILD_DIR (absolute), get absolute paths
    const assets = assetPatterns.flatMap(pattern => findFiles(pattern, 'assets for compression', BUILD_DIR));

    if (assets.length === 0) { /* ... */ return; }
    log(`Found ${assets.length} assets to compress.`);
    let successCount = 0;
    let failCount = 0;

    const compressionPromises = assets.map(async (sourcePathAbs) => {
        const destinationPathAbs = `${sourcePathAbs}.gz`;
        const fileName = path.basename(sourcePathAbs);
        try {
            const sourceStream = fs.createReadStream(sourcePathAbs);
            const destinationStream = fs.createWriteStream(destinationPathAbs);
            const gzipStream = zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION });
            await pipeline(sourceStream, gzipStream, destinationStream);
            const originalSize = fs.statSync(sourcePathAbs).size;
            const compressedSize = fs.statSync(destinationPathAbs).size;
            log(`Compressed ${fileName} (${formatBytes(originalSize)} -> ${formatBytes(compressedSize)}, ratio: ${(compressedSize / originalSize).toFixed(2)})`, 'success');
            successCount++;
        } catch (error) {
            log(`Failed to compress ${fileName}: ${error.message}`, 'error');
            failCount++;
            if (fs.existsSync(destinationPathAbs)) { try { fs.unlinkSync(destinationPathAbs); } catch (_) {} }
        }
    });
    await Promise.all(compressionPromises);
    log(`Asset compression completed. ${successCount} successful, ${failCount} failed.`, failCount > 0 ? 'warn' : 'success');
}


// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))); // Ensure i is >= 0
    const index = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
}


// Create a report file with optimization details
function createOptimizationReport(startTime, endTime) {
    // Use absolute path for report file
    const reportPathAbs = path.join(BUILD_DIR, 'optimization-report.json');
    log(`Generating optimization report...`);

    try {
        // Use absolute BUILD_DIR path for findFiles baseDir
        const jsFileStats = findFiles('static/js/*.js', 'JS files for report', BUILD_DIR)
            .map(fileAbs => { /* ... map logic using fileAbs ... */
                if (!fs.existsSync(fileAbs)) return null; // Skip if file missing
                const stats = fs.statSync(fileAbs);
                const gzPath = `${fileAbs}.gz`;
                const gzStats = fs.existsSync(gzPath) ? fs.statSync(gzPath) : null;
                return {
                    name: path.basename(fileAbs),
                    size: stats.size, sizeFormatted: formatBytes(stats.size),
                    gzippedSize: gzStats?.size, gzippedSizeFormatted: formatBytes(gzStats?.size),
                };
            }).filter(Boolean); // Remove null entries if files were missing

        const cssFileStats = findFiles('static/css/*.css', 'CSS files for report', BUILD_DIR)
             .map(fileAbs => { /* ... map logic using fileAbs ... */
                 if (!fs.existsSync(fileAbs)) return null;
                 const stats = fs.statSync(fileAbs);
                 const gzPath = `${fileAbs}.gz`;
                 const gzStats = fs.existsSync(gzPath) ? fs.statSync(gzPath) : null;
                 return {
                    name: path.basename(fileAbs),
                    size: stats.size, sizeFormatted: formatBytes(stats.size),
                    gzippedSize: gzStats?.size, gzippedSizeFormatted: formatBytes(gzStats?.size),
                 };
             }).filter(Boolean);

        // ... (calculate totals) ...
        const totalJsSize = jsFileStats.reduce((acc, file) => acc + file.size, 0);
        const totalCssSize = cssFileStats.reduce((acc, file) => acc + file.size, 0);
        const totalGzippedJsSize = jsFileStats.reduce((acc, file) => acc + (file.gzippedSize || 0), 0);
        const totalGzippedCssSize = cssFileStats.reduce((acc, file) => acc + (file.gzippedSize || 0), 0);

        const report = { /* ... report data ... */
            optimizationDate: new Date().toISOString(),
            durationSeconds: ((endTime - startTime) / 1000).toFixed(2),
            totalJsSize: formatBytes(totalJsSize),
            totalCssSize: formatBytes(totalCssSize),
            totalGzippedJsSize: formatBytes(totalGzippedJsSize),
            totalGzippedCssSize: formatBytes(totalGzippedCssSize),
            jsFiles: jsFileStats,
            cssFiles: cssFileStats
        };

        fs.writeFileSync(reportPathAbs, JSON.stringify(report, null, 2));
        log(`Optimization report created at: ${path.relative(PROJECT_ROOT, reportPathAbs)}`, 'success');
    } catch (error) {
        log(`Failed to generate optimization report: ${error.message}`, 'error');
        console.error(error.stack);
    }
}

// Clean up temporary files and directories
function cleanupTempFiles() {
    log('Cleaning up temporary files and directories...');
    const tempPatterns = [
        'static/js/*.tmp', 'static/css/*.tmp', 'static/media/**/*.tmp', '*.tmp',
        'obfuscated_js' // The temp JS dir name relative to BUILD_DIR
    ];
    let cleanedCount = 0;

    tempPatterns.forEach(pattern => {
        // Search relative to BUILD_DIR (absolute), get absolute paths
        const tempItems = glob.sync(pattern, { cwd: BUILD_DIR, absolute: true });

        tempItems.forEach(itemPathAbs => {
            try {
                if (!fs.existsSync(itemPathAbs)) return;
                const stats = fs.statSync(itemPathAbs);
                const itemName = path.relative(PROJECT_ROOT, itemPathAbs);
                if (stats.isDirectory()) {
                    log(`Removing temporary directory: ${itemName}`);
                    fs.rmSync(itemPathAbs, { recursive: true, force: true });
                    cleanedCount++;
                } else if (stats.isFile()) {
                    log(`Removing temporary file: ${itemName}`);
                    fs.unlinkSync(itemPathAbs);
                    cleanedCount++;
                }
            } catch (error) {
                 if (error.code !== 'ENOENT') {
                    log(`Failed to remove temporary item: ${path.basename(itemPathAbs)} - ${error.message}`, 'warn');
                 }
            }
        });
    });

    if (cleanedCount > 0) {
         log(`Cleaned up ${cleanedCount} temporary items.`, 'success');
    } else {
         log('No temporary files or directories found to clean up.');
    }
}

// Main optimization function
async function runOptimization() {
    const startTime = Date.now();
    log(`Starting build & optimization in: ${PROJECT_ROOT}`);
    log(`Node version: ${process.version}, Platform: ${process.platform}`);

    // Step 1: Build
    buildReactApp(); // Exits on failure

    // Ensure build subdirectories exist AFTER build
    // Use the already absolute path variables directly
    ensureDirectoryExists(BUILD_DIR);
    ensureDirectoryExists(JS_DIR);
    ensureDirectoryExists(CSS_DIR);
    ensureDirectoryExists(MEDIA_DIR);

    // Step 2: Purge CSS
    purgeCss();

    // Step 3: Optimize JS
    optimizeJavaScript(); // Uses Vercel-safe strategy

    // Step 4: Optimize Images
    optimizeImages();

    // Step 5: Compress Assets (Async)
    await compressAssets();

    // Step 6: Clean up
    cleanupTempFiles();

    const endTime = Date.now();

    // Step 7: Report
    createOptimizationReport(startTime, endTime);

    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`Build & optimization process finished in ${duration} seconds`, 'success');
}

// Execute the optimization process
runOptimization().catch(error => {
    log(`Unhandled error during optimization: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
});