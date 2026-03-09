'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import type { Absence, Student, AttendanceStatus, AbsenceReason } from '@/types'

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
  const [filterType, setFilterType] = useState<'all' | 'present' | 'absent' | 'reason'>('all')
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editReason, setEditReason] = useState<AbsenceReason | ''>('')
  const [editDetail, setEditDetail] = useState('')

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']

  useEffect(() => {
    // 5반 학생 명단
    const class5Names = [
      '고원세', '곽도영', '권도현', '김다원', '김도현', '김동윤', '김동하', '김아인',
      '김영광', '김준혁', '김태훈', '박정후', '박찬', '박찬빈', '방지우', '손동현',
      '엄도현', '윤영인', '이건희', '이민주', '이시우', '이인수', '이주환', '이준성',
      '이태성', '장연진', '장희원', '전우재', '정유찬', '조한겸', '최준표', '최현서',
      '한상휘', '허원', '황인환'
    ]
    
    // 5반은 35명, 다른 반은 36명
    const studentCount = classNumber === 5 ? 35 : 36
    const studentList: Student[] = Array.from({ length: studentCount }, (_, i) => ({
      id: i + 1,
      name: classNumber === 5 ? class5Names[i] : `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [classNumber])

  // 차시 자동 업데이트 제거 - 초기 로드 시에만 현재 시간대 차시로 설정됨

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
        setSelectedAbsence(null)
      }
    } catch (error) {
      console.error('불참 삭제 실패:', error)
      alert('변경에 실패했습니다.')
    }
  }

  const handleEditAbsence = async () => {
    if (!selectedAbsence?.id || !editReason) {
      alert('사유를 선택하세요')
      return
    }

    if ((editReason === '동아리' || editReason === '방과후' || editReason === '기타') && !editDetail) {
      alert('상세 사유를 입력하세요')
      return
    }

    try {
      await updateDoc(doc(db, 'absences', selectedAbsence.id), {
        reason: editReason,
        detail: editDetail
      })
      alert('수정되었습니다')
      setIsEditing(false)
      setSelectedAbsence(null)
    } catch (error) {
      console.error('불참 수정 실패:', error)
      alert('수정에 실패했습니다.')
    }
  }

  const startEditing = (absence: Absence) => {
    setIsEditing(true)
    setEditReason(absence.reason)
    setEditDetail(absence.detail || '')
  }

  // 필터링된 학생 목록
  const filteredStudents = students.filter((student) => {
    const status = attendanceStatus.find((s) => s.studentId === student.id)
    const isPresent = status?.isPresent ?? true
    const reason = status?.absence?.reason

    if (filterType === 'all') return true
    if (filterType === 'present') return isPresent
    if (filterType === 'absent') return !isPresent
    if (filterType === 'reason' && selectedReasonFilter) {
      return !isPresent && reason === selectedReasonFilter
    }
    return true
  })

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
          {/* 필터 드롭다운 */}
          <select
            value={filterType === 'reason' ? `reason:${selectedReasonFilter}` : filterType}
            onChange={(e) => {
              const value = e.target.value
              if (value.startsWith('reason:')) {
                setFilterType('reason')
                setSelectedReasonFilter(value.replace('reason:', ''))
              } else {
                setFilterType(value as 'all' | 'present' | 'absent')
                setSelectedReasonFilter(null)
              }
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="all">전체</option>
            <option value="present">출석자만</option>
            <option value="absent">불참자만</option>
            <option value="reason:병원">병원만</option>
            <option value="reason:학원">학원만</option>
            <option value="reason:동아리">동아리만</option>
            <option value="reason:방과후">방과후만</option>
            <option value="reason:기타">기타만</option>
          </select>
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
          <h2 className="text-sm font-bold mb-1.5 flex-shrink-0">학생 현황 ({filteredStudents.length}명)</h2>
          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1 min-h-0">
            {students.map((student) => {
              const status = attendanceStatus.find((s) => s.studentId === student.id)
              const isPresent = status?.isPresent ?? true
              const reason = status?.absence?.reason
              const detail = status?.absence?.detail
              
              // 필터링 확인
              const shouldShow = filteredStudents.some(s => s.id === student.id)
              
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
                  style={{ visibility: shouldShow ? 'visible' : 'hidden' }}
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
                      <div className="text-[15px] leading-tight opacity-90 px-1 text-center break-all mt-0.5">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">📋 불참 정보</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedAbsence(null)
                  setIsEditing(false)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {!isEditing ? (
              // 보기 모드
              <>
                <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-600">학생</span>
                    <span className="font-semibold text-gray-900">{selectedAbsence.studentName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-600">사유</span>
                    <span className="font-semibold text-gray-900">{selectedAbsence.reason}</span>
                  </div>
                  {selectedAbsence.detail && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">상세</span>
                      <span className="font-semibold text-gray-900">{selectedAbsence.detail}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(selectedAbsence)}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    수정하기
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAbsence(selectedAbsence)}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    재참가
                  </button>
                </div>
              </>
            ) : (
              // 수정 모드
              <>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">학생: </span>
                    <span className="font-semibold text-gray-900">{selectedAbsence.studentName}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      불참 사유
                    </label>
                    <select
                      value={editReason}
                      onChange={(e) => {
                        setEditReason(e.target.value as AbsenceReason)
                        if (e.target.value !== '동아리' && e.target.value !== '방과후' && e.target.value !== '기타') {
                          setEditDetail('')
                        }
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">선택하세요</option>
                      {reasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(editReason === '동아리' || editReason === '방과후' || editReason === '기타') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        상세 사유
                      </label>
                      <input
                        type="text"
                        value={editDetail}
                        onChange={(e) => setEditDetail(e.target.value)}
                        placeholder="상세 내용을 입력하세요"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleEditAbsence}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    저장
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
