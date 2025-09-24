#!/usr/bin/env node

/**
 * PWA 아이콘 생성 스크립트
 * lupi.svg를 기반으로 다양한 크기의 PNG 아이콘들을 생성합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePWAIcons() {
  console.log('PWA 아이콘 생성을 시작합니다...');

  // 필요한 아이콘 크기들
  const iconSizes = [
    { size: 72, name: 'pwa-72x72.png' },
    { size: 96, name: 'pwa-96x96.png' },
    { size: 128, name: 'pwa-128x128.png' },
    { size: 144, name: 'pwa-144x144.png' },
    { size: 152, name: 'pwa-152x152.png' },
    { size: 192, name: 'pwa-192x192.png' },
    { size: 384, name: 'pwa-384x384.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ];

  const svgPath = path.join(__dirname, '../public/images/lupi.svg');
  const publicPath = path.join(__dirname, '../public');

  try {
    // SVG 파일 읽기
    const svgBuffer = fs.readFileSync(svgPath);
    console.log('SVG 파일을 읽었습니다.');

    // 각 크기별로 PNG 생성
    for (const icon of iconSizes) {
      const outputPath = path.join(publicPath, icon.name);

      await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // 흰색 배경
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ 생성됨: ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\n🎉 모든 PWA 아이콘이 성공적으로 생성되었습니다!');
    console.log(`📁 생성된 파일들은 public/ 폴더에 있습니다.`);
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

generatePWAIcons();
