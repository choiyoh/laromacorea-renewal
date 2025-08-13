#!/usr/bin/env node

/**
 * Pre-deployment Check Script
 * 배포 전 필수 검사 항목들을 자동으로 확인하는 스크립트
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

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

class PreDeploymentChecker {
  constructor() {
    this.errors = []
    this.warnings = []
    this.checks = 0
    this.passed = 0
  }

  async runCheck(name, checkFn) {
    this.checks++
    log.info(`Checking: ${name}`)

    try {
      const result = await checkFn()
      if (result === true) {
        this.passed++
        log.success(`${name} - OK`)
      } else if (result === 'warning') {
        this.warnings.push(name)
        log.warning(`${name} - Warning`)
      } else {
        this.errors.push(name)
        log.error(`${name} - Failed`)
      }
    } catch (error) {
      this.errors.push(name)
      log.error(`${name} - Error: ${error.message}`)
    }
  }

  // 환경 파일 검사
  checkEnvironmentFiles() {
    const requiredFiles = ['.env.example', '.env.production']
    const missingFiles = requiredFiles.filter((file) => !existsSync(file))

    if (missingFiles.length > 0) {
      throw new Error(`Missing environment files: ${missingFiles.join(', ')}`)
    }

    // .env.production 파일의 필수 변수 검사
    const prodEnv = readFileSync('.env.production', 'utf8')
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ]

    const missingVars = requiredVars.filter((varName) => !prodEnv.includes(varName))
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
    }

    return true
  }

  // Firebase 설정 검사
  checkFirebaseConfig() {
    if (!existsSync('firebase.json')) {
      throw new Error('firebase.json not found')
    }

    const firebaseConfig = JSON.parse(readFileSync('firebase.json', 'utf8'))

    // 필수 설정 확인
    if (!firebaseConfig.hosting) {
      throw new Error('Firebase hosting configuration missing')
    }

    if (!firebaseConfig.firestore) {
      throw new Error('Firebase firestore configuration missing')
    }

    if (!firebaseConfig.storage) {
      throw new Error('Firebase storage configuration missing')
    }

    // Security rules 파일 존재 확인
    if (!existsSync('firestore.rules')) {
      throw new Error('firestore.rules file missing')
    }

    if (!existsSync('storage.rules')) {
      throw new Error('storage.rules file missing')
    }

    return true
  }

  // 의존성 검사
  checkDependencies() {
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' })
      return true
    } catch {
      // High severity vulnerabilities found
      return 'warning'
    }
  }

  // 린트 검사
  checkLinting() {
    try {
      execSync('npm run lint', { stdio: 'pipe' })
      return true
    } catch {
      throw new Error('Linting failed')
    }
  }

  // 테스트 실행
  checkTests() {
    try {
      execSync('npm run test:run -- src/__tests__/final-integration.spec.js', { stdio: 'pipe' })
      return true
    } catch {
      throw new Error('Tests failed')
    }
  }

  // 빌드 테스트
  checkBuild() {
    try {
      execSync('npm run build:prod', { stdio: 'pipe' })

      // 빌드 결과물 확인
      if (!existsSync('dist/index.html')) {
        throw new Error('Build output missing index.html')
      }

      // 빌드 크기 확인 (대략적인 체크)
      const stats = execSync('du -sh dist', { encoding: 'utf8' })
      const sizeMatch = stats.match(/^(\d+(?:\.\d+)?)(K|M|G)/)

      if (sizeMatch) {
        const [, size, unit] = sizeMatch
        const sizeInMB =
          unit === 'K'
            ? parseFloat(size) / 1024
            : unit === 'M'
              ? parseFloat(size)
              : parseFloat(size) * 1024

        if (sizeInMB > 50) {
          return 'warning' // 빌드 크기가 50MB 초과시 경고
        }
      }

      return true
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  // 패키지.json 스크립트 검사
  checkPackageScripts() {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const requiredScripts = ['build:prod', 'deploy', 'deploy:hosting', 'test:run']

    const missingScripts = requiredScripts.filter((script) => !packageJson.scripts[script])

    if (missingScripts.length > 0) {
      throw new Error(`Missing package.json scripts: ${missingScripts.join(', ')}`)
    }

    return true
  }

  // 보안 헤더 설정 검사
  checkSecurityHeaders() {
    const firebaseConfig = JSON.parse(readFileSync('firebase.json', 'utf8'))
    const headers = firebaseConfig.hosting?.headers || []

    const hasSecurityHeaders = headers.some((header) =>
      header.headers?.some((h) =>
        ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'].includes(h.key),
      ),
    )

    if (!hasSecurityHeaders) {
      return 'warning'
    }

    return true
  }

  // 성능 최적화 설정 검사
  checkPerformanceOptimizations() {
    const viteConfig = readFileSync('vite.config.js', 'utf8')

    // 기본적인 최적화 설정 확인
    const hasMinification = viteConfig.includes('minify')
    const hasCodeSplitting = viteConfig.includes('manualChunks')
    const hasCaching = viteConfig.includes('Cache-Control')

    if (!hasMinification || !hasCodeSplitting) {
      return 'warning'
    }

    return true
  }

  // 메인 실행 함수
  async run() {
    console.log(`${colors.blue}🚀 Pre-deployment Check Started${colors.reset}\n`)

    await this.runCheck('Environment Files', () => this.checkEnvironmentFiles())
    await this.runCheck('Firebase Configuration', () => this.checkFirebaseConfig())
    await this.runCheck('Package Scripts', () => this.checkPackageScripts())
    await this.runCheck('Dependencies Security', () => this.checkDependencies())
    // await this.runCheck('Code Linting', () => this.checkLinting())
    await this.runCheck('Unit Tests', () => this.checkTests())
    await this.runCheck('Production Build', () => this.checkBuild())
    await this.runCheck('Security Headers', () => this.checkSecurityHeaders())
    await this.runCheck('Performance Optimizations', () => this.checkPerformanceOptimizations())

    // 결과 출력
    console.log(`\n${colors.blue}📊 Check Results${colors.reset}`)
    console.log(`Total Checks: ${this.checks}`)
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`)
    console.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`)
    console.log(`${colors.red}Errors: ${this.errors.length}${colors.reset}`)

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠ Warnings:${colors.reset}`)
      this.warnings.forEach((warning) => console.log(`  - ${warning}`))
    }

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}✗ Errors:${colors.reset}`)
      this.errors.forEach((error) => console.log(`  - ${error}`))
      console.log(
        `\n${colors.red}❌ Deployment check failed. Please fix the errors above.${colors.reset}`,
      )
      process.exit(1)
    }

    if (this.warnings.length > 0) {
      console.log(
        `\n${colors.yellow}⚠ Deployment check completed with warnings. Review before deploying.${colors.reset}`,
      )
    } else {
      console.log(`\n${colors.green}✅ All checks passed! Ready for deployment.${colors.reset}`)
    }
  }
}

// 스크립트 실행
const checker = new PreDeploymentChecker()
checker.run().catch((error) => {
  console.error(`${colors.red}❌ Pre-deployment check failed:${colors.reset}`, error.message)
  process.exit(1)
})
