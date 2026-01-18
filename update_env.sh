#!/bin/bash

# .env 파일 업데이트 스크립트

cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

cat > .env << 'EOF'
# 기존에 있던 변수들
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI=
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase (Supabase 대시보드 > Settings > API에서 복사)
NEXT_PUBLIC_SUPABASE_URL=https://heytensiqyzqscptkcym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X
SUPABASE_SERVICE_ROLE_KEY=sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd

# Cloudinary (Cloudinary Dashboard에서 복사)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=cxGoHkFn5FdUxwFzNqGY8qAaTMI
EOF

echo "✅ .env 파일이 업데이트되었습니다!"
echo ""
echo "파일 내용 확인:"
cat .env
