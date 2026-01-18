import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/running.db';
const dbDir = path.dirname(dbPath);

// 데이터베이스 디렉토리 생성
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// 데이터베이스 초기화
export function initDatabase() {
  // 사용자 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 코스 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      path_data TEXT NOT NULL,
      image_url TEXT,
      distance REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 러닝 기록 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS running_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      image_url TEXT,
      distance REAL,
      duration INTEGER,
      record_date DATE NOT NULL,
      weather TEXT,
      mood TEXT,
      meal TEXT,
      calories REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  // 기존 테이블에 컬럼 추가 (마이그레이션)
  try {
    db.exec(`ALTER TABLE running_records ADD COLUMN weather TEXT`);
  } catch (e) {
    // 컬럼이 이미 존재하는 경우 무시
  }
  
  try {
    db.exec(`ALTER TABLE running_records ADD COLUMN mood TEXT`);
  } catch (e) {
    // 컬럼이 이미 존재하는 경우 무시
  }

  try {
    db.exec(`ALTER TABLE running_records ADD COLUMN meal TEXT`);
  } catch (e) {
    // 컬럼이 이미 존재하는 경우 무시
  }

  try {
    db.exec(`ALTER TABLE running_records ADD COLUMN calories REAL`);
  } catch (e) {
    // 컬럼이 이미 존재하는 경우 무시
  }

  // 좋아요 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER,
      record_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (record_id) REFERENCES running_records(id),
      UNIQUE(user_id, course_id),
      UNIQUE(user_id, record_id)
    )
  `);

  // 코멘트 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER,
      record_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (record_id) REFERENCES running_records(id)
    )
  `);
}

// 데이터베이스 초기화 실행
initDatabase();

export default db;
