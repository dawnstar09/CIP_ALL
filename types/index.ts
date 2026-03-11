// 데이터 타입 정의

export type AbsenceReason = '병원' | '학원' | '동아리' | '방과후' | '기타'
export type UserRole = 'student' | 'teacher' | 'admin'

// 학생 정보 (명렬표 기반)
export interface Student {
  id: number // 학번 (번호)
  name: string
  email?: string // 구글 이메일
  studentId?: string // 실제 학번 (예: 20501)
  classId?: string // 반 ID (예: "2-5")
}

// 사용자 정보 (인증)
export interface User {
  uid: string // Firebase Auth UID
  email: string
  name: string
  role: UserRole
  classId?: string // 학생인 경우 소속 반
  photoURL?: string
}

// 야자 불참 기록
export interface Absence {
  id?: string
  classId: string // 반 ID
  studentId: number
  studentName: string
  studentEmail: string // 추가: 본인 확인용
  userId: string // Firebase Auth UID
  reason: AbsenceReason
  detail: string
  date: string
  period: 1 | 2 | 3
  createdAt: Date
  deviceInfo?: {
    userAgent: string
    platform: string
    browser: string
    os: string
  }
}

export interface AttendanceStatus {
  studentId: number
  isPresent: boolean
  absence?: Absence
}

export interface ClassAttendance {
  classNumber: number
  date: string
  period: 1 | 2 | 3
  students: AttendanceStatus[]
}

// 반 정보
export interface ClassInfo {
  id: string // 예: "2-5"
  grade: number
  classNumber: number
  name: string // 예: "2학년 5반"
  teacherIds?: string[] // 담임교사 UID
}
