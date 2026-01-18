import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'records');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    const recordId = parseInt(params.id);

    let record: any;
    if (userId) {
      record = db.prepare(`
        SELECT 
          r.*,
          u.username,
          c.title as course_title,
          (SELECT COUNT(*) FROM likes WHERE record_id = r.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE record_id = r.id) as comments_count,
          EXISTS(SELECT 1 FROM likes WHERE record_id = r.id AND user_id = ?) as is_liked
        FROM running_records r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN courses c ON r.course_id = c.id
        WHERE r.id = ?
      `).get(userId, recordId);
    } else {
      record = db.prepare(`
        SELECT 
          r.*,
          u.username,
          c.title as course_title,
          (SELECT COUNT(*) FROM likes WHERE record_id = r.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE record_id = r.id) as comments_count,
          0 as is_liked
        FROM running_records r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN courses c ON r.course_id = c.id
        WHERE r.id = ?
      `).get(recordId);
    }

    if (!record) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Get record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);

    // 기록 소유자 확인
    const existingRecord = db.prepare('SELECT user_id FROM running_records WHERE id = ?').get(recordId) as any;
    if (!existingRecord) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const recordDate = formData.get('record_date') as string;
    const courseId = formData.get('course_id') as string;
    const distance = formData.get('distance') as string;
    const duration = formData.get('duration') as string;
    const weather = formData.get('weather') as string;
    const mood = formData.get('mood') as string;
    const meal = formData.get('meal') as string;
    const calories = formData.get('calories') as string;
    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('remove_image') === 'true';

    if (!title || !recordDate) {
      return NextResponse.json(
        { error: '제목과 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = existingRecord.image_url;
    
    // 이미지 삭제
    if (removeImage && imageUrl) {
      const oldImagePath = path.join(process.cwd(), 'public', imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      imageUrl = null;
    }

    // 새 이미지 업로드
    if (imageFile && imageFile.size > 0) {
      // 기존 이미지 삭제
      if (imageUrl) {
        const oldImagePath = path.join(process.cwd(), 'public', imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${Date.now()}-${imageFile.name}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      imageUrl = `/uploads/records/${filename}`;
    }

    db.prepare(`
      UPDATE running_records 
      SET title = ?, content = ?, record_date = ?, course_id = ?, 
          distance = ?, duration = ?, image_url = ?, weather = ?, mood = ?, meal = ?, calories = ?
      WHERE id = ?
    `).run(
      title,
      content || null,
      recordDate,
      courseId ? parseInt(courseId) : null,
      distance ? parseFloat(distance) : null,
      duration ? parseInt(duration) : null,
      imageUrl,
      weather || null,
      mood || null,
      meal || null,
      calories ? parseFloat(calories) : null,
      recordId
    );

    return NextResponse.json(
      { message: '기록이 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);

    // 기록 소유자 확인
    const existingRecord = db.prepare('SELECT user_id, image_url FROM running_records WHERE id = ?').get(recordId) as any;
    if (!existingRecord) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미지 파일 삭제
    if (existingRecord.image_url) {
      const imagePath = path.join(process.cwd(), 'public', existingRecord.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // 기록 삭제
    db.prepare('DELETE FROM running_records WHERE id = ?').run(recordId);

    return NextResponse.json(
      { message: '기록이 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
