#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Firebase CLI 설정 및 로그인을 도와주는 스크립트
 */

import { execSync } from 'child_process'

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

async function checkFirebaseCLI() {
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim()
    log.success(`Firebase CLI 설치됨: ${version}`)
    return true
  } catch {
    log.warning('Firebase CLI가 전역으로 설치되어 있지 않습니다.')
    return false
  }
}

async function checkLocalFirebase() {
  try {
    const version = execSync('npx firebase-tools --version', { encoding: 'utf8' }).trim()
    log.success(`로컬 Firebase Tools 사용 가능: ${version}`)
    return true
  } catch {
    log.error('Firebase Tools를 찾을 수 없습니다.')
    return false
  }
}

async function loginFirebase(useNpx = false) {
  try {
    const command = useNpx ? 'npx firebase-tools login' : 'firebase login'
    log.info('Firebase 로그인을 시작합니다...')
    execSync(command, { stdio: 'inherit' })
    log.success('Firebase 로그인 완료!')
    return true
  } catch {
    log.error('Firebase 로그인에 실패했습니다.')
    return false
  }
}

async function checkProject(useNpx = false) {
  try {
    const command = useNpx ? 'npx firebase-tools projects:list' : 'firebase projects:list'
    execSync(command, { stdio: 'pipe' })
    log.success('Firebase 프로젝트 접근 가능')
    return true
  } catch {
    log.warning('Firebase 프로젝트에 접근할 수 없습니다. 로그인이 필요할 수 있습니다.')
    return false
  }
}

async function setupProject(useNpx = false) {
  try {
    // .firebaserc 파일 확인
    const fs = await import('fs')
    if (!fs.existsSync('.firebaserc')) {
      log.info('Firebase 프로젝트를 설정합니다...')
      const command = useNpx
        ? 'npx firebase-tools use laromacorea-renewal'
        : 'firebase use laromacorea-renewal'
      execSync(command, { stdio: 'inherit' })
      log.success('Firebase 프로젝트 설정 완료')
    } else {
      log.success('Firebase 프로젝트가 이미 설정되어 있습니다')
    }
    return true
  } catch {
    log.error('Firebase 프로젝트 설정에 실패했습니다')
    return false
  }
}

async function main() {
  console.log(`${colors.blue}🔥 Firebase 설정 도우미${colors.reset}\n`)

  // Firebase CLI 확인
  const hasGlobalCLI = await checkFirebaseCLI()
  const hasLocalTools = await checkLocalFirebase()

  if (!hasGlobalCLI && !hasLocalTools) {
    log.error('Firebase Tools를 찾을 수 없습니다.')
    log.info('다음 명령어로 설치하세요: npm install -g firebase-tools')
    process.exit(1)
  }

  const useNpx = !hasGlobalCLI

  if (useNpx) {
    log.info('로컬 Firebase Tools를 사용합니다 (npx)')
  }

  // 프로젝트 접근 확인
  const hasProjectAccess = await checkProject(useNpx)

  if (!hasProjectAccess) {
    log.info('Firebase 로그인이 필요합니다.')
    const loginSuccess = await loginFirebase(useNpx)

    if (!loginSuccess) {
      process.exit(1)
    }

    // 로그인 후 다시 확인
    await checkProject(useNpx)
  }

  // 프로젝트 설정
  await setupProject(useNpx)

  log.success('Firebase 설정이 완료되었습니다!')
  log.info('\n배포 명령어:')

  if (useNpx) {
    console.log(`  ${colors.green}npm run build:prod${colors.reset}`)
    console.log(`  ${colors.green}npx firebase-tools deploy${colors.reset}`)
  } else {
    console.log(`  ${colors.green}npm run deploy${colors.reset}`)
  }
}

main().catch((error) => {
  log.error(`설정 중 오류 발생: ${error.message}`)
  process.exit(1)
})
