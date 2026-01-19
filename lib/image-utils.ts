/**
 * 이미지 압축 및 리사이즈 유틸리티
 */

/**
 * 이미지 파일을 압축하고 리사이즈합니다
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 너비 (기본: 1920px)
 * @param maxHeight 최대 높이 (기본: 1920px)
 * @param quality 압축 품질 0-1 (기본: 0.8)
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // 이미지가 아니면 원본 반환
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // 파일 크기가 작으면 압축하지 않음 (500KB 미만)
    if (file.size < 500 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not supported'));
          return;
        }

        // 비율 유지하면서 리사이즈
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // File 객체 생성
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            console.log('✅ 이미지 압축 완료:');
            console.log(`   - 원본 크기: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - 압축 크기: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - 압축률: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 파일 크기를 MB 단위로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * 파일 크기 유효성 검사
 * @param file 파일
 * @param maxSizeMB 최대 크기 (MB)
 */
export function validateFileSize(file: File, maxSizeMB: number = 4): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일 타입 유효성 검사
 */
export function validateImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}
