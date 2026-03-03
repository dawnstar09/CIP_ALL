# 야자 관리 시스템

2학년 1~10반의 야자(저녁 자율학습) 참여 현황을 관리하는 웹 애플리케이션입니다.

## 기능

- **반별 관리**: 1~10반 각각의 독립적인 페이지
- **학생 현황**: 36명 학생의 참가/불참 상태를 시각적으로 표시
- **차시 관리**: 1~3차시 야자를 개별 관리
- **불참 관리**: 불참 사유(병원, 학원, 동아리, 방과후, 기타) 기록
- **통계**: 날짜별 불참 기록 조회
- **실시간 업데이트**: Firebase를 통한 데이터 동기화

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. 프로젝트 설정:
   - Google Analytics는 선택사항 (필요시 활성화)
3. **Firestore Database** 생성:
   - 빌드 > Firestore Database 선택
   - "데이터베이스 만들기" 클릭
   - 테스트 모드로 시작 (또는 프로덕션 모드에서 규칙 설정)
   - 위치 선택 (asia-northeast3 - 서울 권장)

#### 웹 앱 추가 및 설정

1. 프로젝트 개요 > 프로젝트 설정
2. "내 앱" 섹션에서 웹 앱 추가 (</>)
3. 앱 닉네임 입력 (예: "야자관리시스템")
4. Firebase SDK 설정 정보 복사

#### 환경 변수 설정

1. `.env.local.example` 파일을 `.env.local`로 복사 (이미 생성되어 있음)
2. `.env.local` 파일을 열어 Firebase 설정 값 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**중요**: `.env.local` 파일은 Git에 커밋되지 않습니다 (보안상 중요)

#### Firestore 보안 규칙 설정 (선택사항)

개발 중이라면 테스트 모드로 충분하지만, 프로덕션에서는 다음과 같은 규칙을 권장합니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /absences/{document=**} {
      allow read, write: if true; // 개발용 - 프로덕션에서는 인증 추가 필요
    }
  }
}
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 사용 방법

### 현재 야자 현황

1. 메인 페이지에서 원하는 반 선택
2. 날짜와 차시 선택
3. 학생 그리드에서 참가(초록색)/불참(빨간색) 확인
4. 빨간색 학생 클릭 시 상세 정보 표시

### 불참 추가

1. "야자 불참 추가" 버튼 클릭
2. 차시 선택
3. 학생 번호 선택
4. 불참 사유 선택 및 상세 정보 입력
5. "추가" 버튼 클릭

### 야자 통계

1. "야자 통계" 탭 선택
2. 시작 날짜와 종료 날짜 선택
3. "조회" 버튼 클릭
4. 기간 내 불참 기록 확인

## 기술 스택

- **Next.js 14**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Firebase Firestore**: 데이터베이스

## 프로젝트 구조

```
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 페이지 (반 선택)
│   ├── globals.css         # 전역 스타일
│   └── class/
│       └── [id]/
│           └── page.tsx    # 반별 페이지
├── components/
│   ├── StudentGrid.tsx     # 학생 현황 그리드
│   ├── AbsenceModal.tsx    # 불참 추가 모달
│   └── PeriodSelector.tsx  # 차시 선택 컴포넌트
├── lib/
│   └── firebase.ts         # Firebase 설정
└── types/
    └── index.ts            # TypeScript 타입 정의
```

## 데이터 구조

### Firestore 컬렉션: `absences`

```typescript
{
  classNumber: number      // 반 번호 (1-10)
  studentId: number        // 학생 번호 (1-36)
  studentName: string      // 학생 이름
  date: string            // 날짜 (YYYY-MM-DD)
  period: 1 | 2 | 3       // 차시
  reason: string          // 사유 (병원, 학원, 동아리, 방과후, 기타)
  detail: string          // 상세 사유
  createdAt: Date         // 생성 시간
}
```

## 향후 개선 사항

- [ ] 학생 명렬표 업로드 기능
- [ ] 엑셀 내보내기
- [ ] 출석률 차트
- [ ] 학생별 통계
- [ ] 알림 기능
- [ ] 관리자 인증

## 라이선스

MIT
