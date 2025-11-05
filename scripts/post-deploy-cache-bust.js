#!/usr/bin/env node

/**
 * 배포 후 캐시 무효화를 위한 스크립트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트 경로
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Post-deployment cache busting...');

// 1. 새로운 버전 번호 생성 (타임스탬프 기반)
const newVersion = `${Date.now()}`;

// 2. .env 파일들에 새 버전 적용
const envFiles = ['.env', '.env.production'];

envFiles.forEach((envFile) => {
  const envPath = path.join(projectRoot, envFile);

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // VITE_APP_VERSION 라인 찾기 및 업데이트
    const versionRegex = /^VITE_APP_VERSION=.*$/m;
    const newVersionLine = `VITE_APP_VERSION=${newVersion}`;

    if (versionRegex.test(envContent)) {
      envContent = envContent.replace(versionRegex, newVersionLine);
    } else {
      envContent += `\n${newVersionLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated ${envFile} with version ${newVersion}`);
  }
});

// 3. 캐시 무효화를 위한 메타 파일 생성
const cacheMetaPath = path.join(projectRoot, 'public', 'cache-meta.json');
const cacheMetaContent = {
  version: newVersion,
  timestamp: Date.now(),
  deployedAt: new Date().toISOString(),
};

// public 디렉토리가 없으면 생성
const publicDir = path.join(projectRoot, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(cacheMetaPath, JSON.stringify(cacheMetaContent, null, 2));
console.log(`✅ Created cache meta file: ${cacheMetaPath}`);

console.log('🎉 Cache busting completed!');
console.log(`📦 New version: ${newVersion}`);
