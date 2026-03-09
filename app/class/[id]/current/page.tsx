'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import type { Absence, Student, AttendanceStatus } from '@/types'

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
    // 5반 학생 명단
    const class5Names = [
      '고원세', '곽도영', '권도현', '김다원', '김도현', '김동윤', '김동하', '김아인',
      '김영광', '김준혁', '김태훈', '박정후', '박찬', '박찬빈', '방지우', '손동현',
      '엄도현', '윤영인', '이건희', '이민조', '이시우', '이인수', '이주환', '이준성',
      '이태성', '장연진', '장희원', '전우재', '정유찬', '조한검', '최준표', '최현서',
      '한상휘', '허원', '황인환'
    ]
    
    const studentList: Student[] = Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      name: classNumber === 5 && i < 35 ? class5Names[i] : `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [classNumber])

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
    <div className="h-screen bg-gray-50 p-2 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/class/${classNumber}`}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg transition-colors text-sm touch-manipulation"
          >
            ← 뒤로
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            2학년 {classNumber}반 야자 현황
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={() => router.push(`/class/${classNumber}/add`)}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg transition-colors shadow-lg touch-manipulation text-sm whitespace-nowrap"
          >
            ➕ 불참 추가
          </button>
        </div>
      </div>

      {/* 메인 영역: 학생 그리드 + 차시 선택 */}
      <div className="flex gap-2 flex-1 overflow-hidden min-h-0">
        {/* 학생 그리드 */}
        <div className="flex-1 bg-white p-2 rounded-lg shadow-md overflow-hidden flex flex-col min-h-0">
          <h2 className="text-sm font-bold mb-1.5 flex-shrink-0">학생 현황</h2>
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1 min-h-0">
            {students.map((student) => {
              const status = attendanceStatus.find((s) => s.studentId === student.id)
              const isPresent = status?.isPresent ?? true
              const reason = status?.absence?.reason
              const detail = status?.absence?.detail
              
              // "기타"인 경우 상세 내용 표시, 그 외에는 사유 표시
              const displayText = reason === '기타' && detail ? detail : (reason || '미입력')
              
              return (
                <button
                  key={student.id}
                  onClick={() => {
                    if (!isPresent && status?.absence) {
                      setSelectedAbsence(status.absence)
                    }
                  }}
                  className={`
                    rounded-lg font-bold text-white min-h-0
                    transition-all duration-200 shadow-md hover:shadow-xl active:scale-95
                    touch-manipulation flex items-center justify-center p-1
                    ${isPresent 
                      ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                      : 'bg-red-500 hover:bg-red-600 active:bg-red-700 cursor-pointer'
                    }
                  `}
                  disabled={isPresent}
                >
                  <div className="flex flex-col items-center justify-center">
                    {classNumber === 5 ? (
                      // 5반: 이름(번호) 형식
                      <div className="flex flex-col items-center">
                        <span className="text-base md:text-lg font-bold leading-tight">{student.name}</span>
                        <span className="text-xs opacity-80">({student.id}번)</span>
                      </div>
                    ) : (
                      // 다른 반: 번호만
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl md:text-3xl">{student.id}</span>
                        <span className="text-xs">번</span>
                      </div>
                    )}
                    {!isPresent && (
                      <div className="text-[11px] leading-tight opacity-90 px-1 text-center break-all mt-0.5">
                        {displayText}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-3 justify-center items-center flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-700 font-medium">참가</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-700 font-medium">불참</span>
            </div>
          </div>
        </div>

        {/* 차시 선택 */}
        <div className="w-32 flex flex-col gap-2">
          <div className="text-right text-sm font-bold text-gray-800">차시</div>
          <button
            onClick={() => setCurrentPeriod(1)}
            className={`flex-1 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 flex flex-col items-center justify-center ${
              currentPeriod === 1
                ? 'bg-blue-600 ring-4 ring-blue-300'
                : 'bg-gray-400 hover:bg-gray-500'
            }`}
          >
            <div className="text-xl mb-1">1차시</div>
            <div className="text-xs opacity-90">16:50-17:40</div>
          </button>
          <button
            onClick={() => setCurrentPeriod(2)}
            className={`flex-1 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 flex flex-col items-center justify-center ${
              currentPeriod === 2
                ? 'bg-blue-600 ring-4 ring-4 ring-blue-300'
                : 'bg-gray-400 hover:bg-gray-500'
            }`}
          >
            <div className="text-xl mb-1">2차시</div>
            <div className="text-xs opacity-90">18:40-20:00</div>
          </button>
          <button
            onClick={() => setCurrentPeriod(3)}
            className={`flex-1 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 flex flex-col items-center justify-center ${
              currentPeriod === 3
                ? 'bg-blue-600 ring-4 ring-blue-300'
                : 'bg-gray-400 hover:bg-gray-500'
            }`}
          >
            <div className="text-xl mb-1">3차시</div>
            <div className="text-xs opacity-90">20:10-21:00</div>
          </button>
        </div>
      </div>

      {/* 선택된 불참 정보 모달 */}
      {selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">📋 불참 정보</h2>
              <button
                type="button"
                onClick={() => setSelectedAbsence(null)}
                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 font-bold rounded-lg transition-colors text-sm"
              >
                닫기
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="text-lg">
                <span className="font-semibold text-gray-700">학생:</span>{' '}
                <span className="text-blue-700">{selectedAbsence.studentName}</span>
              </div>
              <div className="text-lg">
                <span className="font-semibold text-gray-700">사유:</span>{' '}
                <span className="text-gray-900">{selectedAbsence.reason}</span>
              </div>
              {selectedAbsence.detail && (
                <div className="text-lg">
                  <span className="font-semibold text-gray-700">상세:</span>{' '}
                  <span className="text-gray-900">{selectedAbsence.detail}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveAbsence(selectedAbsence)}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-lg rounded-lg transition-colors shadow-lg"
            >
              ✅ 야자 참가로 변경
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
