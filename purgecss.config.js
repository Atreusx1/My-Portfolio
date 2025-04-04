module.exports = {
  // Scan source files AND build output for comprehensive detection
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}', // Include source files (JS, JSX, TS, TSX, HTML)
    './public/index.html',            // Include the public HTML template
    './build/index.html',             // Include the final built HTML
    './build/static/js/**/*.js',      // Include the built JS
  ],
  // Process CSS files in the build output
  css: [
    './build/static/css/**/*.css'
  ],
  // More specific safelisting using object format for better control
  safelist: {
    // Standard safelist (matches exact strings or regex patterns)
    standard: [
      /--(\w+)/,           // Keep all CSS variables (--*)
      /^fa-/,              // Keep all Font Awesome classes (fa-*)
      /^leaflet-/,         // Keep all Leaflet classes (leaflet-*)
      'active',            // Keep 'active' class
      'disabled',          // Keep 'disabled' class
      'modal-open',        // Keep 'modal-open' class often added to <body>
      'modal-backdrop',    // Keep 'modal-backdrop'
      'tooltip',           // Keep 'tooltip' class if using Bootstrap tooltips
      'popover',           // Keep 'popover' class if using Bootstrap popovers
      // Add specific 3rd-party library prefixes if needed and dynamically added
      // /^Mui/, // Example for Material UI
      // /^ant-/, // Example for Ant Design
      // /^Toastify/, // Example for React-Toastify
    ],
    // Deep safelist (matches selectors containing these patterns, useful for children)
    // Example: Keeps .modal and any selector like .modal .child-class
    deep: [
        /^modal/,          // Keep .modal and its descendants
        /^dropdown/,       // Keep .dropdown and its descendants
        /^collapse/,       // Keep .collapse, .collapsing and descendants
        /^carousel/,       // Keep .carousel and its descendants
        /^offcanvas/,      // Keep .offcanvas and its descendants
        /^alert/,          // Keep .alert and its descendants
    ],
    // Greedy safelist (matches selectors containing these patterns anywhere)
    // Use sparingly, can lead to keeping unused CSS.
    // Useful for classes added very dynamically or with complex interactions.
    greedy: [
        // Example: /^some-very-dynamic-pattern/
    ],
    // Keep specific keyframes needed by libraries
    keyframes: [
        'fade',
        'show',
        // Add others if needed
    ],
    // Keep specific variables if the standard pattern isn't enough
    variables: [
        // '--my-specific-variable',
    ]
  },
  output: './build/static/css/', // Overwrite original files
  fontFace: true,       // Keep @font-face rules
  rejected: false,      // Don't output rejected selectors list
};