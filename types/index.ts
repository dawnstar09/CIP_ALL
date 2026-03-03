// 데이터 타입 정의

export type AbsenceReason = '병원' | '학원' | '동아리' | '방과후' | '기타'

export interface Student {
  id: number
  name: string
}

export interface Absence {
  id?: string
  studentId: number
  studentName: string
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
