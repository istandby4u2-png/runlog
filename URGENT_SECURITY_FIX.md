# 🚨 긴급 보안 조치 필요!

## ⚠️ 발견된 문제

**GitHub 저장소에 실제 API 키가 노출되어 있습니다!**

### 노출된 파일

1. **VERCEL_DEPLOYMENT.md** - 실제 API 키 포함
2. Git 히스토리에 영구적으로 기록됨

### 노출된 키 목록

- ✅ Google Maps API 키: `AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8`
- ✅ Gemini API 키: `AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4`
- ✅ Supabase Anon Key: `sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X`
- ✅ Supabase Service Role Key: `sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd` ⚠️ **매우 위험!**
- ✅ Cloudinary API Key: `889538896366331`
- ✅ Cloudinary API Secret: `cxGoHkFn5FdUxwFzNqGY8qAaTMI` ⚠️ **매우 위험!**
- ✅ JWT Secret: `Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI=` ⚠️ **매우 위험!**

---

## 🚨 즉시 조치 사항 (우선순위 순)

### 1. 모든 API 키 즉시 무효화 및 교체 (최우선!)

#### Google Maps API 키

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services > Credentials** 이동
3. 키 `AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8` 찾기
4. **Delete** 클릭 (또는 **Restrict**로 제한)
5. 새 API 키 생성
6. Vercel 환경 변수 업데이트

#### Gemini API 키

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. 키 `AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 삭제
3. 새 키 생성
4. Vercel 환경 변수 업데이트

#### Supabase API 키

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings > API** 이동
4. **Reset API keys** 클릭
5. 새 키 생성
6. Vercel 환경 변수 업데이트

**⚠️ 특히 Service Role Key (`sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd`)는 즉시 무효화하세요!**

#### Cloudinary API 키

1. [Cloudinary Dashboard](https://cloudinary.com/console) 접속
2. **Settings > Security** 이동
3. **API Keys** 섹션에서 키 재생성
4. Vercel 환경 변수 업데이트

**⚠️ 특히 API Secret (`cxGoHkFn5FdUxwFzNqGY8qAaTMI`)는 즉시 무효화하세요!**

#### JWT Secret

1. 새 JWT Secret 생성:
   ```bash
   openssl rand -base64 32
   ```
2. Vercel 환경 변수 업데이트
3. **모든 사용자 세션 무효화됨** (재로그인 필요)

---

### 2. Git 히스토리에서 키 제거

#### 방법 1: 파일 수정 후 커밋 (빠른 방법)

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 파일 수정 (이미 완료됨)
git add VERCEL_DEPLOYMENT.md
git commit -m "Remove exposed API keys from documentation"
git push origin main
```

**⚠️ 주의:** 이 방법은 Git 히스토리에 여전히 이전 키가 남아있습니다. 완전히 제거하려면 방법 2를 사용하세요.

#### 방법 2: Git 히스토리 완전 제거 (권장)

```bash
# git-filter-repo 설치 (필요한 경우)
pip install git-filter-repo

# VERCEL_DEPLOYMENT.md 파일의 히스토리에서 키 제거
git filter-repo --path VERCEL_DEPLOYMENT.md --invert-paths

# 또는 BFG Repo-Cleaner 사용
bfg --replace-text passwords.txt
```

**⚠️ 주의:** 이 방법은 Git 히스토리를 재작성하므로 강제 푸시가 필요합니다:
```bash
git push origin main --force
```

---

### 3. 사용량 모니터링 및 악용 확인

각 서비스의 사용량 대시보드를 확인하여 악용 여부를 확인하세요:

#### Google Maps API

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services > Dashboard** 이동
3. **Maps JavaScript API** 클릭
4. **Metrics** 탭에서 사용량 확인:
   - 비정상적인 요청 급증 확인
   - 알 수 없는 IP에서의 요청 확인

#### Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. **Settings > Usage** 이동
3. 확인 항목:
   - 비정상적인 API 요청
   - 데이터베이스 크기 급증
   - 알 수 없는 데이터 접근

#### Cloudinary

1. [Cloudinary Dashboard](https://cloudinary.com/console) 접속
2. **Usage** 탭 확인:
   - 비정상적인 대역폭 사용
   - 알 수 없는 이미지 업로드
   - 저장소 사용량 급증

---

### 4. API 키 제한 설정 (새 키 발급 후)

#### Google Maps API 키 제한

1. Google Cloud Console > APIs & Services > Credentials
2. 새 API 키 선택
3. **API restrictions** 설정:
   - ✅ Maps JavaScript API만 허용
4. **Application restrictions** 설정:
   - HTTP referrers (web sites)
   - 허용된 도메인:
     - `localhost:3000`
     - `*.vercel.app`
     - `yourdomain.com` (있는 경우)

#### Supabase

- **Anon Key**: Row Level Security (RLS) 정책으로 보호
- **Service Role Key**: 절대 공개하지 마세요!

#### Cloudinary

- 업로드 제한 설정
- 대역폭 제한 설정

---

## ✅ 완료 체크리스트

- [ ] Google Maps API 키 무효화 및 교체
- [ ] Gemini API 키 무효화 및 교체
- [ ] Supabase API 키 무효화 및 교체 (특히 Service Role Key)
- [ ] Cloudinary API 키 무효화 및 교체 (특히 API Secret)
- [ ] JWT Secret 교체
- [ ] Vercel 환경 변수 업데이트
- [ ] VERCEL_DEPLOYMENT.md 파일에서 키 제거 (완료)
- [ ] Git 히스토리 정리
- [ ] 각 서비스 사용량 확인
- [ ] 새 키에 제한 설정

---

## 📝 향후 예방 조치

1. **절대 실제 키를 문서에 포함하지 마세요**
2. **`.env.example` 파일만 사용하세요**
3. **Git 커밋 전에 키 검색:**
   ```bash
   git diff --cached | grep -i "API.*KEY\|SECRET\|PASSWORD"
   ```
4. **GitHub Secret Scanning 활성화**
5. **정기적인 키 교체 (3-6개월)**

---

## 🆘 도움이 필요하신가요?

- [GitHub 보안 가이드](https://docs.github.com/en/code-security)
- [Google Cloud 보안 모범 사례](https://cloud.google.com/security)
- [Supabase 보안 가이드](https://supabase.com/docs/guides/platform/security)

---

## 요약

1. 🚨 **즉시 모든 API 키 무효화 및 교체**
2. 🧹 **Git 히스토리에서 키 제거**
3. 📊 **사용량 모니터링 및 악용 확인**
4. 🛡️ **새 키에 제한 설정**
5. ✅ **예방 조치 적용**

**시간이 중요합니다. 가능한 한 빨리 조치하세요!**
