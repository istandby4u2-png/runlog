import { supabaseAdmin } from './supabase';

/**
 * Supabase 데이터베이스 헬퍼 함수들
 * 기존 SQLite 코드와 호환되도록 작성
 */

if (!supabaseAdmin) {
  console.error('❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.');
}

// Users 테이블
export const users = {
  async findById(id: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('User findById error:', error);
      return null;
    }
    return data;
  },

  async findByEmail(email: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('User findByEmail error:', error);
      return null;
    }
    return data;
  },

  async findByUsernameOrEmail(username: string, email: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('User findByUsernameOrEmail error:', error);
      return null;
    }
    return data;
  },

  async create(username: string, email: string, password: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ username, email, password })
      .select()
      .single();
    
    if (error) {
      console.error('User create error:', error);
      throw error;
    }
    return data;
  },

  async update(id: number, updates: {
    username?: string;
    profile_image_url?: string | null;
  }) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('User update error:', error);
      throw error;
    }
    return data;
  }
};

// Courses 테이블
export const courses = {
  async findAll(userId?: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    let query = supabaseAdmin
      .from('courses')
      .select(`
        *,
        users:user_id (username, profile_image_url)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      // 좋아요 및 댓글 수를 포함한 쿼리
      // Supabase는 서브쿼리를 직접 지원하지 않으므로 별도로 조회
      const { data, error } = await query;
      if (error) {
        console.error('Courses findAll error:', error);
        return [];
      }

      // 각 코스에 대해 좋아요 수, 댓글 수, 좋아요 여부 조회
      const coursesWithStats = await Promise.all(
        (data || []).map(async (course) => {
          const [likesCount, commentsCount, isLiked] = await Promise.all([
            this.getLikesCount(course.id),
            this.getCommentsCount(course.id),
            this.isLiked(course.id, userId)
          ]);

          return {
            ...course,
            username: (course.users as any)?.username,
            user_profile_image_url: (course.users as any)?.profile_image_url || null,
            likes_count: likesCount,
            comments_count: commentsCount,
            is_liked: isLiked
          };
        })
      );

      return coursesWithStats;
    } else {
      const { data, error } = await query;
      if (error) {
        console.error('Courses findAll error:', error);
        return [];
      }

      const coursesWithStats = await Promise.all(
        (data || []).map(async (course) => {
          const [likesCount, commentsCount] = await Promise.all([
            this.getLikesCount(course.id),
            this.getCommentsCount(course.id)
          ]);

          return {
            ...course,
            username: (course.users as any)?.username,
            likes_count: likesCount,
            comments_count: commentsCount,
            is_liked: false
          };
        })
      );

      return coursesWithStats;
    }
  },

  async findById(id: number, userId?: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        users:user_id (username, profile_image_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Course findById error:', error);
      return null;
    }

    const [likesCount, commentsCount, isLiked] = await Promise.all([
      this.getLikesCount(id),
      this.getCommentsCount(id),
      userId ? this.isLiked(id, userId) : false
    ]);

    return {
      ...data,
      username: (data.users as any)?.username,
      user_profile_image_url: (data.users as any)?.profile_image_url || null,
      likes_count: likesCount,
      comments_count: commentsCount,
      is_liked: isLiked,
      is_owner: userId ? data.user_id === userId : false
    };
  },

  async create(userId: number, title: string, description: string | null, pathData: string, imageUrl: string | null, distance: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        user_id: userId,
        title,
        description,
        path_data: pathData,
        image_url: imageUrl,
        distance
      })
      .select()
      .single();

    if (error) {
      console.error('Course create error:', error);
      throw error;
    }
    return data;
  },

  async update(id: number, course: {
    title?: string;
    description?: string | null;
    path_data?: string;
    image_url?: string | null;
    distance?: number | null;
    course_type?: string | null;
    surface_type?: string | null;
    elevation?: string | null;
    traffic_lights?: string | null;
    streetlights?: string | null;
  }) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(course)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Course update error:', error);
      throw error;
    }
    return data;
  },

  async delete(id: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Course delete error:', error);
      throw error;
    }
    return true;
  },

  async search(query: string, userId?: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    
    let searchQuery = supabaseAdmin
      .from('courses')
      .select(`
        *,
        users:user_id (username, profile_image_url)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    const { data, error } = await searchQuery;
    
    if (error) {
      console.error('Courses search error:', error);
      return [];
    }

    if (userId) {
      // 각 코스에 대해 좋아요 수, 댓글 수, 좋아요 여부 조회
      const coursesWithStats = await Promise.all(
        (data || []).map(async (course) => {
          const [likesCount, commentsCount, isLiked, isOwner] = await Promise.all([
            this.getLikesCount(course.id),
            this.getCommentsCount(course.id),
            this.isLiked(course.id, userId),
            this.isOwner(course.id, userId)
          ]);

          return {
            ...course,
            username: (course.users as any)?.username,
            user_profile_image_url: (course.users as any)?.profile_image_url || null,
            likes_count: likesCount,
            comments_count: commentsCount,
            is_liked: isLiked,
            is_owner: isOwner
          };
        })
      );

      return coursesWithStats;
    } else {
      return (data || []).map((course) => ({
        ...course,
        username: (course.users as any)?.username,
        user_profile_image_url: (course.users as any)?.profile_image_url || null,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        is_owner: false
      }));
    }
  },

  async getLikesCount(courseId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { count, error } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    return error ? 0 : (count || 0);
  },

  async getCommentsCount(courseId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { count, error } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    return error ? 0 : (count || 0);
  },

  async isLiked(courseId: number, userId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    return !error && data !== null;
  },

  async isOwner(courseId: number, userId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('user_id')
      .eq('id', courseId)
      .single();
    
    return !error && data && data.user_id === userId;
  }
};

// Running Records 테이블
export const runningRecords = {
  async findAll(userId?: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    let query = supabaseAdmin
      .from('running_records')
      .select(`
        *,
        users:user_id (username, profile_image_url),
        courses:course_id (title)
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('RunningRecords findAll error:', error);
      return [];
    }

    const recordsWithStats = await Promise.all(
      (data || []).map(async (record) => {
        const [likesCount, commentsCount, isLiked] = await Promise.all([
          this.getLikesCount(record.id),
          this.getCommentsCount(record.id),
          userId ? this.isLiked(record.id, userId) : false
        ]);

          return {
            ...record,
            username: (record.users as any)?.username,
            user_profile_image_url: (record.users as any)?.profile_image_url || null,
            course_title: (record.courses as any)?.title,
            likes_count: likesCount,
            comments_count: commentsCount,
            is_liked: isLiked,
            is_owner: userId ? record.user_id === userId : false
          };
      })
    );

    return recordsWithStats;
  },

  async findById(id: number, userId?: number | null) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('running_records')
      .select(`
        *,
        users:user_id (username),
        courses:course_id (title)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('RunningRecord findById error:', error);
      return null;
    }

    const [likesCount, commentsCount, isLiked] = await Promise.all([
      this.getLikesCount(id),
      this.getCommentsCount(id),
      userId ? this.isLiked(id, userId) : false
    ]);

    return {
      ...data,
      username: (data.users as any)?.username,
      course_title: (data.courses as any)?.title,
      likes_count: likesCount,
      comments_count: commentsCount,
      is_liked: isLiked
    };
  },

  async create(record: {
    user_id: number;
    course_id?: number | null;
    title: string;
    content?: string | null;
    image_url?: string | null;
    distance?: number | null;
    duration?: number | null;
    record_date: string;
    weather?: string | null;
    mood?: string | null;
    meal?: string | null;
    calories?: number | null;
    sleep_hours?: number | null;
    sleep_quality?: string | null;
  }) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('running_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('RunningRecord create error:', error);
      throw error;
    }
    return data;
  },

  async update(id: number, record: {
    title?: string;
    content?: string | null;
    image_url?: string | null;
    distance?: number | null;
    duration?: number | null;
    record_date?: string;
    course_id?: number | null;
    weather?: string | null;
    mood?: string | null;
    meal?: string | null;
    calories?: number | null;
    sleep_hours?: number | null;
    sleep_quality?: string | null;
  }) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('running_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('RunningRecord update error:', error);
      throw error;
    }
    return data;
  },

  async delete(id: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { error } = await supabaseAdmin
      .from('running_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('RunningRecord delete error:', error);
      throw error;
    }
    return true;
  },

  async getLikesCount(recordId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { count, error } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('record_id', recordId);
    
    return error ? 0 : (count || 0);
  },

  async getCommentsCount(recordId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { count, error } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('record_id', recordId);
    
    return error ? 0 : (count || 0);
  },

  async isLiked(recordId: number, userId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('record_id', recordId)
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    return !error && data !== null;
  }
};

// Likes 테이블
export const likes = {
  async toggle(courseId: number | null, recordId: number | null, userId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    if (!courseId && !recordId) {
      throw new Error('courseId or recordId is required');
    }

    // 기존 좋아요 확인
    const query = supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', userId);

    if (courseId) {
      query.eq('course_id', courseId);
    }
    if (recordId) {
      query.eq('record_id', recordId);
    }

    const { data: existingLike } = await query.single();

    if (existingLike) {
      // 좋아요 삭제
      const { error } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        console.error('Like delete error:', error);
        throw error;
      }
      return { action: 'removed' };
    } else {
      // 좋아요 추가
      const { error } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: userId,
          course_id: courseId,
          record_id: recordId
        });

      if (error) {
        console.error('Like create error:', error);
        throw error;
      }
      return { action: 'added' };
    }
  }
};

// Comments 테이블
export const comments = {
  async findByCourseId(courseId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Comments findByCourseId error:', error);
      return [];
    }

    return (data || []).map(comment => ({
      ...comment,
      username: (comment.users as any)?.username
    }));
  },

  async findByRecordId(recordId: number) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('record_id', recordId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Comments findByRecordId error:', error);
      return [];
    }

    return (data || []).map(comment => ({
      ...comment,
      username: (comment.users as any)?.username
    }));
  },

  async create(comment: {
    user_id: number;
    course_id?: number | null;
    record_id?: number | null;
    content: string;
  }) {
    if (!supabaseAdmin) {
      throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    }
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error('Comment create error:', error);
      throw error;
    }
    return data;
  }
};
