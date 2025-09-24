/**
 * SEO composable for managing meta tags and structured data
 */

import { useHead } from '@unhead/vue';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

export function useSEO(options = {}) {
  const route = useRoute();

  const defaultMeta = {
    title: 'AS 로마 한국 팬 커뮤니티 - La Roma Corea',
    description:
      'AS 로마 한국 팬들을 위한 커뮤니티 사이트. 최신 경기 정보, 선수 소식, 팬들과의 소통을 즐겨보세요.',
    keywords:
      'AS 로마, AS Roma, 축구, 세리에A, 한국 팬클럽, 로마 팬, 축구 커뮤니티',
    author: 'La Roma Corea',
    image: '/og-image.jpg',
    url: 'https://laromacorea.co.kr',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'La Roma Corea',
  };

  const meta = computed(() => ({
    ...defaultMeta,
    ...options,
  }));

  const canonicalUrl = computed(() => {
    const baseUrl = meta.value.url;
    return `${baseUrl}${route.fullPath}`;
  });

  const structuredData = computed(() => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: meta.value.siteName,
      description: meta.value.description,
      url: meta.value.url,
      author: {
        '@type': 'Organization',
        name: meta.value.author,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${meta.value.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    // Add specific structured data based on page type
    if (options.type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: meta.value.title,
        description: meta.value.description,
        image: meta.value.image,
        author: {
          '@type': 'Person',
          name: options.authorName || meta.value.author,
        },
        publisher: {
          '@type': 'Organization',
          name: meta.value.siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${meta.value.url}/logo.png`,
          },
        },
        datePublished: options.publishedTime,
        dateModified: options.modifiedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl.value,
        },
      };
    }

    if (options.type === 'profile') {
      return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: options.profileName,
          description: options.profileDescription,
          image: options.profileImage,
        },
      };
    }

    return baseData;
  });

  // Set up head management
  useHead({
    title: meta.value.title,
    meta: [
      // Basic meta tags
      { name: 'description', content: meta.value.description },
      { name: 'keywords', content: meta.value.keywords },
      { name: 'author', content: meta.value.author },
      { name: 'robots', content: 'index, follow' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },

      // Open Graph tags
      { property: 'og:title', content: meta.value.title },
      { property: 'og:description', content: meta.value.description },
      { property: 'og:image', content: meta.value.image },
      { property: 'og:url', content: canonicalUrl.value },
      { property: 'og:type', content: meta.value.type },
      { property: 'og:locale', content: meta.value.locale },
      { property: 'og:site_name', content: meta.value.siteName },

      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.value.title },
      { name: 'twitter:description', content: meta.value.description },
      { name: 'twitter:image', content: meta.value.image },

      // Additional meta tags
      { name: 'theme-color', content: '#990a2c' },
      { name: 'msapplication-TileColor', content: '#990a2c' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: meta.value.siteName },
    ],
    link: [
      // Canonical URL
      { rel: 'canonical', href: canonicalUrl.value },

      // Favicon and app icons
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },

      // Preconnect to external domains
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      { rel: 'preconnect', href: 'https://firebaseapp.com' },
    ],
    script: [
      // Structured data
      {
        type: 'application/ld+json',
        children: JSON.stringify(structuredData.value),
      },
    ],
  });

  // Update meta tags when route changes
  watch(
    () => route.fullPath,
    () => {
      // Update canonical URL and other dynamic meta tags
    },
    { immediate: true },
  );

  return {
    meta,
    canonicalUrl,
    structuredData,
    updateMeta: (newMeta) => {
      Object.assign(options, newMeta);
    },
  };
}

/**
 * Generate meta tags for board pages
 */
export function useBoardSEO(boardType, posts = []) {
  const boardTitles = {
    notice: 'Notice',
    squad: 'Squad',
    match: 'Match',
    calcio: 'Calcio',
    free: 'Free',
    special: 'Special',
    media: '미디어',
    icon: '아이콘 상점',
  };

  const boardDescriptions = {
    notice: 'Check official announcements from AS Roma Korea Community.',
    squad: 'Get the latest AS Roma squad information and player news.',
    match: 'View AS Roma match schedules, results, and analysis.',
    calcio: 'Stay updated with Italian football and Serie A news.',
    free: 'Connect and chat freely with AS Roma fans.',
    special: 'Discover special AS Roma events and exclusive content.',
    media: 'Share AS Roma photos and videos with the community.',
    icon: '포인트로 아이콘을 구매하고 개성을 표현하세요.',
  };

  return useSEO({
    title: `${boardTitles[boardType]} - AS 로마 한국 팬 커뮤니티`,
    description: boardDescriptions[boardType],
    type: 'website',
  });
}

/**
 * Generate meta tags for post pages
 */
export function usePostSEO(post) {
  if (!post) {
    return useSEO();
  }

  const title = `${post.title} - AS 로마 한국 팬 커뮤니티`;
  const description = post.content
    ? post.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : 'AS 로마 한국 팬 커뮤니티의 게시글을 확인하세요.';

  return useSEO({
    title,
    description,
    type: 'article',
    authorName: post.authorName,
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt,
    image: post.mediaUrls?.[0] || '/og-image.jpg',
  });
}

/**
 * Generate meta tags for user profile pages
 */
export function useProfileSEO(user) {
  if (!user) {
    return useSEO();
  }

  return useSEO({
    title: `${user.displayName} - 프로필`,
    description: `AS 로마 팬 ${user.displayName}님의 프로필을 확인하세요.`,
    type: 'profile',
    profileName: user.displayName,
    profileImage: user.photoURL,
  });
}
