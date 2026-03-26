'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import type { Student, AbsenceReason } from '@/types'
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedPeriods, setSelectedPeriods] = useState<(1 | 2 | 3)[]>([1])
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | null>(null)
  const [detail, setDetail] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [myStudentInfo, setMyStudentInfo] = useState<{ id: number; name: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']
  
  const periodTimes = {
    1: '16:50-17:40',
    2: '18:40-20:00',
    3: '20:10-21:00'
  }

  // 학생 목록 로드
  useEffect(() => {
    const class2Names = [
      '강원우', '강한결', '김민섭', '김태민', '박건호', '박상효', '박현규', '석지환',
      '신준우', '신현우', '안우찬', '양기준', '양준식', '오채운', '우현호', '윤종홍',
      '이성현', '이승재', '이준상', '이중희', '임문선', '임은찬', '임정우', '임희준',
      '장재원', '장진우', '전우준', '정경준', '정재욱', '조영진', '조하률', '조하빈',
      '차민준', '천정욱', '최연우', '최윤호'
    ]
    
    const class3Names = [
      '고정현', '권오현', '김가빈', '김건우', '김민성', '김민재', '김선준', '김준우',
      '김채원', '김태민', '김현서', '김형준', '문서준', '박민준', '박준이', '박지환',
      '방준서', '서도훈', '석진오', '손우린', '오태윤', '우승엽', '유어진', '이민혁',
      '이성민', '이승준', '이승훈', '이재성', '이채환', '장래겸', '장우진', '전재신',
      '정현우', '조성윤', '조승찬', '최승호'
    ]
    
    const class4Names = [
      '김기덕', '김대겸', '김도현', '김민준', '김성윤', '김시온', '김연우', '김재민',
      '김재윤', '김종규', '김태환', '노승민', '박경돈', '박준형', '박태정', '송영준',
      '신효섭', '심동원', '안호재', '오승민', '오시훈', '유재민', '이규성', '이승헌',
      '이주안', '정승원', '조유신', '지선우', '천태양', '최성현', '추유찬', '황규탁',
      '황서준', '황찬영', '황태민'
    ]
    
    const class5Names = [
      '고원세', '곽도영', '권도현', '김다원', '김도현', '김동윤', '김동하', '김아인',
      '김영광', '김준혁', '김태훈', '박정후', '박찬', '박찬빈', '방지우', '손동현',
      '엄도현', '윤영인', '이건희', '이민주', '이시우', '이인수', '이주환', '이준성',
      '이태성', '장연진', '장희원', '전우재', '정유찬', '조한겸', '최준표', '최현서',
      '한상휘', '허원', '황인환'
    ]
    
    const class6Names = [
      '강주형', '고진용', '권율', '김경민', '김경태', '김용준', '김제겸', '김지효',
      '김하윤', '김현성', '목지안', '백시우', '서재훈', '서지후', '성무빈', '송재호',
      '신예준', '신준모', '양서희', '오태진', '윤수찬', '윤정연', '윤하유', '이지성',
      '이지혁', '이지후', '전윤우', '정준기', '정하율', '조동현', '차이한', '최담호',
      '최유진', '최태웅'
    ]
    
    const class7Names = [
      '강건', '강류헌', '강세훈', '강우빈', '구동하', '김건희', '김민혁', '김은성',
      '김준희', '김태율', '김태호', '김현', '김현식', '문강윤', '박민규', '박시우',
      '박주은', '박준성', '박지윤', '배준휘', '안동준', '엄현식', '유이준', '윤서준',
      '이경민', '이남주', '이종승', '이현서', '임강현', '임성주', '장재민', '장해찬',
      '조성재', '조현빈', '황성연'
    ]
    
    const class8Names = [
      '강유진', '고동민', '권민준', '권영민', '기호준', '길승재', '김민범', '김범서',
      '김상준', '김신', '김예준', '김지후', '나기현', '민승기', '15번 학생', '신민호',
      '염민준', '윤준원', '이건희', '이권우', '이승훈', '이준현', '임지원', '전재원',
      '전희재', '정우성', '조윤찬', '지민건', '진찬종', '최동현', '최온유', '최윤우',
      '최진명', '허선호', '황동규'
    ]
    
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
      studentCount = 35
      nameList = class8Names
    }
    
    const studentList: Student[] = Array.from({ length: studentCount }, (_, i) => ({
      id: i + 1,
      name: nameList.length > 0 ? nameList[i] : `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [classNumber])

  // 로그인 체크
  useEffect(() => {
    if (user === null) {
      alert('로그인이 필요한 기능입니다')
      router.push('/')
    } else {
      // 관리자 체크
      if (user.email?.toLowerCase() === 'dawnstar09@naver.com') {
        setIsAdmin(true)
      }
    }
  }, [user, router])

  // 로그인한 학생의 정보 가져오기 (관리자가 아닌 경우만)
  useEffect(() => {
    async function fetchMyStudentInfo() {
      if (!user || !user.email || isAdmin) return
      
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
        } else {
          alert('학생 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
          router.push('/')
        }
      } catch (error) {
        console.error('학생 정보 로드 실패:', error)
        alert('학생 정보를 불러올 수 없습니다.')
        router.push('/')
      }
    }
    
    fetchMyStudentInfo()
  }, [user, classNumber, router, isAdmin])

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
    // 학생 정보 확인
    const targetStudent = isAdmin ? selectedStudent : myStudentInfo
    
    if (!targetStudent) {
      alert(isAdmin ? '학생을 선택하세요' : '학생 정보를 불러올 수 없습니다.')
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

    try {
      const deviceInfo = getDeviceInfo()
      
      for (const period of selectedPeriods) {
        await addDoc(collection(db, 'absences'), {
          classNumber,
          studentId: targetStudent.id,
          studentName: targetStudent.name,
          studentEmail: user?.email || '',
          reason: selectedReason,
          detail: detail,
          date: currentDate,
          period: period,
          createdAt: new Date(),
          deviceInfo
        })
      }
      
      const periodsText = selectedPeriods.map(p => `${p}차시`).join(', ')
      alert(`${targetStudent.name}(${targetStudent.id}번) ${periodsText} 불참 기록이 추가되었습니다`)
      router.push(`/class/${classNumber}/current`)
    } catch (error) {
      console.error('불참 추가 실패:', error)
      alert('불참 정보를 추가하는데 실패했습니다.')
    }
  }

  return (
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
          {isAdmin && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
              관리자
            </span>
          )}
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

          {/* 학생 정보 */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              학생 정보
            </label>
            
            {isAdmin ? (
              /* 관리자: 전체 학생 선택 그리드 */
              <>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`px-3 py-4 rounded-lg font-bold transition-colors text-center touch-manipulation ${
                        selectedStudent?.id === student.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      <div className="text-xs sm:text-sm">{student.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{student.id}번</div>
                    </button>
                  ))}
                </div>
                {selectedStudent && (
                  <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-900">선택됨: {selectedStudent.name}</div>
                      <div className="text-md text-blue-700 mt-1">{selectedStudent.id}번</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 일반 학생: 본인 정보만 표시 */
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                {myStudentInfo ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{myStudentInfo.name}</div>
                    <div className="text-lg text-blue-700 mt-2">{myStudentInfo.id}번</div>
                    <div className="text-sm text-blue-600 mt-2">{user?.email}</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">정보를 불러오는 중...</div>
                )}
              </div>
            )}
          </div>

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
  )
}
