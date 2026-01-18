# 로그인 오류 해결 가이드

## 로그인 API 개선 완료

로그인 API에 다음 개선사항을 적용했습니다:

1. ✅ Supabase 관리자 클라이언트 초기화 확인
2. ✅ 더 구체적인 에러 메시지
3. ✅ 프로덕션 환경에서 쿠키 설정 개선
4. ✅ 상세한 에러 로깅

---

## 다음 단계: 오류 메시지 확인

### 방법 1: 브라우저 개발자 도구 (가장 빠름)

1. **프로덕션 URL에서 로그인 시도**
   - `https://run-nqv1weydx-moonees-projects-94e5a1cd.vercel.app/login`

2. **브라우저 개발자 도구 열기**
   - `F12` 또는 `Cmd + Option + I` (Mac)

3. **Network 탭 확인**
   - `/api/auth/login` 요청 찾기
   - 클릭하여 상세 정보 확인
   - **Response 탭**에서 오류 메시지 확인

4. **오류 메시지 확인**
   - 오류 메시지 전체 복사
   - 예: `"서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."`
   - 또는 `"이메일 또는 비밀번호가 올바르지 않습니다."`

---

### 방법 2: Vercel 함수 로그

1. **Vercel 대시보드 접속**
2. **프로젝트 > Deployments > 최근 배포 > Logs**
3. **로그인 시도 후 로그 확인**
   - `/api/auth/login` 관련 로그 확인
   - 오류 메시지 확인

---

## 일반적인 오류와 해결

### 오류 1: "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."

**원인:** `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 문제

**해결:**
1. Vercel > Settings > Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 확인
3. **Production 환경에 체크**되어 있는지 확인
4. 값이 올바른지 확인 (Supabase 대시보드에서 복사)
5. 재배포 (환경 변수 변경 후 자동 재배포 또는 수동 재배포)

---

### 오류 2: "이메일 또는 비밀번호가 올바르지 않습니다."

**원인:** 
- 회원가입이 완료되지 않음
- 잘못된 이메일/비밀번호 입력

**해결:**
1. 회원가입이 완료되었는지 확인
2. 이메일과 비밀번호를 정확히 입력했는지 확인
3. Supabase Table Editor에서 `users` 테이블에 사용자가 있는지 확인

---

### 오류 3: "서버 오류가 발생했습니다."

**원인:** 기타 서버 오류

**해결:**
1. Vercel 함수 로그에서 상세 오류 확인
2. 오류 메시지를 알려주시면 더 구체적으로 도와드릴 수 있습니다

---

## 빠른 체크리스트

- [ ] 로그인 API 코드 개선 완료
- [ ] 브라우저 개발자 도구에서 오류 메시지 확인
- [ ] Vercel 환경 변수 확인 (Production 환경)
- [ ] Supabase 프로젝트 URL 일치 확인

---

## 코드 변경사항

### 개선된 로그인 API

1. **Supabase 관리자 클라이언트 확인**
   ```typescript
   if (!supabaseAdmin) {
     return NextResponse.json(
       { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
       { status: 500 }
     );
   }
   ```

2. **에러 핸들링 개선**
   - `findByEmail` 호출 시 에러 처리
   - 구체적인 에러 메시지 반환

3. **프로덕션 쿠키 설정 개선**
   ```typescript
   const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
   response.cookies.set('token', token, {
     httpOnly: true,
     secure: isProduction,
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7,
     path: '/',
   });
   ```

---

## 다음 단계

1. ✅ 로그인 API 코드 개선 완료
2. ⏭️ 코드를 GitHub에 푸시
3. ⏭️ Vercel 자동 재배포 대기
4. ⏭️ 프로덕션에서 로그인 테스트
5. ⏭️ 오류 메시지 확인 및 추가 해결

**코드를 GitHub에 푸시하고 Vercel 재배포를 기다린 후, 프로덕션에서 로그인을 다시 시도해보세요!**

오류 메시지를 알려주시면 더 구체적으로 도와드릴 수 있습니다.
