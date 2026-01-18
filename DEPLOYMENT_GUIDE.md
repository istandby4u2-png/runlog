# 웹사이트 배포 가이드

## 배포 옵션

### 방법 1: Vercel (권장) ⭐

**가장 쉬운 방법이며 Next.js에 최적화되어 있습니다.**

#### 장점
- Next.js 제작사가 만든 플랫폼
- 무료 플랜 제공
- 자동 HTTPS
- Git 연동으로 자동 배포
- 환경 변수 관리 쉬움
- 빠른 CDN

#### 배포 단계

1. **Vercel 계정 생성**
   - [vercel.com](https://vercel.com) 접속
   - GitHub 계정으로 로그인 (권장)

2. **프로젝트 준비**
   ```bash
   # Git 저장소 초기화 (아직 안 했다면)
   cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **GitHub에 푸시**
   - GitHub에서 새 저장소 생성
   - 로컬 저장소를 GitHub에 연결
   ```bash
   git remote add origin https://github.com/yourusername/runlog.git
   git push -u origin main
   ```

4. **Vercel에 배포**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: `.next`

5. **환경 변수 설정**
   - Vercel 프로젝트 설정 > Environment Variables
   - 다음 변수 추가:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
     JWT_SECRET=your_secure_random_string
     DATABASE_PATH=./data/running.db
     GEMINI_API_KEY=your_gemini_key
     ```

6. **배포 완료**
   - 자동으로 배포가 시작됩니다
   - 배포 완료 후 URL이 제공됩니다 (예: `https://runlog.vercel.app`)

#### 주의사항
- **SQLite 데이터베이스**: Vercel은 서버리스 환경이므로 SQLite는 적합하지 않습니다
- **대안**: PostgreSQL, MySQL 등 외부 데이터베이스 사용 필요
- **파일 업로드**: Vercel은 임시 파일 시스템을 사용하므로 영구 저장소 필요 (예: AWS S3, Cloudinary)

---

### 방법 2: Netlify

#### 장점
- 무료 플랜 제공
- 쉬운 배포
- 자동 HTTPS

#### 배포 단계

1. **Netlify 계정 생성**
   - [netlify.com](https://netlify.com) 접속
   - GitHub 계정으로 로그인

2. **GitHub에 푸시** (Vercel과 동일)

3. **Netlify에 배포**
   - "Add new site" > "Import an existing project"
   - GitHub 저장소 선택
   - 빌드 설정:
     - Build command: `npm run build`
     - Publish directory: `.next`

4. **환경 변수 설정**
   - Site settings > Environment variables

#### 주의사항
- Vercel과 동일하게 SQLite 및 파일 저장소 문제 있음

---

### 방법 3: 자체 서버 (VPS)

#### 장점
- 완전한 제어
- SQLite 사용 가능
- 파일 저장소 문제 없음

#### 필요한 것
- VPS 서버 (예: AWS EC2, DigitalOcean, Linode)
- 도메인 (선택사항)

#### 배포 단계

1. **서버 준비**
   ```bash
   # 서버에 Node.js 설치
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2 설치 (프로세스 관리)
   sudo npm install -g pm2
   ```

2. **프로젝트 업로드**
   ```bash
   # Git을 사용하거나
   git clone https://github.com/yourusername/runlog.git
   
   # 또는 SCP로 파일 전송
   scp -r ./project user@server:/path/to/project
   ```

3. **의존성 설치 및 빌드**
   ```bash
   cd /path/to/project
   npm install
   npm run build
   ```

4. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   nano .env
   # 환경 변수 입력
   ```

5. **PM2로 실행**
   ```bash
   pm2 start npm --name "runlog" -- start
   pm2 save
   pm2 startup
   ```

6. **Nginx 설정 (리버스 프록시)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **HTTPS 설정 (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 배포 전 체크리스트

### 1. 환경 변수 확인
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 설정
- [ ] `JWT_SECRET` 강력한 랜덤 문자열로 변경
- [ ] `GEMINI_API_KEY` 설정
- [ ] API 키 제한 설정 (Google Cloud Console)

### 2. 보안 확인
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] API 키가 코드에 하드코딩되지 않았는지 확인
- [ ] JWT_SECRET을 프로덕션용으로 변경

### 3. 데이터베이스
- [ ] SQLite 사용 시 → VPS/자체 서버 필요
- [ ] 클라우드 배포 시 → PostgreSQL/MySQL 등 외부 DB 필요

### 4. 파일 저장소
- [ ] 업로드된 이미지 저장소 설정 (S3, Cloudinary 등)
- [ ] 현재는 로컬 파일 시스템 사용 중 → 변경 필요

### 5. 빌드 테스트
```bash
npm run build
npm start
```

---

## 프로덕션 환경 개선 사항

### 1. 데이터베이스 마이그레이션

SQLite → PostgreSQL 예시:

```bash
# PostgreSQL 설치 및 설정
# 데이터베이스 생성
createdb runlog

# better-sqlite3 대신 pg 또는 postgres 사용
npm install pg
```

### 2. 파일 저장소 설정

#### Cloudinary 사용 예시:
```bash
npm install cloudinary next-cloudinary
```

#### AWS S3 사용 예시:
```bash
npm install @aws-sdk/client-s3
```

### 3. 환경 변수 관리

프로덕션 환경 변수:
- `.env.production` 파일 생성
- 배포 플랫폼의 환경 변수 설정 사용

---

## 빠른 시작 (Vercel)

가장 빠른 배포 방법:

1. **GitHub에 코드 푸시**
2. **Vercel에 연결**
3. **환경 변수 설정**
4. **배포 완료!**

**주의**: SQLite와 파일 업로드는 Vercel에서 작동하지 않으므로, 데이터베이스와 파일 저장소를 외부 서비스로 변경해야 합니다.

---

## 추천 배포 스택

### 옵션 A: 완전 클라우드 (서버리스)
- **호스팅**: Vercel
- **데이터베이스**: Supabase (PostgreSQL) 또는 PlanetScale (MySQL)
- **파일 저장소**: Cloudinary 또는 AWS S3
- **비용**: 무료 ~ $20/월

### 옵션 B: 전통적인 서버
- **호스팅**: DigitalOcean Droplet ($6/월) 또는 AWS EC2
- **데이터베이스**: 서버 내 SQLite 또는 PostgreSQL
- **파일 저장소**: 서버 내 파일 시스템
- **비용**: $6-20/월

---

## 다음 단계

1. **배포 방법 선택**
2. **데이터베이스 마이그레이션** (필요한 경우)
3. **파일 저장소 설정** (필요한 경우)
4. **환경 변수 설정**
5. **도메인 연결** (선택사항)
6. **배포 및 테스트**

자세한 도움이 필요하시면 알려주세요!
