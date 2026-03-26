'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDocs, addDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
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
  const { user } = useAuth()
  const [currentPeriod, setCurrentPeriod] = useState<1 | 2 | 3>(getCurrentPeriod())
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus[]>([])
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'present' | 'absent' | 'reason'>('all')
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editReason, setEditReason] = useState<AbsenceReason | ''>('')
  const [editDetail, setEditDetail] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 2반 학생 명단 (36명)
    const class2Names = [
      '강원우', '강한결', '김민섭', '김태민', '박건호', '박상효', '박현규', '석지환',
      '신준우', '신현우', '안우찬', '양기준', '양준식', '오채운', '우현호', '윤종홍',
      '이성현', '이승재', '이준상', '이중희', '임문선', '임은찬', '임정우', '임희준',
      '장재원', '장진우', '전우준', '정경준', '정재욱', '조영진', '조하률', '조하빈',
      '차민준', '천정욱', '최연우', '최윤호'
    ]
    
    // 3반 학생 명단
    const class3Names = [
      '고정현', '권오현', '김가빈', '김건우', '김민성', '김민재', '김선준', '김준우',
      '김채원', '김태민', '김현서', '김형준', '문서준', '박민준', '박준이', '박지환',
      '방준서', '서도훈', '석진오', '손우린', '오태윤', '우승엽', '유어진', '이민혁',
      '이성민', '이승준', '이승훈', '이재성', '이채환', '장래겸', '장우진', '전재신',
      '정현우', '조성윤', '조승찬', '최승호'
    ]
    
    // 4반 학생 명단 (35명)
    const class4Names = [
      '김기덕', '김대겸', '김도현', '김민준', '김성윤', '김시온', '김연우', '김재민',
      '김재윤', '김종규', '김태환', '노승민', '박경돈', '박준형', '박태정', '송영준',
      '신효섭', '심동원', '안호재', '오승민', '오시훈', '유재민', '이규성', '이승헌',
      '이주안', '정승원', '조유신', '지선우', '천태양', '최성현', '추유찬', '황규탁',
      '황서준', '황찬영', '황태민'
    ]
    
    // 5반 학생 명단
    const class5Names = [
      '고원세', '곽도영', '권도현', '김다원', '김도현', '김동윤', '김동하', '김아인',
      '김영광', '김준혁', '김태훈', '박정후', '박찬', '박찬빈', '방지우', '손동현',
      '엄도현', '윤영인', '이건희', '이민주', '이시우', '이인수', '이주환', '이준성',
      '이태성', '장연진', '장희원', '전우재', '정유찬', '조한겸', '최준표', '최현서',
      '한상휘', '허원', '황인환'
    ]
    
    // 6반 학생 명단
    const class6Names = [
      '강주형', '고진용', '권율', '김경민', '김경태', '김용준', '김제겸', '김지효',
      '김하윤', '김현성', '목지안', '백시우', '서재훈', '서지후', '성무빈', '송재호',
      '신예준', '신준모', '양서희', '오태진', '윤수찬', '윤정연', '윤하유', '이지성',
      '이지혁', '이지후', '전윤우', '정준기', '정하율', '조동현', '차이한', '최담호',
      '최유진', '최태웅'
    ]
    
    // 7반 학생 명단
    const class7Names = [
      '강건', '강류헌', '강세훈', '강우빈', '구동하', '김건희', '김민혁', '김은성',
      '김준희', '김태율', '김태호', '김현', '김현식', '문강윤', '박민규', '박시우',
      '박주은', '박준성', '박지윤', '배준휘', '안동준', '엄현식', '유이준', '윤서준',
      '이경민', '이남주', '이종승', '이현서', '임강현', '임성주', '장재민', '장해찬',
      '조성재', '조현빈', '황성연'
    ]
    
    // 8반 학생 명단
    const class8Names = [
      '강유진', '고동민', '권민준', '권영민', '기호준', '길승재', '김민범', '김범서',
      '김상준', '김신', '김예준', '김지후', '나기현', '민승기', '15번 학생', '신민호',
      '염민준', '윤준원', '이건희', '이권우', '이승훈', '이준현', '임지원', '전재원',
      '전희재', '정우성', '조윤찬', '지민건', '진찬종', '최동현', '최온유', '최윤우',
      '최진명', '허선호', '황동규', '양승우'
    ]
    
    // 2반 36명, 3반 36명, 4반 35명, 5반 35명, 6반 34명, 7반 35명, 8반 35명, 나머지 36명
    let studentCount = 36
    let nameList: string[] = []
    
    if (classNumber === 2) {
      studentCount = 36
      nameList = class2Names
    } else if (classNumber === 3) {
      studentCount = 36
      nameList = class3Names
    } else if (classNumber === 4) {
      studentCount = 35
      nameList = class4Names
    } else if (classNumber === 5) {
      studentCount = 35
      nameList = class5Names
    } else if (classNumber === 6) {
      studentCount = 34
      nameList = class6Names
    } else if (classNumber === 7) {
      studentCount = 35
      nameList = class7Names
    } else if (classNumber === 8) {
      studentCount = 36
      nameList = class8Names
    }
    
    const studentList: Student[] = Array.from({ length: studentCount }, (_, i) => ({
      id: i + 1,
      name: nameList.length > 0 ? nameList[i] : `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [classNumber])

  // 정기 불참 자동 생성 로직
  useEffect(() => {
    async function autoGenerateRegularAbsences() {
      try {
        // 오늘 요일 확인 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
        const today = new Date(currentDate)
        const dayOfWeek = today.getDay()
        const dayNames = ['일', '월', '화', '수', '목', '금', '토']
        const todayDayName = dayNames[dayOfWeek]
        
        // 주말은 스킵
        if (dayOfWeek === 0 || dayOfWeek === 6) return
        
        // 해당 반의 모든 학생 조회
        const studentsSnapshot = await getDocs(
          collection(db, 'classes', `2-${classNumber}`, 'students')
        )
        
        // 오늘 요일에 정기 불참인 학생들 필터링
        const regularAbsentStudents = studentsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((student: any) => student.regularAbsenceDay === todayDayName)
        
        if (regularAbsentStudents.length === 0) return
        
        // 각 학생에 대해 2,3차시 불참 기록 확인 및 생성
        for (const student of regularAbsentStudents) {
          for (const period of [2, 3]) {
            // 이미 해당 날짜/차시에 기록이 있는지 확인
            const existingAbsence = await getDocs(
              query(
                collection(db, 'absences'),
                where('classNumber', '==', classNumber),
                where('studentId', '==', student.id),
                where('date', '==', currentDate),
                where('period', '==', period)
              )
            )
            
            // 기록이 없으면 자동 생성
            if (existingAbsence.empty) {
              await addDoc(collection(db, 'absences'), {
                classNumber,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                reason: '학원',
                detail: '정기 학원',
                date: currentDate,
                period: period,
                createdAt: new Date(),
                isAutoGenerated: true,
                deviceInfo: {
                  browser: 'Auto',
                  os: 'System',
                  platform: 'Auto-generate',
                  userAgent: 'Regular absence auto-generation'
                }
              })
              console.log(`✅ 자동 생성: ${student.name} - ${currentDate} ${period}차시`)
            }
          }
        }
      } catch (error) {
        console.error('정기 불참 자동 생성 실패:', error)
      }
    }
    
    autoGenerateRegularAbsences()
  }, [classNumber, currentDate])

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
    // 본인 확인 모달 표시
    setShowConfirmModal(true)
  }

  const confirmRemoveAbsence = async () => {
    if (!selectedAbsence) return
    
    // 로그인 확인
    if (!user || !user.email) {
      alert('로그인이 필요합니다.')
      return
    }
    
    // 이메일 검증 (로그인된 계정과 불참 기록의 이메일 비교)
    const currentUserEmail = user.email.trim().toLowerCase()
    const recordedEmail = selectedAbsence.studentEmail?.trim().toLowerCase()
    
    if (!recordedEmail) {
      alert('이 불참 기록에는 이메일 정보가 없습니다. 관리자에게 문의하세요.')
      return
    }
    
    if (currentUserEmail !== recordedEmail) {
      alert('본인의 불참 기록만 변경할 수 있습니다.')
      return
    }
    
    try {
      if (selectedAbsence.id) {
        await deleteDoc(doc(db, 'absences', selectedAbsence.id))
        setSelectedAbsence(null)
        setShowConfirmModal(false)
        alert('참가로 변경되었습니다.')
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
                    {classNumber === 2 || classNumber === 3 || classNumber === 4 || classNumber === 5 || classNumber === 6 || classNumber === 7 || classNumber === 8 ? (
                      // 2반, 3반, 4반, 5반, 6반, 7반, 8반: 이름(번호) 형식
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
          {/* 현재 시간 표시 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-2 text-center">
            <div className="text-xs text-blue-600 font-semibold mb-1">현재 시간</div>
            <div className="text-lg font-bold text-blue-900">
              {currentTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
          
          {/* 참가 현황 */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2 text-center">
            <div className="text-xs text-green-600 font-semibold mb-1">참가 현황</div>
            <div className="text-sm font-bold text-green-900">
              {attendanceStatus.filter(s => s.isPresent).length}/{students.length}명 참가
            </div>
          </div>
          
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

      {/* 본인 확인 모달 */}
      {showConfirmModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">✅ 참가 변경 확인</h2>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 leading-relaxed mb-3">
                  <strong>{selectedAbsence.studentName}</strong> 학생의 불참을 참가로 변경하시겠습니까?
                </p>
                <p className="text-xs text-blue-600">
                  로그인된 계정: {user?.email || '로그인 필요'}
                </p>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  ⚠️ 본인의 불참 기록만 변경할 수 있습니다.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmRemoveAbsence}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                참가로 변경
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}
