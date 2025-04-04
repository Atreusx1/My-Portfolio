// sitemap.js
const { SitemapStream } = require('sitemap');
const fs = require('fs');
const path = require('path');

// Base URL of your website
const domain = 'https://yourwebsite.com';

// Define output directory - this is where the build files go
const OUTPUT_DIR = './build';

// Define static routes from your App.js
const staticRoutes = [
  '/',
  '/propertylisting',
  '/aboutus',
  '/mortgage',
  '/contactuspage',
  // Exclude admin and login routes as they shouldn't be indexed
  // '/admin',
  // '/login',
];

// Sample static data for dynamic routes (until API is ready)
const samplePropertyIds = ['prop1', 'prop2', 'prop3'];
const sampleSaleIds = ['sale1', 'sale2', 'sale3'];
const sampleOffplanIds = ['offplan1', 'offplan2', 'offplan3'];

async function generateSitemap() {
  try {
    // Check if build directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      console.log(`Build directory "${OUTPUT_DIR}" doesn't exist, creating it...`);
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Use sample static data instead of API calls until backend is ready
    const propertyIds = samplePropertyIds;
    const saleIds = sampleSaleIds;
    const offplanIds = sampleOffplanIds;

    // Create all routes
    const routes = [
      ...staticRoutes,
      ...propertyIds.map(id => `/property/${id}`),
      ...saleIds.map(id => `/sale/${id}`),
      ...offplanIds.map(id => `/offplan/${id}`),
    ];

    // Create sitemap stream
    const smStream = new SitemapStream({ hostname: domain });
    
    // Add each URL to the stream with appropriate priority
    routes.forEach(route => {
      let priority = 0.7; // Default priority
      
      // Adjust priority based on route importance
      if (route === '/') {
        priority = 1.0; // Homepage gets highest priority
      } else if (route === '/propertylisting') {
        priority = 0.9; // Property listing page is important
      } else if (route.includes('/property/') || route.includes('/offplan/') || route.includes('/sale/')) {
        priority = 0.8; // Individual property pages
      }
      
      // Determine change frequency
      let changefreq = 'weekly';
      if (route === '/') {
        changefreq = 'daily';
      } else if (route.includes('/property/') || route.includes('/offplan/') || route.includes('/sale/')) {
        changefreq = 'weekly';
      }
      
      smStream.write({
        url: route,
        changefreq,
        priority,
        lastmod: new Date().toISOString()
      });
    });
    
    // End the stream
    smStream.end();
    
    // Convert stream to string/buffer
    let sitemap = '';
    smStream.on('data', data => {
      sitemap += data.toString();
    });
    
    smStream.on('end', () => {
      // Write sitemap to build directory
      fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
      console.log(`Sitemap generated successfully at ${path.join(OUTPUT_DIR, 'sitemap.xml')}`);
      
      // Create robots.txt
      const robotsTxt = `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /admin/*

Sitemap: ${domain}/sitemap.xml
`;
      
      fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxt.trim());
      console.log(`Robots.txt generated successfully at ${path.join(OUTPUT_DIR, 'robots.txt')}`);
    });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

// Run the generation
generateSitemap();