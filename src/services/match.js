/**
 * Match Service
 * 경기 정보 관리를 위한 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// Collection references
const MATCHES_COLLECTION = 'matches'
const TEAMS_COLLECTION = 'teams'

/**
 * 경기 관련 데이터베이스 작업
 */
export const matchService = {
  // 오늘의 경기 조회
  async getTodayMatches() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('date', '>=', startOfDay),
      where('date', '<', endOfDay),
      orderBy('date', 'asc'),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 이번 주 경기 조회
  async getWeekMatches() {
    const today = new Date()
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay(),
    )
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() + 7,
    )

    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('date', '>=', startOfWeek),
      where('date', '<', endOfWeek),
      orderBy('date', 'asc'),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 최근 경기 결과 조회
  async getRecentResults(limitCount = 5) {
    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('status', '==', 'finished'),
      orderBy('date', 'desc'),
      limit(limitCount),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 다가오는 경기 조회
  async getUpcomingMatches(limitCount = 5) {
    const now = new Date()

    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('status', 'in', ['scheduled', 'live']),
      where('date', '>=', now),
      orderBy('date', 'asc'),
      limit(limitCount),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 특정 경기 조회
  async getMatch(matchId) {
    const matchDoc = await getDoc(doc(db, MATCHES_COLLECTION, matchId))
    return matchDoc.exists() ? { id: matchDoc.id, ...matchDoc.data() } : null
  },

  // 경기 생성 (관리자용)
  async createMatch(matchData) {
    const docRef = await addDoc(collection(db, MATCHES_COLLECTION), {
      ...matchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  },

  // 경기 정보 업데이트 (관리자용)
  async updateMatch(matchId, matchData) {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId)
    await updateDoc(matchRef, {
      ...matchData,
      updatedAt: serverTimestamp(),
    })
  },

  // 경기 상태 업데이트
  async updateMatchStatus(matchId, status, score = null) {
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
    }

    if (score) {
      updateData.score = score
    }

    const matchRef = doc(db, MATCHES_COLLECTION, matchId)
    await updateDoc(matchRef, updateData)
  },

  // 득점자 추가
  async addScorer(matchId, scorerData) {
    const match = await this.getMatch(matchId)
    if (!match) throw new Error('Match not found')

    const updatedScorers = [...(match.scorers || []), scorerData]

    const matchRef = doc(db, MATCHES_COLLECTION, matchId)
    await updateDoc(matchRef, {
      scorers: updatedScorers,
      updatedAt: serverTimestamp(),
    })
  },

  // 로마 경기만 조회
  async getRomaMatches(limitCount = 10) {
    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('teams', 'array-contains', 'AS Roma'),
      orderBy('date', 'desc'),
      limit(limitCount),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 경기 검색
  async searchMatches(searchTerm, limitCount = 20) {
    // Firestore doesn't support full-text search, so we'll do a simple query
    // In a real application, you might want to use Algolia or similar service
    const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'), limit(limitCount))

    const snapshot = await getDocs(q)
    const matches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Client-side filtering (not ideal for large datasets)
    return matches.filter(
      (match) =>
        match.homeTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.awayTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.competition?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  },
}

/**
 * 팀 관련 데이터베이스 작업
 */
export const teamService = {
  // 모든 팀 조회
  async getAllTeams() {
    const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // 특정 팀 조회
  async getTeam(teamId) {
    const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, teamId))
    return teamDoc.exists() ? { id: teamDoc.id, ...teamDoc.data() } : null
  },

  // 팀 생성 (관리자용)
  async createTeam(teamData) {
    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), {
      ...teamData,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },
}

/**
 * 샘플 경기 데이터 생성 함수
 */
export function createSampleMatchData() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return [
    {
      id: 'match-1',
      date: today,
      competition: 'Serie A',
      round: '15라운드',
      status: 'live',
      homeTeam: {
        name: 'AS Roma',
        logo: '/images/teams/roma.png',
      },
      awayTeam: {
        name: 'Juventus',
        logo: '/images/teams/juventus.png',
      },
      score: {
        home: 2,
        away: 1,
      },
      venue: 'Stadio Olimpico',
      referee: 'Daniele Orsato',
      weather: '맑음, 18°C',
      scorers: [
        {
          id: 1,
          minute: 23,
          player: 'Paulo Dybala',
          type: 'goal',
        },
        {
          id: 2,
          minute: 45,
          player: 'Dusan Vlahovic',
          type: 'goal',
        },
        {
          id: 3,
          minute: 78,
          player: 'Tammy Abraham',
          type: 'goal',
        },
      ],
      displayName: 'AS Roma vs Juventus',
    },
    {
      id: 'match-2',
      date: tomorrow,
      competition: 'Serie A',
      round: '16라운드',
      status: 'scheduled',
      homeTeam: {
        name: 'AC Milan',
        logo: '/images/teams/milan.png',
      },
      awayTeam: {
        name: 'AS Roma',
        logo: '/images/teams/roma.png',
      },
      score: {
        home: 0,
        away: 0,
      },
      venue: 'San Siro',
      referee: 'Marco Guida',
      weather: '구름, 15°C',
      scorers: [],
      displayName: 'AC Milan vs AS Roma',
    },
  ]
}

/**
 * 경기 데이터 초기화 함수
 */
export async function initializeMatchData() {
  try {
    // Check if matches already exist
    const existingMatches = await matchService.getTodayMatches()
    if (existingMatches.length > 0) {
      console.log('Match data already exists')
      return
    }

    // Create sample matches
    const sampleMatches = createSampleMatchData()

    for (const matchData of sampleMatches) {
      const { id, displayName, ...data } = matchData
      await matchService.createMatch(data)
    }

    console.log('Sample match data created successfully')
  } catch (error) {
    console.error('Error initializing match data:', error)
  }
}
