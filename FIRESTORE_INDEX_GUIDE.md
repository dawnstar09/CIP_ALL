# Firestore 인덱스 생성 가이드

## 🔥 "The query requires an index" 오류 해결

통계 페이지에서 데이터를 조회할 때 이 오류가 발생하는 것은 정상입니다. Firestore는 복합 쿼리(여러 필드를 동시에 사용하는 쿼리)를 실행할 때 인덱스가 필요합니다.

## ✅ 해결 방법 (3분 소요)

### 1단계: 오류 메시지 확인

브라우저 개발자 도구(F12)를 열면 다음과 같은 오류가 표시됩니다:

```
FirebaseError: The query requires an index. 
You can create it here: https://console.firebase.google.com/v1/r/project/...
```

### 2단계: 인덱스 생성

**방법 1: 자동 링크 사용 (가장 빠름)**

1. 오류 메시지의 **링크를 Ctrl+클릭** (새 탭에서 열림)
2. Firebase Console의 인덱스 생성 페이지가 자동으로 열림
3. 필드가 이미 설정되어 있음:
   - `classNumber` (오름차순)
   - `date` (오름차순)
4. **"인덱스 만들기"** 버튼 클릭
5. 완료!

**방법 2: 수동 생성**

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: `cip-all`
3. 왼쪽 메뉴: **빌드 > Firestore Database**
4. 상단 탭: **인덱스**
5. **"복합 인덱스 추가"** 클릭
6. 설정:
   ```
   컬렉션 ID: absences
   
   필드 추가:
   - classNumber: 오름차순
   - date: 오름차순
   
   쿼리 범위: 컬렉션
   ```
7. **"인덱스 만들기"** 클릭

### 3단계: 인덱스 빌드 대기

인덱스 생성 후 상태 확인:

- 🟡 **빌드 중**: 1-2분 대기 (데이터가 많으면 더 오래 걸릴 수 있음)
- 🟢 **사용 설정됨**: 인덱스 생성 완료!

### 4단계: 통계 페이지 재시도

1. 앱으로 돌아가기
2. 통계 페이지 새로고침
3. 날짜 범위 선택 후 **"조회"** 클릭
4. 정상 작동 확인!

---

## 📊 생성된 인덱스 정보

### absences 컬렉션 인덱스

| 컬렉션 | 필드 | 정렬 | 용도 |
|--------|------|------|------|
| absences | classNumber | 오름차순 | 반별 필터링 |
| absences | date | 오름차순 | 날짜 범위 조회 |

이 인덱스는 다음 쿼리를 지원합니다:
```typescript
query(
  collection(db, 'absences'),
  where('classNumber', '==', 1),
  where('date', '>=', '2026-03-01'),
  where('date', '<=', '2026-03-31')
)
```

---

## ❓ 자주 묻는 질문

### Q1: 인덱스를 꼭 만들어야 하나요?

**A**: 네, 통계 페이지를 사용하려면 필수입니다. 하지만 **한 번만 생성**하면 되며, 이후에는 자동으로 사용됩니다.

### Q2: 인덱스 생성에 비용이 드나요?

**A**: Firestore 무료 할당량 내에서는 무료입니다. 소규모 프로젝트는 무료 범위 내에서 충분히 사용 가능합니다.

### Q3: 인덱스 생성이 오래 걸립니다.

**A**: 
- 데이터가 없거나 적으면: 1-2분
- 데이터가 많으면: 수 분~수십 분
- 상태가 "사용 설정됨"으로 바뀔 때까지 기다려주세요

### Q4: 다른 반을 선택해도 같은 인덱스를 사용하나요?

**A**: 네! 인덱스는 `absences` 컬렉션 전체에 적용되므로, 모든 반(1~10반)에서 동일하게 사용됩니다.

---

## 🔍 인덱스 상태 확인 방법

1. Firebase Console > Firestore Database > 인덱스
2. `absences` 컬렉션의 인덱스 확인
3. 상태:
   - ✅ **사용 설정됨**: 정상
   - 🟡 **빌드 중**: 대기 필요
   - ❌ **오류**: 다시 생성 필요

---

## 🚀 추가 인덱스 (선택사항)

필요에 따라 다음 인덱스도 추가할 수 있습니다:

### 학생별 불참 기록 조회
```
컬렉션: absences
필드:
- studentId: 오름차순
- date: 내림차순
```

### 사유별 통계
```
컬렉션: absences
필드:
- reason: 오름차순
- date: 내림차순
```

---

## 📝 참고 자료

- [Firestore 인덱스 공식 문서](https://firebase.google.com/docs/firestore/query-data/indexing)
- [복합 인덱스 가이드](https://firebase.google.com/docs/firestore/query-data/index-overview)
