/**
 * Storage Service
 * Firebase Storage를 사용한 파일 업로드 관리
 */

import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * 파일 업로드 서비스
 */
export const storageService = {
  /**
   * 이미지 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {string} path - 저장 경로
   * @param {Function} onProgress - 진행률 콜백
   * @returns {Promise<string>} 다운로드 URL
   */
  async uploadImage(file, path, onProgress = null) {
    // path가 이미 images/로 시작하는지 확인
    const finalPath = path.startsWith('images/') ? path : `images/${path}`;
    return this.uploadFile(file, finalPath, onProgress);
  },

  /**
   * 동영상 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {string} path - 저장 경로
   * @param {Function} onProgress - 진행률 콜백
   * @returns {Promise<string>} 다운로드 URL
   */
  async uploadVideo(file, path, onProgress = null) {
    return this.uploadFile(file, `videos/${path}`, onProgress);
  },

  /**
   * 일반 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {string} path - 저장 경로
   * @param {Function} onProgress - 진행률 콜백
   * @returns {Promise<string>} 다운로드 URL
   */
  async uploadFile(file, path, onProgress = null) {
    console.log('Uploading file:', {
      fileName: file.name,
      path,
      fileSize: file.size,
      fileType: file.type,
    });

    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
          console.log(
            'Upload progress:',
            Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            ) + '%',
          );
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Upload successful:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        },
      );
    });
  },

  /**
   * 파일 삭제
   * @param {string} url - 삭제할 파일의 다운로드 URL 또는 경로
   */
  async deleteFile(url) {
    try {
      // URL에서 경로 추출 또는 직접 경로 사용
      let path = url;
      if (url.includes('firebase')) {
        // Firebase Storage URL에서 경로 추출
        const urlParts = url.split('/o/');
        if (urlParts.length > 1) {
          path = decodeURIComponent(urlParts[1].split('?')[0]);
        }
      }

      const fileRef = storageRef(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      throw error;
    }
  },

  /**
   * 파일 유효성 검사
   * @param {File} file - 검사할 파일
   * @param {Object} options - 검사 옵션
   * @returns {Object} 검사 결과
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
      ],
    } = options;

    const errors = [];

    // 파일 크기 검사
    if (file.size > maxSize) {
      errors.push(
        `파일 크기가 ${Math.round(maxSize / 1024 / 1024)}MB를 초과합니다.`,
      );
    }

    // 파일 타입 검사
    if (!allowedTypes.includes(file.type)) {
      errors.push('지원하지 않는 파일 형식입니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * 파일 타입 확인
   * @param {File} file - 확인할 파일
   * @returns {string} 파일 타입 ('image' | 'video' | 'other')
   */
  getFileType(file) {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('video/')) {
      return 'video';
    }
    return 'other';
  },

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   * @param {number} bytes - 바이트 크기
   * @returns {string} 읽기 쉬운 크기 문자열
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 이미지 리사이징 (클라이언트 사이드)
   * @param {File} file - 리사이징할 이미지 파일
   * @param {Object} options - 리사이징 옵션
   * @returns {Promise<File>} 리사이징된 파일
   */
  async resizeImage(file, options = {}) {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 원본 크기
        let { width, height } = img;

        // 비율 유지하면서 최대 크기에 맞춤
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          quality,
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * 이미지 썸네일 생성
   * @param {File} file - 썸네일을 생성할 이미지 파일
   * @param {number} size - 썸네일 크기 (정사각형)
   * @returns {Promise<string>} 썸네일 데이터 URL
   */
  async generateThumbnail(file, size = 150) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // 정사각형으로 크롭
        const minDimension = Math.min(img.width, img.height);
        const x = (img.width - minDimension) / 2;
        const y = (img.height - minDimension) / 2;

        ctx.drawImage(img, x, y, minDimension, minDimension, 0, 0, size, size);
        resolve(canvas.toDataURL());
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * 비디오 썸네일 생성
   * @param {File} file - 썸네일을 생성할 비디오 파일
   * @param {number} time - 썸네일을 생성할 시간 (초)
   * @returns {Promise<string>} 썸네일 데이터 URL
   */
  async generateVideoThumbnail(file, time = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(time, video.duration);
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL());
        URL.revokeObjectURL(video.src);
      };

      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  },
};
