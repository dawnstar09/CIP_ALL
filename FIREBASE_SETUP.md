# Firebase 설정 가이드

이 문서는 야자 관리 시스템에 Firebase를 연동하는 방법을 단계별로 안내합니다.

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "야자관리시스템")
4. Google Analytics 사용 여부 선택 (선택사항)
5. "프로젝트 만들기" 클릭

## 2단계: Firestore Database 생성

1. Firebase Console 왼쪽 메뉴에서 **빌드 > Firestore Database** 선택
2. "데이터베이스 만들기" 버튼 클릭
3. **보안 규칙 선택**:
   - 개발 중: "테스트 모드에서 시작" 선택
   - 프로덕션: "프로덕션 모드에서 시작" 선택 후 규칙 설정
4. **Cloud Firestore 위치 선택**: 
   - `asia-northeast3` (서울) 권장
5. "사용 설정" 클릭

### Firestore 보안 규칙 (개발용)

테스트 모드를 선택한 경우, 자동으로 다음 규칙이 설정됩니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 4, 1);
    }
  }
}
```

## 3단계: 웹 앱 등록

1. Firebase Console에서 **프로젝트 개요** (톱니바퀴 옆의 홈 아이콘) 클릭
2. "프로젝트 설정" 클릭
3. "내 앱" 섹션으로 스크롤
4. **웹 앱 추가** 버튼 `</>` 클릭
5. 앱 닉네임 입력 (예: "야자관리웹")
6. "Firebase Hosting 설정" 체크박스는 선택하지 않음
7. "앱 등록" 클릭

## 4단계: Firebase SDK 설정 복사

앱 등록 후 표시되는 Firebase 설정 정보를 복사합니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

나중에도 확인 가능합니다:
- 프로젝트 설정 > 일반 > 내 앱 > Firebase SDK snippet > 구성

## 5단계: 프로젝트에 환경 변수 설정

### Windows (PowerShell)

1. 프로젝트 폴더에서 `.env.local` 파일 열기:
```powershell
notepad .env.local
```

2. 다음 내용을 입력 (위에서 복사한 값으로 대체):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

3. 파일 저장

### macOS/Linux

```bash
# .env.local 파일 편집
nano .env.local

# 위 내용 입력 후
# Ctrl + O (저장)
# Ctrl + X (종료)
```

## 6단계: 개발 서버 재시작

환경 변수를 변경했으므로 개발 서버를 재시작해야 합니다:

```bash
# 기존 서버 중지 (Ctrl + C)
# 서버 재시작
npm run dev
```

## 7단계: 연동 확인

1. 브라우저에서 http://localhost:3000 접속
2. 임의의 반 선택 (예: 1반)
3. "야자 불참 추가" 버튼 클릭
4. 학생 선택, 차시 선택, 사유 입력 후 "추가" 클릭
5. Firebase Console > Firestore Database에서 데이터 확인:
   - `absences` 컬렉션이 생성되고
   - 추가한 불참 기록이 문서로 저장되어 있어야 함

## 트러블슈팅

### 문제 1: "Firebase 설정이 완료되지 않았습니다" 경고

**원인**: `.env.local` 파일의 환경 변수가 올바르게 설정되지 않음

**해결**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 각 환경 변수가 `NEXT_PUBLIC_` 접두사로 시작하는지 확인
3. 값에 따옴표나 공백이 없는지 확인
4. 개발 서버 재시작

### 문제 2: Permission denied 오류

**원인**: Firestore 보안 규칙이 잘못 설정됨

**해결**:
1. Firebase Console > Firestore Database > 규칙 탭
2. 다음 규칙으로 변경 (개발용):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
3. "게시" 클릭

### 문제 3: "The query requires an index" 오류

**원인**: 통계 조회 시 복합 쿼리를 사용하는데, Firestore 인덱스가 생성되지 않음

**증상**:
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**해결 방법**:

#### 방법 1: 자동 인덱스 생성 (권장)
1. 브라우저 콘솔(F12)의 오류 메시지에서 링크 클릭
2. Firebase Console의 인덱스 생성 페이지가 열림
3. **"인덱스 만들기"** 또는 **"Create Index"** 버튼 클릭
4. 인덱스 생성 완료까지 1-2분 대기
5. 생성 완료 후 통계 페이지에서 다시 조회

#### 방법 2: 수동 인덱스 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 > **Firestore Database** > **인덱스** 탭
3. **"복합 인덱스 추가"** 또는 **"Add Index"** 클릭
4. 다음 설정 입력:
   - **컬렉션 ID**: `absences`
   - **필드 1**: `classNumber`, 모드: `오름차순`
   - **필드 2**: `date`, 모드: `오름차순`
   - **쿼리 범위**: `컬렉션`
5. **"인덱스 만들기"** 클릭
6. 인덱스 상태가 **"사용 설정됨"**으로 변경될 때까지 대기

**참고**: 인덱스는 한 번만 생성하면 되며, 이후에는 자동으로 사용됩니다.

### 문제 4: 데이터가 저장되지 않음

**원인**: 
- 네트워크 연결 문제
- Firestore Database가 생성되지 않음
- Firebase 설정 오류

**해결**:
1. 브라우저 콘솔(F12)에서 오류 메시지 확인
2. Firebase Console에서 Firestore Database가 활성화되어 있는지 확인
3. `.env.local` 파일의 `projectId`가 올바른지 확인

## 보안 권장사항

### 프로덕션 배포 시 보안 규칙 강화

개발이 완료되면 Firestore 보안 규칙을 강화하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // absences 컬렉션에 대한 규칙
    match /absences/{absenceId} {
      // 읽기: 해당 반의 데이터만 읽을 수 있도록
      allow read: if true; // 인증 추가 시 수정 필요
      
      // 쓰기: 유효한 데이터 구조인지 검증
      allow create: if request.resource.data.keys().hasAll([
        'classNumber', 'studentId', 'studentName', 
        'reason', 'date', 'period', 'createdAt'
      ]) && request.resource.data.classNumber is int
         && request.resource.data.classNumber >= 1
         && request.resource.data.classNumber <= 10;
      
      allow update, delete: if true; // 인증 추가 시 수정 필요
    }
  }
}
```

## 추가 설정 (선택사항)

### Firebase Authentication 추가

추후 로그인 기능을 추가하려면:

1. Firebase Console > 빌드 > Authentication
2. "시작하기" 클릭
3. 로그인 제공업체 선택 (이메일/비밀번호, Google 등)
4. 설정 활성화

### Firebase Hosting 배포

앱을 Firebase Hosting에 배포하려면:

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 초기화
firebase init

# 배포
npm run build
firebase deploy
```

## 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 시작하기](https://firebase.google.com/docs/firestore/quickstart)
- [Next.js 환경 변수](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
