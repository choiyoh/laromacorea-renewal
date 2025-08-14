/**
 * Match Service
 * TheSportsDB API를 통한 AS 로마 경기 일정 연동 서비스
 */

// AS 로마 팀 ID (TheSportsDB 기준)
const AS_ROMA_TEAM_ID = '133682'

// TheSportsDB API 설정
const THESPORTSDB_CONFIG = {
  baseUrl: 'https://www.thesportsdb.com/api/v1/json/123',
}

export const matchService = {
  /**
   * AS 로마의 다음 경기 일정 조회
   */
  async getUpcomingMatches() {
    try {
      console.log('Fetching AS Roma upcoming matches from TheSportsDB...')
      const matches = await this.fetchUpcomingMatches()

      if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} upcoming Roma matches`)
        return matches.slice(0, 5) // 최대 5경기
      }
    } catch (error) {
      console.warn('TheSportsDB API failed:', error.message)
    }

    // API 실패 시 임시 데이터 반환
    console.info('Using fallback mock data')
    return this.getMockMatches()
  },

  /**
   * TheSportsDB에서 다음 경기 데이터 가져오기
   */
  async fetchUpcomingMatches() {
    const url = `${THESPORTSDB_CONFIG.baseUrl}/eventsnext.php?id=${AS_ROMA_TEAM_ID}`
    console.log('Fetching from TheSportsDB:', url)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`TheSportsDB request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('TheSportsDB data loaded successfully:', data)

    return this.parseUpcomingMatches(data)
  },

  /**
   * TheSportsDB 데이터 파싱
   */
  parseUpcomingMatches(data) {
    if (!data.events || data.events.length === 0) {
      console.info('No upcoming matches found')
      return []
    }

    return data.events.map((event) => this.formatMatch(event))
  },

  /**
   * 경기 데이터 포맷팅
   */
  formatMatch(event) {
    // 시간 처리
    let timeStr = '20:00:00' // 기본값
    if (event.strTime) {
      if (event.strTime.includes(':')) {
        timeStr = event.strTime
      } else {
        // "2000" 형식을 "20:00:00"으로 변환
        timeStr = event.strTime.substring(0, 2) + ':' + event.strTime.substring(2, 4) + ':00'
      }
    }

    const utcDate = event.dateEvent + 'T' + timeStr + 'Z'

    return {
      id: event.idEvent,
      utcDate: utcDate,
      status: 'SCHEDULED',
      homeTeam: {
        id: event.idHomeTeam,
        name: event.strHomeTeam,
        shortName: this.getShortTeamName(event.strHomeTeam),
        crest: event.strHomeTeamBadge,
      },
      awayTeam: {
        id: event.idAwayTeam,
        name: event.strAwayTeam,
        shortName: this.getShortTeamName(event.strAwayTeam),
        crest: event.strAwayTeamBadge,
      },
      competition: {
        name: event.strLeague,
      },
      venue: event.strVenue,
    }
  },

  /**
   * 팀명 단축 처리
   */
  getShortTeamName(fullName) {
    if (!fullName) return 'Unknown'

    const shortNames = {
      'AS Roma': 'Roma',
      Roma: 'Roma',
      Juventus: 'Juventus',
      'AC Milan': 'Milan',
      Milan: 'Milan',
      'Inter Milan': 'Inter',
      Inter: 'Inter',
      'SSC Napoli': 'Napoli',
      Napoli: 'Napoli',
      'Atalanta BC': 'Atalanta',
      Atalanta: 'Atalanta',
      'SS Lazio': 'Lazio',
      Lazio: 'Lazio',
      'ACF Fiorentina': 'Fiorentina',
      Fiorentina: 'Fiorentina',
      'Torino FC': 'Torino',
      Torino: 'Torino',
      'Bologna FC': 'Bologna',
      Bologna: 'Bologna',
      'Udinese Calcio': 'Udinese',
      Udinese: 'Udinese',
      'US Sassuolo': 'Sassuolo',
      Sassuolo: 'Sassuolo',
      'Hellas Verona': 'Verona',
      Verona: 'Verona',
      'Genoa CFC': 'Genoa',
      Genoa: 'Genoa',
      'Cagliari Calcio': 'Cagliari',
      Cagliari: 'Cagliari',
      'US Lecce': 'Lecce',
      Lecce: 'Lecce',
      'Empoli FC': 'Empoli',
      Empoli: 'Empoli',
      Monza: 'Monza',
      'Parma Calcio': 'Parma',
      Parma: 'Parma',
      'Como 1907': 'Como',
      Como: 'Como',
      'Venezia FC': 'Venezia',
      Venezia: 'Venezia',
    }

    return shortNames[fullName] || fullName
  },

  /**
   * AS 로마의 지난 경기 결과 조회 (1경기만)
   */
  async getRecentResults() {
    try {
      console.log('Fetching AS Roma recent result from TheSportsDB...')
      const result = await this.fetchRecentResult()

      if (result) {
        console.log('Found recent Roma result')
        return [result] // 1경기만 배열로 반환
      }
    } catch (error) {
      console.warn('TheSportsDB recent results API failed:', error.message)
    }

    // API 실패 시 빈 배열 반환
    console.info('No recent results available')
    return []
  },

  /**
   * TheSportsDB에서 지난 경기 결과 가져오기
   */
  async fetchRecentResult() {
    const url = `${THESPORTSDB_CONFIG.baseUrl}/eventslast.php?id=${AS_ROMA_TEAM_ID}`
    console.log('Fetching recent result from TheSportsDB:', url)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`TheSportsDB recent results request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('TheSportsDB recent results data loaded:', data)

    return this.parseRecentResult(data)
  },

  /**
   * 지난 경기 결과 데이터 파싱
   */
  parseRecentResult(data) {
    if (!data.results || data.results.length === 0) {
      console.info('No recent results found')
      return null
    }

    // 가장 최근 경기 1개만 가져오기
    const event = data.results[0]
    return this.formatResult(event)
  },

  /**
   * 경기 결과 데이터 포맷팅
   */
  formatResult(event) {
    // 시간 처리
    let timeStr = '20:00:00' // 기본값
    if (event.strTime) {
      if (event.strTime.includes(':')) {
        timeStr = event.strTime
      } else {
        timeStr = event.strTime.substring(0, 2) + ':' + event.strTime.substring(2, 4) + ':00'
      }
    }

    const utcDate = event.dateEvent + 'T' + timeStr + 'Z'

    return {
      id: event.idEvent,
      utcDate: utcDate,
      status: 'FINISHED',
      homeTeam: {
        id: event.idHomeTeam,
        name: event.strHomeTeam,
        shortName: this.getShortTeamName(event.strHomeTeam),
        crest: event.strHomeTeamBadge,
      },
      awayTeam: {
        id: event.idAwayTeam,
        name: event.strAwayTeam,
        shortName: this.getShortTeamName(event.strAwayTeam),
        crest: event.strAwayTeamBadge,
      },
      score: {
        fullTime: {
          home: parseInt(event.intHomeScore) || 0,
          away: parseInt(event.intAwayScore) || 0,
        },
      },
      competition: {
        name: event.strLeague,
      },
      venue: event.strVenue,
    }
  },

  /**
   * 임시 경기 데이터 (API 실패 시 사용)
   */
  getMockMatches() {
    const now = new Date()

    const mockMatches = [
      {
        id: 'mock_roma_vs_napoli',
        utcDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        homeTeam: {
          id: '133602',
          name: 'AS Roma',
          shortName: 'Roma',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
        },
        awayTeam: {
          id: '133636',
          name: 'SSC Napoli',
          shortName: 'Napoli',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/qwtrtp1448813512.png',
        },
        competition: {
          name: 'Italian Serie A',
        },
        venue: 'Stadio Olimpico',
      },
      {
        id: 'mock_milan_vs_roma',
        utcDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        homeTeam: {
          id: '133604',
          name: 'AC Milan',
          shortName: 'Milan',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/wxuqdr1448813215.png',
        },
        awayTeam: {
          id: '133602',
          name: 'AS Roma',
          shortName: 'Roma',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
        },
        competition: {
          name: 'Italian Serie A',
        },
        venue: 'San Siro',
      },
      {
        id: 'mock_roma_vs_juventus',
        utcDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        homeTeam: {
          id: '133602',
          name: 'AS Roma',
          shortName: 'Roma',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
        },
        awayTeam: {
          id: '133601',
          name: 'Juventus',
          shortName: 'Juventus',
          crest: 'https://www.thesportsdb.com/images/media/team/badge/uyqpuv1448813455.png',
        },
        competition: {
          name: 'Italian Serie A',
        },
        venue: 'Stadio Olimpico',
      },
    ]

    return mockMatches
  },
}
