'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import type { Absence, Student, AttendanceStatus } from '@/types'
import StudentGrid from '@/components/StudentGrid'
import PeriodSelector from '@/components/PeriodSelector'

interface PageProps {
  params: {
    id: string
  }
}

// 현재 시간에 맞는 야자 차시를 계산하는 함수
const getCurrentPeriod = (): 1 | 2 | 3 => {
  const now = new Date()
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const hours = koreaTime.getHours()
  const minutes = koreaTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  if (timeInMinutes >= 1010 && timeInMinutes < 1060) return 1
  else if (timeInMinutes >= 1120 && timeInMinutes < 1200) return 2
  else if (timeInMinutes >= 1210 && timeInMinutes < 1260) return 3
  return 1
}

export default function CurrentPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)
  const router = useRouter()
  const [currentPeriod, setCurrentPeriod] = useState<1 | 2 | 3>(getCurrentPeriod())
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus[]>([])
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)

  useEffect(() => {
    const studentList: Student[] = Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      name: `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (students.length === 0) return

    const q = query(
      collection(db, 'absences'),
      where('classNumber', '==', classNumber),
      where('date', '==', currentDate),
      where('period', '==', currentPeriod)
    )
    
    // 실시간 리스너 설정
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const absences: Absence[] = []
        
        querySnapshot.forEach((document) => {
          const data = document.data()
          absences.push({
            id: document.id,
            studentId: data.studentId,
            studentName: data.studentName,
            reason: data.reason,
            detail: data.detail,
            date: data.date,
            period: data.period,
            createdAt: data.createdAt
          } as Absence)
        })

        const status: AttendanceStatus[] = students.map((student) => {
          const absence = absences.find((a) => a.studentId === student.id)
          return {
            studentId: student.id,
            isPresent: !absence,
            absence: absence
          }
        })

        setAttendanceStatus(status)
      },
      (error) => {
        console.error('출결 데이터 실시간 업데이트 실패:', error)
        const status: AttendanceStatus[] = students.map((student) => ({
          studentId: student.id,
          isPresent: true
        }))
        setAttendanceStatus(status)
      }
    )

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe()
  }, [classNumber, currentDate, currentPeriod, students])

  const handleRemoveAbsence = async (absence: Absence) => {
    if (!confirm('야자 참가로 변경하시겠습니까?')) return
    
    try {
      if (absence.id) {
        await deleteDoc(doc(db, 'absences', absence.id))
        // onSnapshot이 자동으로 업데이트하므로 별도 로드 불필요
        setSelectedAbsence(null)
      }
    } catch (error) {
      console.error('불참 삭제 실패:', error)
      alert('변경에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4">
      <div className="w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/class/${classNumber}`}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg transition-colors text-sm touch-manipulation"
            >
              ← 뒤로
            </Link>
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">
              2학년 {classNumber}반 야자 현황
            </h1>
          </div>
        </div>

        {/* 날짜 및 차시 선택 */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md mb-3 md:mb-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  차시
                </label>
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button
                onClick={() => router.push(`/class/${classNumber}/add`)}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg transition-colors shadow-lg touch-manipulation text-base md:text-lg whitespace-nowrap"
              >
                ➕ 야자 불참 추가하기
              </button>
            </div>
          </div>
        </div>

        {/* 학생 그리드 */}
        <StudentGrid
          students={students}
          attendanceStatus={attendanceStatus}
          onAbsenceClick={(absence) => setSelectedAbsence(absence)}
        />

        {/* 선택된 불참 정보 (화면 하단 고정) */}
        {selectedAbsence && (
          <div className="mt-8 bg-blue-50 border-4 border-blue-500 rounded-lg p-5 sm:p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">📋 선택된 불참 정보</h2>
              <button
                type="button"
                onClick={() => setSelectedAbsence(null)}
                className="px-5 py-3 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 font-bold rounded-lg transition-colors touch-manipulation text-base sm:text-lg"
              >
                닫기
              </button>
            </div>
            <div className="space-y-5 mb-8 bg-white p-5 rounded-lg">
              <div className="text-xl sm:text-2xl">
                <span className="font-semibold text-gray-700">학생:</span>{' '}
                <span className="text-blue-700">{selectedAbsence.studentName}</span>
              </div>
              <div className="text-xl sm:text-2xl">
                <span className="font-semibold text-gray-700">사유:</span>{' '}
                <span className="text-gray-900">{selectedAbsence.reason}</span>
              </div>
              {selectedAbsence.detail && (
                <div className="text-xl sm:text-2xl">
                  <span className="font-semibold text-gray-700">상세:</span>{' '}
                  <span className="text-gray-900">{selectedAbsence.detail}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveAbsence(selectedAbsence)}
              className="w-full px-6 py-6 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-lg transition-colors touch-manipulation text-xl sm:text-2xl shadow-lg"
            >
              ✅ 다시 참가로 변경
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
