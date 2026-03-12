'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import type { Student, Absence, AbsenceReason } from '@/types'
import ClassGuard from '@/components/ClassGuard'
import { useAuth } from '@/lib/auth-context'

interface PageProps {
  params: {
    id: string
  }
}

export default function AddPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)
  const router = useRouter()
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedPeriods, setSelectedPeriods] = useState<(1 | 2 | 3)[]>([1])
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | null>(null)
  const [detail, setDetail] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [myStudentInfo, setMyStudentInfo] = useState<{ id: number; name: string } | null>(null)

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']
  
  const periodTimes = {
    1: '16:50-17:40',
    2: '18:40-20:00',
    3: '20:10-21:00'
  }

  useEffect(() => {
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
    
    // 5반은 35명, 6반은 34명, 다른 반은 36명
    let studentCount = 36
    let nameList: string[] = []
    
    if (classNumber === 5) {
      studentCount = 35
      nameList = class5Names
    } else if (classNumber === 6) {
      studentCount = 34
      nameList = class6Names
    }
    
    const studentList: Student[] = Array.from({ length: studentCount }, (_, i) => ({
      id: i + 1,
      name: nameList.length > 0 ? nameList[i] : `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [classNumber])

  // 학생 role인 경우 본인 정보 가져오기
  useEffect(() => {
    async function fetchMyStudentInfo() {
      if (!user || user.role !== 'student' || !user.email) return
      
      try {
        const studentDoc = await getDoc(
          doc(db, 'classes', `2-${classNumber}`, 'students', user.email)
        )
        
        if (studentDoc.exists()) {
          const data = studentDoc.data()
          const studentInfo = {
            id: data.id,
            name: data.name
          }
          setMyStudentInfo(studentInfo)
          setSelectedStudent(data.id) // 자동으로 본인 선택
        }
      } catch (error) {
        console.error('학생 정보 로드 실패:', error)
      }
    }
    
    fetchMyStudentInfo()
  }, [user, classNumber])

  const togglePeriod = (period: 1 | 2 | 3) => {
    if (selectedPeriods.includes(period)) {
      if (selectedPeriods.length > 1) {
        setSelectedPeriods(selectedPeriods.filter(p => p !== period))
      }
    } else {
      setSelectedPeriods([...selectedPeriods, period].sort())
    }
  }

  const getDeviceInfo = () => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'

    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return { userAgent: ua, platform: navigator.platform, browser, os }
  }

  const handleSubmit = async () => {
    // 학생인 경우 본인 정보만 추가 가능하도록 검증
    if (user?.role === 'student') {
      if (!myStudentInfo) {
        alert('학생 정보를 불러올 수 없습니다.')
        return
      }
      if (selectedStudent !== myStudentInfo.id) {
        alert('본인의 불참만 추가할 수 있습니다.')
        return
      }
    }
    
    if (!selectedStudent) {
      alert('학생을 선택하세요')
      return
    }
    if (selectedPeriods.length === 0) {
      alert('차시를 최소 1개 선택하세요')
      return
    }
    if (!selectedReason) {
      alert('불참 사유를 선택하세요')
      return
    }
    if ((selectedReason === '동아리' || selectedReason === '방과후') && !detail) {
      alert('상세 사유를 입력하세요')
      return
    }

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) return

    try {
      const deviceInfo = getDeviceInfo()
      
      for (const period of selectedPeriods) {
        await addDoc(collection(db, 'absences'), {
          classNumber,
          studentId: selectedStudent,
          studentName: student.name,
          reason: selectedReason,
          detail: detail,
          date: currentDate,
          period: period,
          createdAt: new Date(),
          deviceInfo
        })
      }
      
      const periodsText = selectedPeriods.map(p => `${p}차시`).join(', ')
      alert(`${student.name}(${student.id}번) ${periodsText} 불참 기록이 추가되었습니다`)
      router.push(`/class/${classNumber}/current`)
    } catch (error) {
      console.error('불참 추가 실패:', error)
      alert('불참 정보를 추가하는데 실패했습니다.')
    }
  }

  return (
    <ClassGuard classId={`2-${classNumber}`}>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href={`/class/${classNumber}`}
            className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
          >
            ← 뒤로
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            야자 불참 추가
          </h1>
        </div>

        <div className="bg-white rounded-lg p-5 sm:p-6 md:p-8 shadow-md space-y-6 sm:space-y-8">
          {/* 날짜 선택 */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              날짜
            </label>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
            />
          </div>

          {/* 차시 선택 */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              차시 선택 (복수 선택 가능)
            </label>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => togglePeriod(period as 1 | 2 | 3)}
                  className={`px-4 py-5 rounded-lg font-bold transition-colors touch-manipulation ${
                    selectedPeriods.includes(period as 1 | 2 | 3)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 active:bg-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base sm:text-lg">{period}차시</div>
                    <div className="text-xs sm:text-sm mt-2 opacity-75">
                      {periodTimes[period as 1 | 2 | 3]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 학생 선택 */}
          {user?.role === 'student' ? (
            // 학생인 경우: 본인 정보만 표시
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                학생 정보
              </label>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                {myStudentInfo ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{myStudentInfo.name}</div>
                    <div className="text-lg text-blue-700 mt-2">{myStudentInfo.id}번</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">정보를 불러오는 중...</div>
                )}
              </div>
            </div>
          ) : (
            // 교사/관리자인 경우: 모든 학생 선택 가능
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                학생 선택
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-3 max-h-80 overflow-y-auto p-3 sm:p-4 border-2 border-gray-300 rounded-lg">
                {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudent(student.id)}
                  className={`p-3 rounded-lg font-bold transition-colors touch-manipulation min-h-[60px] ${
                    selectedStudent === student.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {classNumber === 5 ? (
                    <div className="flex flex-col items-center text-center leading-tight">
                      <span className="text-sm font-bold">{student.name}</span>
                      <span className="text-xs opacity-75 mt-0.5">({student.id})</span>
                    </div>
                  ) : (
                    student.id
                  )}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* 불참 사유 선택 */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              불참 사유
            </label>
            <div className="space-y-3 sm:space-y-4">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason)
                    if (reason !== '동아리' && reason !== '방과후') {
                      setDetail('')
                    }
                  }}
                  className={`w-full px-5 py-4 rounded-lg font-bold transition-colors text-left touch-manipulation ${
                    selectedReason === reason
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 사유 입력 */}
          {(selectedReason === '동아리' || selectedReason === '방과후' || selectedReason === '기타') && (
            <div>
              <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                {selectedReason === '동아리' ? '동아리명' : selectedReason === '방과후' ? '방과후 과목' : '상세 사유'}
              </label>
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={
                  selectedReason === '동아리' 
                    ? '예: 과학동아리' 
                    : selectedReason === '방과후'
                    ? '예: 수학 심화'
                    : '상세 사유를 입력하세요'
                }
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-5 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 font-bold rounded-lg transition-colors touch-manipulation text-base sm:text-lg"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition-colors touch-manipulation text-base sm:text-lg shadow-lg"
            >
              추가
            </button>
          </div>
        </div>
      </div>
      </div>
    </ClassGuard>
  )
}
