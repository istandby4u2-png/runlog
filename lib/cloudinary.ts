import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️ Cloudinary 환경 변수가 설정되지 않았습니다.');
  console.warn('⚠️ .env 파일에 Cloudinary 설정을 추가해주세요.');
}

/**
 * 이미지를 Cloudinary에 업로드
 * @param file 이미지 파일 (Buffer 또는 File)
 * @param folder Cloudinary 폴더 경로 (예: 'records', 'courses')
 * @returns 업로드된 이미지 URL
 */
export async function uploadImage(
  file: Buffer | File,
  folder: 'records' | 'courses' = 'records'
): Promise<string | null> {
  try {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      console.error('❌ Cloudinary가 설정되지 않았습니다.');
      return null;
    }

    // File 객체를 Buffer로 변환
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Cloudinary에 업로드
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `runlog/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1920, height: 1920, crop: 'limit' }, // 최대 크기 제한
            { quality: 'auto' }, // 자동 품질 최적화
            { format: 'auto' } // 자동 포맷 최적화
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary 업로드 실패:', error);
            reject(error);
            return;
          }
          if (result) {
            console.log('✅ Cloudinary 업로드 성공:', result.secure_url);
            resolve(result.secure_url);
          } else {
            reject(new Error('업로드 결과가 없습니다.'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('❌ 이미지 업로드 오류:', error);
    return null;
  }
}

/**
 * Cloudinary에서 이미지 삭제
 * @param imageUrl 삭제할 이미지 URL
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      console.error('❌ Cloudinary가 설정되지 않았습니다.');
      return false;
    }

    // URL에서 public_id 추출
    // 예: https://res.cloudinary.com/cloudname/image/upload/v1234567890/runlog/records/image.jpg
    // → runlog/records/image
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      console.error('❌ 잘못된 Cloudinary URL:', imageUrl);
      return false;
    }

    // public_id 추출 (upload 이후의 경로, 확장자 제거)
    const pathParts = urlParts.slice(uploadIndex + 2); // 'upload'와 'v1234567890' 제외
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // 확장자 제거

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Cloudinary 이미지 삭제 성공:', publicId);
      return true;
    } else {
      console.error('❌ Cloudinary 이미지 삭제 실패:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    return false;
  }
}
