import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정은 런타임에 매번 확인하도록 변경
// Next.js 서버리스 환경에서는 모듈 레벨 설정이 제대로 작동하지 않을 수 있음

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
    // 런타임에 환경 변수 확인 및 설정
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    console.log('🔍 Cloudinary 환경 변수 확인:');
    console.log('   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', cloudName ? `설정됨 (${cloudName})` : '❌ 없음');
    console.log('   - CLOUDINARY_API_KEY:', apiKey ? `설정됨 (${apiKey.substring(0, 4)}...)` : '❌ 없음');
    console.log('   - CLOUDINARY_API_SECRET:', apiSecret ? `설정됨 (${apiSecret.substring(0, 4)}...)` : '❌ 없음');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary 환경 변수가 설정되지 않았습니다.');
      return null;
    }

    // 매번 config를 다시 설정 (서버리스 환경 대응)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // HTTPS 사용
    });

    // File 객체를 Buffer로 변환
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    console.log('📤 Cloudinary 업로드 시작...');
    console.log('📤 폴더:', `runlog/${folder}`);
    console.log('📤 파일 크기:', buffer.length, 'bytes');
    console.log('📤 Cloud name:', cloudName);

    // Cloudinary에 업로드 (Buffer를 직접 전달하는 방식)
    return new Promise((resolve) => {
      try {
        // upload_stream 방식 사용 (더 안정적)
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `runlog/${folder}`,
            resource_type: 'image',
            transformation: [
              { width: 1920, height: 1920, crop: 'limit' },
              { quality: 'auto' },
              { format: 'auto' }
            ],
            // 추가 옵션
            use_filename: false,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary 업로드 실패:', error);
              console.error('❌ 오류 메시지:', error.message);
              console.error('❌ HTTP 코드:', error.http_code);
              
              // 오류 상세 정보
              if (error.http_code === 401 || error.http_code === 403) {
                console.error('❌ Cloudinary 인증 오류: API 키 또는 시크릿이 잘못되었습니다.');
                console.error('❌ Vercel 환경 변수를 재확인해주세요.');
              } else if (error.http_code === 500) {
                console.error('❌ Cloudinary 서버 오류 (500):');
                console.error('   - 가능한 원인:');
                console.error('     1. API 키 또는 시크릿이 잘못됨');
                console.error('     2. Cloudinary 계정 문제');
                console.error('     3. 파일 크기 제한 초과');
                console.error('     4. 네트워크 문제');
                console.error('   - Cloudinary 대시보드에서 직접 업로드를 시도해보세요.');
              }
              
              resolve(null);
              return;
            }
            if (result) {
              console.log('✅ Cloudinary 업로드 성공:', result.secure_url);
              resolve(result.secure_url);
            } else {
              console.error('❌ 업로드 결과가 없습니다.');
              resolve(null);
            }
          }
        );

        // 스트림 에러 핸들링
        uploadStream.on('error', (error) => {
          console.error('❌ Cloudinary 업로드 스트림 오류:', error);
          console.error('❌ 스트림 오류 메시지:', error.message);
          resolve(null);
        });

        // Buffer를 스트림에 쓰기
        uploadStream.end(buffer);
      } catch (error: any) {
        console.error('❌ Cloudinary 업로드 중 예외 발생:', error);
        console.error('❌ 오류 타입:', error?.constructor?.name || typeof error);
        console.error('❌ 오류 메시지:', error?.message);
        console.error('❌ 스택 트레이스:', error?.stack);
        resolve(null);
      }
    });
  } catch (error: any) {
    console.error('❌ 이미지 업로드 오류:', error);
    console.error('❌ 오류 타입:', error?.constructor?.name || typeof error);
    console.error('❌ 오류 메시지:', error?.message);
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
