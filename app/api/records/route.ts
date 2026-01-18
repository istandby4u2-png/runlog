import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'records');

// 업로드 디렉토리 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    
    let records: any[];
    if (userId) {
      records = db.prepare(`
        SELECT 
          r.*,
          u.username,
          c.title as course_title,
          (SELECT COUNT(*) FROM likes WHERE record_id = r.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE record_id = r.id) as comments_count,
          EXISTS(SELECT 1 FROM likes WHERE record_id = r.id AND user_id = ?) as is_liked,
          r.user_id = ? as is_owner
        FROM running_records r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN courses c ON r.course_id = c.id
        ORDER BY r.created_at DESC
      `).all(userId, userId) as any[];
    } else {
      records = db.prepare(`
        SELECT 
          r.*,
          u.username,
          c.title as course_title,
          (SELECT COUNT(*) FROM likes WHERE record_id = r.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE record_id = r.id) as comments_count,
          0 as is_liked,
          0 as is_owner
        FROM running_records r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN courses c ON r.course_id = c.id
        ORDER BY r.created_at DESC
      `).all() as any[];
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
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

    if (!title || !recordDate) {
      return NextResponse.json(
        { error: '제목과 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${Date.now()}-${imageFile.name}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      imageUrl = `/uploads/records/${filename}`;
    }

    const result = db.prepare(`
      INSERT INTO running_records (user_id, course_id, title, content, image_url, distance, duration, record_date, weather, mood, meal, calories)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      courseId ? parseInt(courseId) : null,
      title,
      content || null,
      imageUrl,
      distance ? parseFloat(distance) : null,
      duration ? parseInt(duration) : null,
      recordDate,
      weather || null,
      mood || null,
      meal || null,
      calories ? parseFloat(calories) : null
    );

    return NextResponse.json(
      { message: '기록이 등록되었습니다.', recordId: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
