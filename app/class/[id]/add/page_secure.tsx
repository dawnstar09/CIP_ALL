'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import ClassGuard from '@/components/ClassGuard'
import { useAuth } from '@/lib/auth-context'
import type { Student, AbsenceReason } from '@/types'

interface PageProps {
  params: {
    id: string
  }
}

export default function AddPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)
  const classId = `2-${classNumber}`
  const router = useRouter()
  const { user } = useAuth()
  
  const [myStudent, setMyStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriods, setSelectedPeriods] = useState<(1 | 2 | 3)[]>([1])
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | null>(null)
  const [detail, setDetail] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']
  
  const periodTimes = {
    1: '16:50-17:40',
    2: '18:40-20:00',
    3: '20:10-21:00'
  }

  // 로그인한 사용자의 학생 정보 가져오기
  useEffect(() => {
    async function fetchMyStudentInfo() {
      if (!user || user.role !== 'student') {
        setLoading(false)
        return
      }

      try {
        // 명렬표에서 본인 정보 찾기
        const studentDoc = await getDoc(
          doc(db, 'classes', classId, 'students', user.email)
        )

        if (studentDoc.exists()) {
          setMyStudent(studentDoc.data() as Student)
        } else {
          alert('명렬표에 등록되지 않은 사용자입니다. 관리자에게 문의하세요.')
          router.push('/')
        }
      } catch (error) {
        console.error('학생 정보 로드 실패:', error)
        alert('학생 정보를 불러오는데 실패했습니다.')
      }

      setLoading(false)
    }

    fetchMyStudentInfo()
  }, [user, classId, router])

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
    if (!user || !myStudent) {
      alert('사용자 정보를 확인할 수 없습니다.')
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
          classId,
          classNumber,
          studentId: myStudent.id,
          studentName: myStudent.name,
          studentEmail: user.email, // 본인 인증용
          userId: user.uid, // Firebase Auth UID
          reason: selectedReason,
          detail: detail,
          date: currentDate,
          period: period,
          createdAt: new Date(),
          deviceInfo
        })
      }
      
      const periodsText = selectedPeriods.map(p => `${p}차시`).join(', ')
      alert(`${myStudent.name}(${myStudent.id}번) ${periodsText} 불참 기록이 추가되었습니다`)
      router.push(`/class/${classNumber}/current`)
    } catch (error: any) {
      console.error('불참 추가 실패:', error)
      if (error.code === 'permission-denied') {
        alert('⚠️ 본인의 야자만 추가할 수 있습니다. (Security Rules)')
      } else {
        alert('불참 정보를 추가하는데 실패했습니다.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">학생 정보 확인 중...</p>
        </div>
      </div>
    )
  }

  // 교사/관리자는 다른 UI 필요 (추후 구현)
  if (!myStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-lg text-gray-700 mb-4">
            학생 전용 페이지입니다.
          </p>
          <Link
            href={`/class/${classNumber}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ClassGuard classId={classId}>
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

          {/* 본인 정보 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-bold text-gray-800">
                  {myStudent.name} ({myStudent.id}번)
                </p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              🔒 본인의 야자 불참만 추가할 수 있습니다
            </p>
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
