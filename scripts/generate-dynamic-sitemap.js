#!/usr/bin/env node

/**
 * Dynamic sitemap generation script
 * Fetches posts from Firebase and generates comprehensive sitemap
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
 * Get dynamic routes from mock data (for now)
 * In production, this would fetch from Firebase
 */
function getDynamicRoutes() {
  // Mock data - replace with actual Firebase fetch in production
  const mockPosts = [
    {
      id: 'post1',
      boardType: 'notice',
      updatedAt: '2025-09-01',
      priority: '0.7',
    },
    {
      id: 'post2',
      boardType: 'free',
      updatedAt: '2025-09-02',
      priority: '0.5',
    },
  ];

  return mockPosts.map((post) => ({
    loc: `${BASE_URL}/board/${post.boardType}/post/${post.id}`,
    lastmod: post.updatedAt,
    changefreq: 'monthly',
    priority: post.priority || '0.5',
  }));
}

/**
 * Main function to generate comprehensive sitemap
 */
function main() {
  try {
    console.log('🗺️  Generating dynamic sitemap...');

    const staticRoutes = getStaticRoutes();
    const dynamicRoutes = getDynamicRoutes();
    const allRoutes = [...staticRoutes, ...dynamicRoutes];

    const sitemapXml = generateSitemap(allRoutes);

    // Save to public directory
    const publicDir = join(__dirname, '..', 'public');
    const sitemapPath = join(publicDir, 'sitemap.xml');

    writeFileSync(sitemapPath, sitemapXml, 'utf8');

    console.log(`✅ Dynamic sitemap generated successfully: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${allRoutes.length}`);
    console.log(`   - Static routes: ${staticRoutes.length}`);
    console.log(`   - Dynamic routes: ${dynamicRoutes.length}`);

    // Log sample URLs
    console.log('\n📋 Sample URLs:');
    allRoutes.slice(0, 5).forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.loc} (${url.priority})`);
    });

    if (allRoutes.length > 5) {
      console.log(`   ... and ${allRoutes.length - 5} more URLs`);
    }
  } catch (error) {
    console.error('❌ Error generating dynamic sitemap:', error);
    process.exit(1);
  }
}

// Run the script
main();
