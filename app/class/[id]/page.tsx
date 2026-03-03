'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import type { Absence, Student, AttendanceStatus } from '@/types'
import StudentGrid from '@/components/StudentGrid'
import AbsenceModal from '@/components/AbsenceModal'
import PeriodSelector from '@/components/PeriodSelector'

interface PageProps {
  params: {
    id: string
  }
}

// 현재 시간에 맞는 야자 차시를 계산하는 함수
const getCurrentPeriod = (): 1 | 2 | 3 => {
  const now = new Date()
  // 한국 시간으로 변환
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const hours = koreaTime.getHours()
  const minutes = koreaTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  // 16:50~17:40 → 1차시 (1010~1060분)
  if (timeInMinutes >= 1010 && timeInMinutes < 1060) {
    return 1
  }
  // 18:40~20:00 → 2차시 (1120~1200분)
  else if (timeInMinutes >= 1120 && timeInMinutes < 1200) {
    return 2
  }
  // 20:10~21:00 → 3차시 (1210~1260분)
  else if (timeInMinutes >= 1210 && timeInMinutes < 1260) {
    return 3
  }
  // 그 외 시간은 1차시 기본값
  return 1
}

export default function ClassPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)
  const [currentPeriod, setCurrentPeriod] = useState<1 | 2 | 3>(getCurrentPeriod())
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus[]>([])
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)
  const [viewMode, setViewMode] = useState<'current' | 'statistics'>('current')

  // 학생 데이터 초기화 (36명)
  useEffect(() => {
    const studentList: Student[] = Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      name: `${i + 1}번 학생`
    }))
    setStudents(studentList)
  }, [])

  // 1분마다 현재 차시를 자동으로 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const newPeriod = getCurrentPeriod()
      setCurrentPeriod(newPeriod)
    }, 60000) // 1분마다 체크

    return () => clearInterval(interval)
  }, [])

  // 출결 데이터 로드
  useEffect(() => {
    loadAttendance()
  }, [classNumber, currentDate, currentPeriod])

  const loadAttendance = async () => {
    try {
      const q = query(
        collection(db, 'absences'),
        where('classNumber', '==', classNumber),
        where('date', '==', currentDate),
        where('period', '==', currentPeriod)
      )
      
      const querySnapshot = await getDocs(q)
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

      // 출석 상태 설정
      const status: AttendanceStatus[] = students.map((student) => {
        const absence = absences.find((a) => a.studentId === student.id)
        return {
          studentId: student.id,
          isPresent: !absence,
          absence: absence
        }
      })

      setAttendanceStatus(status)
    } catch (error) {
      console.error('출결 데이터 로드 실패:', error)
      // Firebase가 설정되지 않았을 경우 기본값
      const status: AttendanceStatus[] = students.map((student) => ({
        studentId: student.id,
        isPresent: true
      }))
      setAttendanceStatus(status)
    }
  }

  // 디바이스 정보 수집 함수
  const getDeviceInfo = () => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    // 브라우저 감지
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'Internet Explorer'

    // OS 감지
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return {
      userAgent: ua,
      platform: navigator.platform,
      browser,
      os
    }
  }

  const handleAddAbsence = async (absences: Omit<Absence, 'createdAt'>[]) => {
    try {
      const deviceInfo = getDeviceInfo()
      
      // 모든 차시에 대해 불참 기록 추가
      for (const absence of absences) {
        await addDoc(collection(db, 'absences'), {
          ...absence,
          classNumber,
          date: currentDate,
          createdAt: new Date(),
          deviceInfo
        })
      }
      
      await loadAttendance()
      setShowAbsenceModal(false)
    } catch (error) {
      console.error('불참 추가 실패:', error)
      alert('불참 정보를 추가하는데 실패했습니다. Firebase 설정을 확인하세요.')
    }
  }

  const handleRemoveAbsence = async (absence: Absence) => {
    if (!confirm('야자 참가로 변경하시겠습니까?')) return
    
    try {
      if (absence.id) {
        await deleteDoc(doc(db, 'absences', absence.id))
        await loadAttendance()
        setSelectedAbsence(null)
      }
    } catch (error) {
      console.error('불참 삭제 실패:', error)
      alert('변경에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              ← 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              2학년 {classNumber}반 야자 관리
            </h1>
          </div>
        </div>

        {/* 뷰 모드 전환 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('current')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            현재 야자 현황
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'statistics'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            야자 통계
          </button>
        </div>

        {viewMode === 'current' ? (
          <>
            {/* 날짜 및 차시 선택 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="ml-auto">
                  <button
                    onClick={() => setShowAbsenceModal(true)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                  >
                    야자 불참 추가
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
          </>
        ) : (
          <StatisticsView
            classNumber={classNumber}
            students={students}
          />
        )}
      </div>

      {/* 불참 추가 모달 */}
      {showAbsenceModal && (
        <AbsenceModal
          students={students}
          onClose={() => setShowAbsenceModal(false)}
          onSubmit={handleAddAbsence}
        />
      )}

      {/* 불참 상세 모달 */}
      {selectedAbsence && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAbsence(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">불참 정보</h2>
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-semibold">학생:</span> {selectedAbsence.studentName}
              </div>
              <div>
                <span className="font-semibold">사유:</span> {selectedAbsence.reason}
              </div>
              {selectedAbsence.detail && (
                <div>
                  <span className="font-semibold">상세:</span> {selectedAbsence.detail}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRemoveAbsence(selectedAbsence)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                다시 야자 참가하기
              </button>
              <button
                onClick={() => setSelectedAbsence(null)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 통계 뷰 컴포넌트
function StatisticsView({ classNumber, students }: { classNumber: number; students: Student[] }) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [statistics, setStatistics] = useState<any[]>([])
  const [filteredStats, setFilteredStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  
  // 필터
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 자동 조회 (컴포넌트 마운트 시)
  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    if (!startDate) {
      alert('시작 날짜를 선택하세요')
      return
    }

    setLoading(true)
    try {
      const q = query(
        collection(db, 'absences'),
        where('classNumber', '==', classNumber),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
      
      const querySnapshot = await getDocs(q)
      const absences: any[] = []
      
      querySnapshot.forEach((document) => {
        const data = document.data()
        absences.push({
          id: document.id,
          ...data
        })
      })

      // 날짜순으로 정렬
      absences.sort((a, b) => b.date.localeCompare(a.date))
      
      setStatistics(absences)
      setFilteredStats(absences)
    } catch (error) {
      console.error('통계 로드 실패:', error)
      alert('통계를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 필터 적용
  useEffect(() => {
    let filtered = [...statistics]

    // 학생별 필터
    if (selectedStudent) {
      filtered = filtered.filter(item => item.studentId === selectedStudent)
    }

    // 차시별 필터
    if (selectedPeriod) {
      filtered = filtered.filter(item => item.period === selectedPeriod)
    }

    // 사유별 필터
    if (selectedReason) {
      filtered = filtered.filter(item => item.reason === selectedReason)
    }

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.studentName.includes(searchQuery) ||
        item.reason.includes(searchQuery) ||
        (item.detail && item.detail.includes(searchQuery))
      )
    }

    setFilteredStats(filtered)
  }, [statistics, selectedStudent, selectedPeriod, selectedReason, searchQuery])

  // 통계 계산
  const totalAbsences = filteredStats.length
  const period1Count = filteredStats.filter(item => item.period === 1).length
  const period2Count = filteredStats.filter(item => item.period === 2).length
  const period3Count = filteredStats.filter(item => item.period === 3).length

  // 사유별 통계
  const reasonStats = filteredStats.reduce((acc: any, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1
    return acc
  }, {})

  // 학생별 통계
  const studentStats = filteredStats.reduce((acc: any, item) => {
    if (!acc[item.studentId]) {
      acc[item.studentId] = {
        name: item.studentName,
        count: 0
      }
    }
    acc[item.studentId].count++
    return acc
  }, {})

  const topStudents = Object.entries(studentStats)
    .sort((a: any, b: any) => b[1].count - a[1].count)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 필터 및 검색 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">야자 통계</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 날짜 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 날짜
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 차시 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              차시
            </label>
            <select
              value={selectedPeriod || ''}
              onChange={(e) => setSelectedPeriod(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 차시</option>
              <option value="1">1차시</option>
              <option value="2">2차시</option>
              <option value="3">3차시</option>
            </select>
          </div>

          {/* 학생 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생
            </label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 학생</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.id}번 학생
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 사유 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사유
            </label>
            <select
              value={selectedReason || ''}
              onChange={(e) => setSelectedReason(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 사유</option>
              <option value="병원">병원</option>
              <option value="학원">학원</option>
              <option value="동아리">동아리</option>
              <option value="방과후">방과후</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 사유 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={loadStatistics}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? '로딩 중...' : '조회'}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-2">총 불참 횟수</div>
          <div className="text-3xl font-bold text-blue-600">{totalAbsences}회</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-2">야자 1차시 불참</div>
          <div className="text-3xl font-bold text-blue-600">{period1Count}회</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-2">야자 2차시 불참</div>
          <div className="text-3xl font-bold text-blue-600">{period2Count}회</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-2">야자 3차시 불참</div>
          <div className="text-3xl font-bold text-blue-600">{period3Count}회</div>
        </div>
      </div>

      {/* 사유별 통계 */}
      {Object.keys(reasonStats).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">불참 사유 TOP 5</h3>
          <div className="space-y-2">
            {Object.entries(reasonStats)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 5)
              .map(([reason, count]: any) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-gray-700">{reason}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / totalAbsences) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {count}회
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 상세 테이블 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">상세 기록</h3>
        
        {filteredStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    차시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사유
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록 기기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStats.map((absence, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {absence.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      야자 {absence.period}차시
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {absence.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {absence.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {absence.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {absence.detail || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {absence.deviceInfo ? (
                        <div className="flex items-center gap-1">
                          <span>💻</span>
                          <span>{absence.deviceInfo.browser} / {absence.deviceInfo.os}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedRecord(absence)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            {loading ? '로딩 중...' : '검색 결과가 없습니다'}
          </p>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">불참 상세 정보</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">날짜</div>
                  <div className="text-lg font-semibold">{selectedRecord.date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">차시</div>
                  <div className="text-lg font-semibold">야자 {selectedRecord.period}차시</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">학생 이름</div>
                  <div className="text-lg font-semibold">{selectedRecord.studentName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">학생 번호</div>
                  <div className="text-lg font-semibold text-blue-600">{selectedRecord.studentId}번</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">불참 사유</div>
                <div className="text-lg font-semibold">{selectedRecord.reason}</div>
                {selectedRecord.detail && (
                  <div className="mt-1 text-gray-700">{selectedRecord.detail}</div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">📱 등록 기기 정보</h3>
                {selectedRecord.deviceInfo ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">브라우저:</span>
                      <span className="font-medium">{selectedRecord.deviceInfo.browser}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">운영체제:</span>
                      <span className="font-medium">{selectedRecord.deviceInfo.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">플랫폼:</span>
                      <span className="font-medium">{selectedRecord.deviceInfo.platform}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-500">User Agent:</div>
                      <div className="text-xs text-gray-600 mt-1 break-all">
                        {selectedRecord.deviceInfo.userAgent}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    기기 정보가 기록되지 않았습니다
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-600">등록 시간</div>
                <div className="text-lg font-semibold">
                  {selectedRecord.createdAt ? new Date(selectedRecord.createdAt.seconds * 1000).toLocaleString('ko-KR') : '-'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
