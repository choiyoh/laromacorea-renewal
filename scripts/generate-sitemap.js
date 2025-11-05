#!/usr/bin/env node

/**
 * Sitemap generation script for build process
 * Generates sitemap.xml in the public directory
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for the site
const BASE_URL = 'https://laromacorea.co.kr';

/**
 * Generate sitemap XML
 */
function generateSitemap(urls) {
  const urlEntries = urls
    .map((url) => {
      return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || '0.5'}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Get static routes for sitemap
 */
function getStaticRoutes() {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      loc: BASE_URL,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${BASE_URL}/home`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${BASE_URL}/board/notice`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${BASE_URL}/board/free`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.8',
    },
    {
      loc: `${BASE_URL}/board/analysis`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.8',
    },
    {
      loc: `${BASE_URL}/board/transfer`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.7',
    },
    {
      loc: `${BASE_URL}/board/fanart`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.6',
    },
  ];
}

/**
 * Main function to generate and save sitemap
 */
function main() {
  try {
    console.log('🗺️  Generating sitemap...');

    const staticRoutes = getStaticRoutes();
    const sitemapXml = generateSitemap(staticRoutes);

    // Save to public directory
    const publicDir = join(__dirname, '..', 'public');
    const sitemapPath = join(publicDir, 'sitemap.xml');

    writeFileSync(sitemapPath, sitemapXml, 'utf8');

    console.log(`✅ Sitemap generated successfully: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${staticRoutes.length}`);

    // Log the URLs for verification
    console.log('\n📋 Generated URLs:');
    staticRoutes.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.loc} (${url.priority})`);
    });
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
main();
