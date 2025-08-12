/**
 * Database Initialization Service
 * 초기 데이터베이스 설정 및 게시판 구성
 */

import { collection, doc, setDoc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// 게시판 초기 설정 데이터
const initialBoards = [
  {
    id: 'notice',
    name: 'Notice',
    description: '공지사항 게시판',
    order: 1,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: false,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'squad',
    name: 'Squad',
    description: '스쿼드 및 선수 정보',
    order: 2,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'match',
    name: 'Match',
    description: '경기 관련 게시판',
    order: 3,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'calcio',
    name: 'Calcio',
    description: '축구 일반 소식',
    order: 4,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'free',
    name: 'Free',
    description: '자유 게시판',
    order: 5,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'special',
    name: 'Special',
    description: '특별 게시판',
    order: 6,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
  {
    id: 'media',
    name: 'Media',
    description: '미디어 게시판',
    order: 7,
    isActive: true,
    permissions: {
      read: ['user', 'admin'],
      write: ['user', 'admin'],
      moderate: ['admin'],
    },
    settings: {
      allowMedia: true,
      allowComments: true,
      requireApproval: false,
    },
  },
]

// 기본 아이콘 데이터
const initialIcons = [
  {
    id: 'default-user',
    name: '기본 사용자',
    imageUrl: 'https://cdn.vuetifyjs.com/images/john.jpg',
    price: 0,
    category: 'default',
    description: '기본 사용자 아이콘',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'roma-logo',
    name: 'AS 로마 로고',
    imageUrl: 'https://logos-world.net/wp-content/uploads/2020/06/AS-Roma-Logo.png',
    price: 100,
    category: 'logo',
    description: 'AS 로마 공식 로고',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'totti',
    name: '토티',
    imageUrl: 'https://img.a.transfermarkt.technology/portrait/big/3330-1442996710.jpg?lm=1',
    price: 500,
    category: 'player',
    description: '프란체스코 토티 아이콘',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'de-rossi',
    name: '데 로시',
    imageUrl: 'https://img.a.transfermarkt.technology/portrait/big/5677-1442996710.jpg?lm=1',
    price: 400,
    category: 'player',
    description: '다니엘레 데 로시 아이콘',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'roma-wolf',
    name: '로마 늑대',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/AS_Roma_logo_%282017%29.svg/1200px-AS_Roma_logo_%282017%29.svg.png',
    price: 200,
    category: 'logo',
    description: '로마의 상징 늑대',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'champions-league',
    name: '챔피언스리그',
    imageUrl:
      'https://logoeps.com/wp-content/uploads/2013/03/uefa-champions-league-vector-logo.png',
    price: 300,
    category: 'special',
    description: 'UEFA 챔피언스리그 로고',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'serie-a',
    name: '세리에 A',
    imageUrl: 'https://logoeps.com/wp-content/uploads/2014/05/serie-a-vector-logo.png',
    price: 150,
    category: 'special',
    description: '이탈리아 세리에 A 로고',
    isActive: true,
    purchaseCount: 0,
  },
  {
    id: 'christmas-special',
    name: '크리스마스 특별',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3159/3159068.png',
    price: 250,
    category: 'seasonal',
    description: '크리스마스 시즌 특별 아이콘',
    isActive: true,
    purchaseCount: 0,
  },
]

/**
 * 게시판 초기 설정
 */
export async function initializeBoards() {
  try {
    const boardsRef = collection(db, 'boards')
    const existingBoards = await getDocs(boardsRef)

    // 이미 게시판이 설정되어 있으면 스킵
    if (!existingBoards.empty) {
      console.log('게시판이 이미 설정되어 있습니다.')
      return
    }

    // 각 게시판 설정 생성
    for (const board of initialBoards) {
      const boardDoc = doc(db, 'boards', board.id)
      await setDoc(boardDoc, {
        ...board,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log('게시판 초기 설정이 완료되었습니다.')
  } catch (error) {
    console.error('게시판 초기 설정 중 오류 발생:', error)
    throw error
  }
}

/**
 * 아이콘 초기 설정
 */
export async function initializeIcons() {
  try {
    const iconsRef = collection(db, 'icons')
    const existingIcons = await getDocs(iconsRef)

    // 이미 아이콘이 설정되어 있으면 스킵
    if (!existingIcons.empty) {
      console.log('아이콘이 이미 설정되어 있습니다.')
      return
    }

    // 각 아이콘 생성
    for (const icon of initialIcons) {
      const iconDoc = doc(db, 'icons', icon.id)
      await setDoc(iconDoc, {
        ...icon,
        createdAt: new Date(),
        createdBy: 'system',
      })
    }

    console.log('아이콘 초기 설정이 완료되었습니다.')
  } catch (error) {
    console.error('아이콘 초기 설정 중 오류 발생:', error)
    throw error
  }
}

/**
 * 전체 데이터베이스 초기화
 */
export async function initializeDatabase() {
  try {
    console.log('데이터베이스 초기화를 시작합니다...')

    await initializeBoards()
    await initializeIcons()

    console.log('데이터베이스 초기화가 완료되었습니다.')
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error)
    throw error
  }
}

/**
 * 사용자 프로필 초기화 (회원가입 시 호출)
 */
export async function initializeUserProfile(uid, userData) {
  try {
    const userDoc = doc(db, 'users', uid)
    const initialUserData = {
      uid,
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      photoURL: userData.photoURL || null,
      selectedIcon: 'default-user',
      points: 100, // 가입 축하 포인트
      role: 'user',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      profile: {
        bio: '',
        favoritePlayer: '',
        joinDate: new Date(),
      },
    }

    await setDoc(userDoc, initialUserData)

    // 가입 축하 포인트 내역 추가
    const pointsHistoryDoc = doc(collection(db, 'points_history'))
    await setDoc(pointsHistoryDoc, {
      userId: uid,
      type: 'earned',
      amount: 100,
      reason: 'signup_bonus',
      relatedId: null,
      createdAt: new Date(),
      adminId: null,
    })

    console.log('사용자 프로필이 초기화되었습니다.')
    return initialUserData
  } catch (error) {
    console.error('사용자 프로필 초기화 중 오류 발생:', error)
    throw error
  }
}
