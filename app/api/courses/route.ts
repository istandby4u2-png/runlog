import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');

// 업로드 디렉토리 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    
    let courses: any[];
    if (userId) {
      courses = db.prepare(`
        SELECT 
          c.*,
          u.username,
          (SELECT COUNT(*) FROM likes WHERE course_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE course_id = c.id) as comments_count,
          EXISTS(SELECT 1 FROM likes WHERE course_id = c.id AND user_id = ?) as is_liked
        FROM courses c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `).all(userId) as any[];
    } else {
      courses = db.prepare(`
        SELECT 
          c.*,
          u.username,
          (SELECT COUNT(*) FROM likes WHERE course_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE course_id = c.id) as comments_count,
          0 as is_liked
        FROM courses c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `).all() as any[];
    }

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
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
    const description = formData.get('description') as string;
    const pathData = formData.get('path_data') as string;
    const distance = formData.get('distance') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !pathData) {
      return NextResponse.json(
        { error: '제목과 경로 데이터는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${Date.now()}-${imageFile.name}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      imageUrl = `/uploads/courses/${filename}`;
    }

    const result = db.prepare(`
      INSERT INTO courses (user_id, title, description, path_data, image_url, distance)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      title,
      description || null,
      pathData,
      imageUrl,
      distance ? parseFloat(distance) : null
    );

    return NextResponse.json(
      { message: '코스가 등록되었습니다.', courseId: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
