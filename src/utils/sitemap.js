/**
 * Sitemap generation utilities for SEO
 */

/**
 * Generate sitemap XML
 * @param {Array} urls - Array of URL objects
 * @returns {string} Sitemap XML
 */
export function generateSitemap(urls) {
  const urlEntries = urls
    .map((url) => {
      return `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || '0.5'}</priority>
  </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Get static routes for sitemap
 * @param {string} baseUrl - Base URL of the site
 * @returns {Array} Array of static URL objects
 */
export function getStaticRoutes(baseUrl = 'https://laromacorea.co.kr') {
  return [
    {
      loc: baseUrl,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${baseUrl}/board/notice`,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/board/squad`,
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      loc: `${baseUrl}/board/match`,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/board/calcio`,
      changefreq: 'daily',
      priority: '0.7',
    },
    {
      loc: `${baseUrl}/board/free`,
      changefreq: 'daily',
      priority: '0.6',
    },
    {
      loc: `${baseUrl}/board/special`,
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: `${baseUrl}/board/media`,
      changefreq: 'weekly',
      priority: '0.6',
    },
  ];
}

/**
 * Get dynamic routes from posts for sitemap
 * @param {Array} posts - Array of post objects
 * @param {string} baseUrl - Base URL of the site
 * @returns {Array} Array of dynamic URL objects
 */
export function getDynamicRoutes(posts, baseUrl = 'https://laromacorea.co.kr') {
  return posts.map((post) => ({
    loc: `${baseUrl}/board/${post.boardType}/post/${post.id}`,
    lastmod: post.updatedAt || post.createdAt,
    changefreq: 'monthly',
    priority: '0.5',
  }));
}

/**
 * Generate and save sitemap (for build process)
 * @param {Array} posts - Array of all posts
 * @param {string} baseUrl - Base URL of the site
 * @returns {string} Generated sitemap XML
 */
export function generateFullSitemap(
  posts = [],
  baseUrl = 'https://laromacorea.co.kr',
) {
  const staticRoutes = getStaticRoutes(baseUrl);
  const dynamicRoutes = getDynamicRoutes(posts, baseUrl);
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  return generateSitemap(allRoutes);
}
