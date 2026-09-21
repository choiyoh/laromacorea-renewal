/* eslint-env node */
/**
 * Serie A cache helpers for Big Balls Sports Data.
 * Recent Roma results come from the team matches endpoint, not a league-wide list.
 */

const BBS_BASE_URL = 'https://api.bigballsdata.com';
const ROMA_TEAM_ID = '22033fe3-0a71-435a-9762-749984ea439c';
const LEAGUE_CODE = 'seriea';
const RECENT_LIMIT = 5;

const SHORT_NAMES = {
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
  'Parma Calcio': 'Parma',
  Parma: 'Parma',
  'Como 1907': 'Como',
  Como: 'Como',
  'Venezia FC': 'Venezia',
  Venezia: 'Venezia',
  Frosinone: 'Frosinone',
  Monza: 'Monza',
};

function getShortTeamName(fullName) {
  if (!fullName) return 'Unknown';
  return SHORT_NAMES[fullName] || fullName;
}

function isRomaName(name) {
  const normalized = String(name || '')
    .trim()
    .toLowerCase();
  return normalized === 'roma' || normalized === 'as roma';
}

function isRomaTeam(team) {
  if (!team) return false;
  if (team.id === ROMA_TEAM_ID || team.team_id === ROMA_TEAM_ID) {
    return true;
  }
  return isRomaName(team.name || team.team_name);
}

function currentSeasonStart(now = new Date()) {
  const year =
    now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 7, 1));
}

function currentSeasonLabel(now = new Date()) {
  const startYear =
    now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const endYear = String(startYear + 1).slice(-2);
  return `${startYear}-${endYear}`;
}

function hasScore(match) {
  const home = match.score?.home ?? match.home_score;
  const away = match.score?.away ?? match.away_score;
  return home != null && away != null && home !== '' && away !== '';
}

function isFinishedMatch(match) {
  const value = String(match.status || '').toLowerCase();
  if (['finished', 'final', 'ft', 'completed', 'full_time', 'fulltime'].includes(
      value,
  )) {
    return true;
  }
  if (!value && hasScore(match)) {
    return true;
  }
  return false;
}

function getKickoff(match) {
  return match.kickoff_utc || match.utcDate || match.date || match.kickoff;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractMatches(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.matches)) return data.matches;
  if (Array.isArray(data?.historical)) return data.historical;
  if (Array.isArray(data?.historical?.value)) return data.historical.value;
  if (Array.isArray(data?.matches?.value)) return data.matches.value;
  if (Array.isArray(payload?.matches)) return payload.matches;
  return [];
}

function extractStandingRows(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data?.standings)) {
    const first = data.standings[0];
    if (Array.isArray(first?.rows)) {
      return {
        rows: first.rows,
        season: first.season || data.season,
        leagueName: first.league_name,
      };
    }
    if (first && (first.team_name || first.team_id || first.rank)) {
      return {rows: data.standings, season: data.season};
    }
  }
  if (Array.isArray(data?.rows)) {
    return {rows: data.rows, season: data.season, leagueName: data.league_name};
  }
  if (Array.isArray(data)) {
    return {rows: data};
  }
  return {rows: []};
}

function formatTeam(side) {
  const name = side?.name || side?.team_name || 'Unknown';
  return {
    id: side?.id || side?.team_id || '',
    name,
    shortName: side?.short_name || getShortTeamName(name),
    crest: side?.logo_url || side?.crest || '',
  };
}

function romaResult(match) {
  const homeScore = toNumber(match.score?.home ?? match.home_score);
  const awayScore = toNumber(match.score?.away ?? match.away_score);
  if (homeScore === awayScore) return 'D';
  const homeIsRoma = isRomaTeam(match.home);
  const romaWon = homeIsRoma ? homeScore > awayScore : awayScore > homeScore;
  return romaWon ? 'W' : 'L';
}

function formatResult(match) {
  const homeTeam = formatTeam(match.home);
  const awayTeam = formatTeam(match.away);
  const kickoff = getKickoff(match);
  const utcDate =
    typeof kickoff === 'string' ? kickoff : new Date(kickoff).toISOString();

  return {
    id: match.id,
    utcDate,
    status: 'FINISHED',
    homeTeam,
    awayTeam,
    score: {
      fullTime: {
        home: toNumber(match.score?.home ?? match.home_score),
        away: toNumber(match.score?.away ?? match.away_score),
      },
    },
    competition: {
      name: match.league || match.competition || 'Serie A',
    },
    result: romaResult(match),
  };
}

function pickRecentResults(matches, now = new Date()) {
  const seasonStart = currentSeasonStart(now).getTime();
  const nowTime = now.getTime();

  return matches
      .filter((match) => isFinishedMatch(match))
      .filter((match) => {
        const kickoff = new Date(getKickoff(match)).getTime();
        return !Number.isNaN(kickoff) && kickoff >= seasonStart && kickoff <= nowTime;
      })
      .sort((a, b) => new Date(getKickoff(b)) - new Date(getKickoff(a)))
      .slice(0, RECENT_LIMIT)
      .map(formatResult);
}

function normalizeStandingRow(row) {
  const played = toNumber(row.games_played ?? row.played ?? row.p);
  const won = toNumber(row.wins ?? row.won ?? row.w);
  const lost = toNumber(row.losses ?? row.lost ?? row.l);
  const drawn = toNumber(
      row.draws ?? row.drawn ?? row.d,
      Math.max(played - won - lost, 0),
  );
  const gf = toNumber(row.goals_for ?? row.gf ?? row.goals_scored);
  const ga = toNumber(row.goals_against ?? row.ga ?? row.goals_conceded);
  const gd = toNumber(row.goal_difference ?? row.gd ?? row.goal_diff, gf - ga);
  const pts = toNumber(row.points ?? row.pts, won * 3 + drawn);
  const teamName = row.team_name || row.name || '';
  const teamId = row.team_id || row.id || '';

  return {
    rank: row.rank ?? row.position ?? null,
    teamId,
    teamName,
    shortName: row.short_name || row.abbreviation || getShortTeamName(teamName),
    crest: row.logo_url || row.team_logo || row.crest || '',
    played,
    won,
    drawn,
    lost,
    gf,
    ga,
    gd,
    pts,
    isRoma: teamId === ROMA_TEAM_ID || isRomaName(teamName),
  };
}

async function bbsFetch(path, apiKey) {
  const response = await fetch(`${BBS_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Big Balls ${path} failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function buildSerieACache(apiKey, now = new Date()) {
  const season = currentSeasonStart(now).getUTCFullYear();
  const [standingsPayload, matchesPayload] = await Promise.all([
    bbsFetch(`/v1/standings?league=${LEAGUE_CODE}&season=${season}`, apiKey),
    bbsFetch(
        `/v1/teams/${ROMA_TEAM_ID}/matches?sport=football&season=${season}`,
        apiKey,
    ),
  ]);

  const standingSource = extractStandingRows(standingsPayload);
  const standings = standingSource.rows
      .map(normalizeStandingRow)
      .sort((a, b) => {
        if (a.rank == null && b.rank == null) return b.pts - a.pts;
        if (a.rank == null) return 1;
        if (b.rank == null) return -1;
        return a.rank - b.rank;
      });

  return {
    season: standingSource.season || currentSeasonLabel(now),
    updatedAt: now.toISOString(),
    source: 'bigballsdata',
    romaTeamId: ROMA_TEAM_ID,
    recentResults: pickRecentResults(extractMatches(matchesPayload), now),
    standings,
  };
}

module.exports = {
  ROMA_TEAM_ID,
  buildSerieACache,
  pickRecentResults,
  extractMatches,
  extractStandingRows,
  normalizeStandingRow,
  isRomaName,
  currentSeasonStart,
};
