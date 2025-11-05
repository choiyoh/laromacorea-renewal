#!/usr/bin/env node

/**
 * 빌드 시 앱 버전을 자동으로 업데이트하는 스크립트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트 경로
const projectRoot = path.resolve(__dirname, '..');

// package.json에서 버전 읽기
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// 현재 타임스탬프를 포함한 빌드 버전 생성
const buildVersion = `${version}.${Date.now()}`;

console.log(`Updating app version to: ${buildVersion}`);

// .env 파일들 업데이트
const envFiles = ['.env', '.env.production'];

envFiles.forEach((envFile) => {
  const envPath = path.join(projectRoot, envFile);

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // VITE_APP_VERSION 라인 찾기 및 업데이트
    const versionRegex = /^VITE_APP_VERSION=.*$/m;
    const newVersionLine = `VITE_APP_VERSION=${buildVersion}`;

    if (versionRegex.test(envContent)) {
      // 기존 라인 교체
      envContent = envContent.replace(versionRegex, newVersionLine);
    } else {
      // 새 라인 추가
      envContent += `\n${newVersionLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`Updated ${envFile} with version ${buildVersion}`);
  }
});

console.log('Version update completed!');
