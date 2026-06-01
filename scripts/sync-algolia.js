/**
 * Algolia 데이터 동기화 스크립트
 * 기존 Firestore 게시물을 Algolia에 일괄 동기화
 *
 * 사용법:
 * 1. 환경 변수 설정: export ALGOLIA_APP_ID="..." ALGOLIA_ADMIN_KEY="..."
 * 2. node scripts/sync-algolia.js 실행
 */

import admin from 'firebase-admin';
import { algoliasearch } from 'algoliasearch';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// __dirname 대체 (ES 모듈 호환)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// serviceAccountKey.json 동적 로드
const require = createRequire(import.meta.url);
const serviceAccount = require(join(__dirname, '../serviceAccountKey.json'));

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Algolia 설정 (환경 변수에서 가져옴)
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('다음 명령어로 환경 변수를 설정하세요:');
  console.error('export ALGOLIA_APP_ID="your_app_id"');
  console.error('export ALGOLIA_ADMIN_KEY="your_admin_key"');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

/**
 * HTML 태그 제거
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Algolia record size limit을 넘지 않도록 UTF-8 byte 기준으로 자름
 */
function truncateUtf8(value, maxBytes) {
  if (!value || Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value || '';
  }

  let output = '';
  let bytes = 0;

  for (const char of value) {
    const charBytes = Buffer.byteLength(char, 'utf8');
    if (bytes + charBytes > maxBytes) break;
    output += char;
    bytes += charBytes;
  }

  return output;
}

/**
 * Firestore Timestamp/Date/number 값을 Algolia 정렬용 millis로 변환
 */
function toMillis(value) {
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  if (value && typeof value._seconds === 'number') {
    return value._seconds * 1000;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }

  return Date.now();
}

/**
 * Firestore 문서를 Algolia 객체로 변환
 */
function transformPost(doc) {
  const data = doc.data();

  return {
    objectID: doc.id,
    title: data.title || '',
    content: truncateUtf8(stripHtml(data.content || ''), 4000),
    authorName: data.authorName || '',
    authorId: data.authorId || '',
    boardType: data.boardType || '',
    tags: data.tags || [],
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    isPinned: data.isPinned || false,
    isDeleted: data.isDeleted || false,
    createdAt: toMillis(data.createdAt),
  };
}

const relevanceRankingCriteria = [
  'typo',
  'geo',
  'words',
  'filters',
  'proximity',
  'attribute',
  'exact',
  'custom',
];

/**
 * Algolia 인덱스 설정 구성
 */
async function configureIndex() {
  console.log('🔧 Algolia 인덱스 설정 구성 중...');

  try {
    // 기본 인덱스 설정
    await client.setSettings({
      indexName: 'posts',
      indexSettings: {
        // 검색 가능한 속성
        searchableAttributes: ['title', 'content', 'authorName', 'tags'],

        // 필터링/패싯 가능한 속성
        attributesForFaceting: ['boardType', 'tags', 'isDeleted', 'isPinned'],

        // 정렬 기준 (기본: 고정글 우선, 최신순)
        ranking: [
          'desc(isPinned)',
          'desc(createdAt)',
          ...relevanceRankingCriteria,
        ],

        // 하이라이팅 설정
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',

        // 반환할 속성
        attributesToRetrieve: [
          'objectID',
          'title',
          'content',
          'authorName',
          'authorId',
          'boardType',
          'tags',
          'viewCount',
          'likeCount',
          'commentCount',
          'isPinned',
          'createdAt',
        ],

        // 정렬별 replica 설정
        replicas: [
          'posts_views_desc',
          'posts_likes_desc',
          'posts_comments_desc',
        ],
      },
    });

    console.log('✅ 기본 인덱스 설정 완료');

    // Replica 인덱스 설정
    const replicas = [
      {
        name: 'posts_views_desc',
        ranking: [
          'desc(isPinned)',
          'desc(viewCount)',
          ...relevanceRankingCriteria,
        ],
      },
      {
        name: 'posts_likes_desc',
        ranking: [
          'desc(isPinned)',
          'desc(likeCount)',
          ...relevanceRankingCriteria,
        ],
      },
      {
        name: 'posts_comments_desc',
        ranking: [
          'desc(isPinned)',
          'desc(commentCount)',
          ...relevanceRankingCriteria,
        ],
      },
    ];

    console.log('🔧 Replica 인덱스 생성 중...');

    for (const replica of replicas) {
      await client.setSettings({
        indexName: replica.name,
        indexSettings: {
          ranking: replica.ranking,
        },
      });
      console.log(`  ✅ ${replica.name} 생성됨`);
    }

    console.log('✅ 모든 인덱스 설정 완료');
  } catch (error) {
    console.error('❌ 인덱스 설정 실패:', error.message);
    throw error;
  }
}

/**
 * 모든 게시물 동기화
 */
async function syncAllPosts() {
  console.log('📚 Firestore 게시물 동기화 시작...\n');

  try {
    // 삭제되지 않은 모든 게시물 가져오기
    const snapshot = await db
      .collection('posts')
      .where('isDeleted', '==', false)
      .get();

    if (snapshot.empty) {
      console.log('⚠️ 동기화할 게시물이 없습니다.');
      return;
    }

    console.log(`📝 총 ${snapshot.size}개의 게시물 발견\n`);

    // 게시물 변환
    const posts = [];
    snapshot.forEach((doc) => {
      posts.push(transformPost(doc));
    });

    // 배치 처리 (1000개씩)
    const batchSize = 1000;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      await client.saveObjects({
        indexName: 'posts',
        objects: batch,
      });
      console.log(`  ✅ ${i + batch.length}/${posts.length} 동기화됨`);
    }

    console.log(
      `\n🎉 ${posts.length}개의 게시물이 Algolia에 동기화되었습니다!`,
    );
  } catch (error) {
    console.error('❌ 동기화 실패:', error.message);
    throw error;
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 Algolia 동기화 스크립트 시작\n');
  console.log('='.repeat(50));

  try {
    // 1. 인덱스 설정
    await configureIndex();

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 게시물 동기화
    await syncAllPosts();

    console.log('\n' + '='.repeat(50));
    console.log('✅ 모든 작업이 완료되었습니다!');
    console.log('\n다음 단계:');
    console.log(
      '1. Algolia 콘솔에서 인덱스 확인: https://www.algolia.com/apps',
    );
    console.log(
      '2. .env 파일에 VITE_ALGOLIA_APP_ID, VITE_ALGOLIA_SEARCH_KEY 추가',
    );
    console.log('3. Firebase Functions 배포: firebase deploy --only functions');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

main();
