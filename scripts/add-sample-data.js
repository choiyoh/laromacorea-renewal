#!/usr/bin/env node

/**
 * Sample Data Creation Script
 * Firestore에 샘플 데이터를 추가하는 스크립트
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: 'AIzaSyB1U6nGlj44w0OuYWStPz2Uh5Lv--63kK8',
  authDomain: 'laromacorea-renewal.firebaseapp.com',
  projectId: 'laromacorea-renewal',
  storageBucket: 'laromacorea-renewal.firebasestorage.app',
  messagingSenderId: '210421182725',
  appId: '1:210421182725:web:968be34d1c9ababb51876c',
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
}

// 샘플 게시글 데이터
const samplePosts = [
  {
    title: 'AS 로마 vs 라치오 더비 경기 분석',
    content:
      '<p>로마 더비가 다가오고 있습니다. 이번 경기에서 주목해야 할 포인트들을 분석해보겠습니다.</p>',
    boardType: 'match',
    authorId: 'sample-user-1',
    authorName: '로마팬123',
    authorIcon: null,
    viewCount: 156,
    likeCount: 23,
    commentCount: 8,
    isPinned: false,
    isDeleted: false,
    tags: ['더비', '라치오', '분석'],
    mediaUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: '새로운 선수 영입 소식',
    content: '<p>AS 로마가 새로운 미드필더 영입을 추진하고 있다는 소식입니다.</p>',
    boardType: 'squad',
    authorId: 'sample-user-2',
    authorName: '로마뉴스',
    authorIcon: null,
    viewCount: 89,
    likeCount: 15,
    commentCount: 4,
    isPinned: true,
    isDeleted: false,
    tags: ['영입', '미드필더', '이적'],
    mediaUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: '로마 팬들을 위한 응원가 모음',
    content: '<p>경기장에서 부르는 로마 응원가들을 모아봤습니다. 함께 불러요!</p>',
    boardType: 'free',
    authorId: 'sample-user-3',
    authorName: '응원단장',
    authorIcon: null,
    viewCount: 234,
    likeCount: 45,
    commentCount: 12,
    isPinned: false,
    isDeleted: false,
    tags: ['응원가', '팬', '경기장'],
    mediaUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: '이번 주 경기 일정 안내',
    content: '<p>이번 주 AS 로마의 경기 일정을 안내드립니다.</p>',
    boardType: 'notice',
    authorId: 'admin-user',
    authorName: '관리자',
    authorIcon: null,
    viewCount: 445,
    likeCount: 67,
    commentCount: 3,
    isPinned: true,
    isDeleted: false,
    tags: ['공지', '경기일정', '안내'],
    mediaUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    title: '로마 경기 하이라이트 영상',
    content: '<p>지난 경기의 하이라이트 영상을 공유합니다.</p>',
    boardType: 'media',
    authorId: 'sample-user-4',
    authorName: '영상편집자',
    authorIcon: null,
    viewCount: 678,
    likeCount: 89,
    commentCount: 15,
    isPinned: false,
    isDeleted: false,
    tags: ['하이라이트', '영상', '경기'],
    mediaUrls: ['https://example.com/highlight.mp4'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
]

async function addSampleData() {
  console.log(`${colors.blue}📝 샘플 데이터 추가 시작${colors.reset}\n`)

  try {
    for (const post of samplePosts) {
      const docRef = await addDoc(collection(db, 'posts'), post)
      log.success(`게시글 추가됨: ${post.title} (ID: ${docRef.id})`)
    }

    log.success(`\n총 ${samplePosts.length}개의 샘플 게시글이 추가되었습니다!`)
    log.info('이제 웹사이트에서 게시글을 확인할 수 있습니다.')
    log.info('사이트 URL: https://laromacorea-renewal.web.app')
  } catch (error) {
    log.error(`샘플 데이터 추가 중 오류 발생: ${error.message}`)
    process.exit(1)
  }
}

addSampleData()
