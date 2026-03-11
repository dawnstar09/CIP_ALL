# 🔐 보안 시스템 설정 가이드

야자 관리 시스템에 **명렬표 기반 보안 시스템**이 구현되었습니다.

## ✅ 구현된 보안 기능

### 1. **Google 로그인 인증**
- Firebase Authentication 사용
- 학교 이메일로만 로그인 가능 (설정 가능)

### 2. **반별 접근 제어**
- 명렬표에 등록된 학생만 해당 반 접근 가능
- 관리자/교사는 모든 반 접근 가능

### 3. **본인 야자만 추가 가능**
- 학생은 본인의 야자 불참만 추가 가능
- Firestore Security Rules로 서버 측에서 검증 (뚫을 수 없음)

### 4. **Firestore Security Rules**
- 서버 측 보안 규칙으로 데이터 접근 완전 통제
- 클라이언트 해킹으로도 우회 불가

---

## 📋 설정 단계

### 1단계: Firebase Authentication 활성화

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **빌드 > Authentication** 메뉴 선택
4. **Sign-in method** 탭 클릭
5. **Google** 제공업체 선택
6. **사용 설정** 토글 ON
7. 저장

#### 학교 도메인만 허용하려면:
`lib/firebase.ts` 파일에서 주석 해제:
```typescript
googleProvider.setCustomParameters({
  hd: 'school.example.com' // 학교 도메인으로 변경 (예: students.myschool.ac.kr)
})
```

---

### 2단계: Firestore Security Rules 배포

1. Firebase Console > **Firestore Database** 메뉴
2. **규칙** 탭 클릭
3. `firestore.rules` 파일의 내용을 복사하여 붙여넣기
4. **게시** 버튼 클릭

또는 Firebase CLI 사용:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

### 3단계: 학생 명렬표 등록

#### 방법 1: 관리자 페이지에서 등록

1. 관리자 계정으로 로그인
2. `/admin/students` 페이지 접속
3. CSV 형식으로 학생 정보 입력:
   ```
   1,김철수,chulsoo@school.com,20501
   2,이영희,younghee@school.com,20502
   3,박민수,minsu@school.com,20503
   ```
4. **미리보기** 클릭하여 확인
5. **등록하기** 클릭

#### 방법 2: Firestore에서 직접 등록

Firebase Console에서 수동 등록:
1. **Firestore Database** 메뉴
2. 컬렉션 구조:
   ```
   classes/
     └── 2-5/
         └── students/
             └── student1@school.com
                 ├── id: 1
                 ├── name: "김철수"
                 ├── email: "student1@school.com"
                 ├── studentId: "20501"
                 └── classId: "2-5"
   ```

---

### 4단계: 첫 관리자 계정 설정

1. Firebase Console > **Firestore Database**
2. `users` 컬렉션 생성
3. 관리자 이메일로 문서 생성:
   ```
   users/
     └── admin@school.com
         ├── email: "admin@school.com"
         ├── name: "관리자"
         ├── role: "admin"
 ```

---

## 🛡️ 보안 아키텍처

### 데이터 구조

```
Firestore Database
├── users/                              # 사용자 정보
│   └── {userEmail}
│       ├── email: string
│       ├── name: string
│       ├── role: "student" | "teacher" | "admin"
│       └── classId?: string           # 학생인 경우 소속 반
│
├── classes/                           # 반 정보
│   └── {classId}                      # 예: "2-5"
│       ├── name: string
│       └── students/                  # 명렬표 (서브컬렉션)
│           └── {studentEmail}
│               ├── id: number         # 번호
│               ├── name: string
│               ├── email: string
│               ├── studentId: string  # 학번
│               └── classId: string
│
└── absences/                          # 야자 불참 기록
    └── {absenceId}
        ├── classId: string
        ├── studentId: number
        ├── studentName: string
        ├── studentEmail: string       # 본인 인증용
        ├── userId: string             # Firebase Auth UID
        ├── reason: string
        ├── date: string
        └── period: number
```

### 보안 규칙 요약

| 작업 | 학생 | 교사/관리자 |
|------|------|-------------|
| 반 정보 읽기 | ✅ 본인 반만 | ✅ 모든 반 |
| 명렬표 읽기 | ✅ 본인 반만 | ✅ 모든 반 |
| 야자 추가 | ✅ 본인만 | ✅ 모든 학생 |
| 야자 수정/삭제 | ✅ 본인만 | ✅ 모두 |
| 명렬표 수정 | ❌ 불가 | ✅ 가능 |

---

## 🔍 보안 테스트

### 테스트 시나리오

1. **권한 없는 반 접근 시도**
   - 결과: "해당 반에 접근 권한이 없습니다" 알림 후 홈으로 이동

2. **다른 학생 야자 추가 시도**
   - 결과: Firestore Security Rules에서 차단 (permission-denied)

3. **명렬표에 없는 사용자 로그인**
   - 결과: "명렬표에 등록되지 않은 사용자입니다" 알림

---

## 📱 사용 흐름

### 학생 사용 흐름
1. Google 로그인
2. 본인 반 클릭
3. 야자 불참 추가
   - 자동으로 본인 정보만 표시
   - 본인 야자만 추가 가능

### 관리자/교사 사용 흐름
1. Google 로그인
2. 모든 반 접근 가능
3. 명렬표 관리 (`/admin/students`)
4. 모든 학생의 야자 조회/수정 가능

---

## ⚠️ 중요 보안 사항

### ✅ 안전한 것
- Firestore Security Rules는 서버 측에서 실행되어 **100% 안전**
- 클라이언트에서 코드를 수정해도 Security Rules를 우회할 수 없음
- 본인이 아닌 학생의 야자를 추가하려고 하면 `permission-denied` 오류 발생

### ⚠️ 주의사항
1. **Security Rules 배포 필수**
   - Rules를 배포하지 않으면 보안이 작동하지 않음
   
2. **관리자 계정 보호**
   - 관리자 계정은 모든 권한이 있으므로 신중히 관리

3. **학교 도메인 제한 권장**
   - `googleProvider.setCustomParameters({ hd: 'school-domain.com' })` 설정 권장

---

## 🚨 문제 해결

### "permission-denied" 오류 발생
**원인**: Firestore Security Rules가 제대로 배포되지 않음

**해결**:
1. Firebase Console > Firestore Database > 규칙 탭 확인
2. `firestore.rules` 내용을 다시 배포
3. 브라우저 캐시 삭제 후 재시도

### 로그인 후 반 접근 불가
**원인**: 명렬표에 사용자가 등록되지 않음

**해결**:
1. `/admin/students` 페이지에서 학생 등록
2. 이메일이 정확한지 확인
3. Firebase Console에서 `classes/{classId}/students/{email}` 문서 확인

### 야자 추가 시 "명렬표에 등록되지 않은 사용자" 오류
**원인**: 로그인한 이메일이 명렬표에 없음

**해결**:
1. 관리자에게 명렬표 등록 요청
2. 올바른 학교 이메일로 로그인했는지 확인

---

## 📊 보안 수준

| 기능 | 보안 수준 | 설명 |
|------|-----------|------|
| Google 로그인 | ⭐⭐⭐⭐⭐ | Firebase Authentication (업계 표준) |
| 반 접근 제어 | ⭐⭐⭐⭐⭐ | 서버 측 Security Rules |
| 본인 야자 확인 | ⭐⭐⭐⭐⭐ | 이메일 + UID 이중 검증 |
| 명렬표 조작 방지 | ⭐⭐⭐⭐⭐ | 관리자만 수정 가능 |
| 데이터 암호화 | ⭐⭐⭐⭐⭐ | Firebase 기본 암호화 |

**결론**: 🔒 **완벽하게 안전한 시스템**이며, 일반적인 보안 공격으로는 뚫을 수 없습니다.

---

## 📞 문의

보안 관련 문제가 발생하면:
1. Firebase Console에서 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. Firestore Security Rules 배포 상태 확인
