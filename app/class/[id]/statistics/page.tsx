'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import type { Student } from '@/types'

interface PageProps {
  params: {
    id: string
  }
}

export default function StatisticsPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)
  const [students, setStudents] = useState<Student[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [statistics, setStatistics] = useState<any[]>([])
  const [filteredStats, setFilteredStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isListening, setIsListening] = useState(true) // 자동 시작
  
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    if (!isListening) return

    setLoading(true)
    
    const q = query(
      collection(db, 'absences'),
      where('classNumber', '==', classNumber),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    )
    
    // 실시간 리스너 설정
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const absences: any[] = []
        
        querySnapshot.forEach((document) => {
          const data = document.data()
          absences.push({ id: document.id, ...data })
        })

        absences.sort((a, b) => b.date.localeCompare(a.date))
        
        setStatistics(absences)
        setFilteredStats(absences)
        setLoading(false)
      },
      (error) => {
        console.error('통계 실시간 업데이트 실패:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [classNumber, startDate, endDate, isListening])

  useEffect(() => {
    let filtered = [...statistics]

    if (selectedStudent) {
      filtered = filtered.filter(item => item.studentId === selectedStudent)
    }
    if (selectedPeriod) {
      filtered = filtered.filter(item => item.period === selectedPeriod)
    }
    if (selectedReason) {
      filtered = filtered.filter(item => item.reason === selectedReason)
    }
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.studentName.includes(searchQuery) ||
        item.reason.includes(searchQuery) ||
        (item.detail && item.detail.includes(searchQuery))
      )
    }

    setFilteredStats(filtered)
  }, [statistics, selectedStudent, selectedPeriod, selectedReason, searchQuery])

  const totalAbsences = filteredStats.length
  const period1Count = filteredStats.filter(item => item.period === 1).length
  const period2Count = filteredStats.filter(item => item.period === 2).length
  const period3Count = filteredStats.filter(item => item.period === 3).length

  const reasonStats = filteredStats.reduce((acc: any, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href={`/class/${classNumber}`}
            className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
          >
            ← 뒤로
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            2학년 {classNumber}반 야자 통계
          </h1>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">필터 및 검색</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                차시
              </label>
              <select
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">전체 차시</option>
                <option value="1">1차시</option>
                <option value="2">2차시</option>
                <option value="3">3차시</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                학생
              </label>
              <select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                사유
              </label>
              <select
                value={selectedReason || ''}
                onChange={(e) => setSelectedReason(e.target.value || null)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">전체 사유</option>
                <option value="병원">병원</option>
                <option value="학원">학원</option>
                <option value="동아리">동아리</option>
                <option value="방과후">방과후</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 사유 검색..."
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="text-sm sm:text-base text-gray-600 mb-2">총 불참 횟수</div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">{totalAbsences}회</div>
          </div>
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="text-sm sm:text-base text-gray-600 mb-2">1차시 불참</div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">{period1Count}회</div>
          </div>
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="text-sm sm:text-base text-gray-600 mb-2">2차시 불참</div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">{period2Count}회</div>
          </div>
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="text-sm sm:text-base text-gray-600 mb-2">3차시 불참</div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">{period3Count}회</div>
          </div>
        </div>

        {/* 사유별 통계 */}
        {Object.keys(reasonStats).length > 0 && (
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">불참 사유 TOP 5</h3>
            <div className="space-y-4 sm:space-y-5">
              {Object.entries(reasonStats)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 5)
                .map(([reason, count]: any) => (
                  <div key={reason} className="flex items-center justify-between gap-4">
                    <span className="text-base sm:text-lg text-gray-700 font-medium min-w-[80px]">{reason}</span>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${(count / totalAbsences) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm sm:text-base font-bold text-gray-900 min-w-[60px] text-right">
                        {count}회
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 상세 기록 - 모바일 카드 뷰 */}
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
          <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">상세 기록</h3>
          
          {filteredStats.length > 0 ? (
            <div className="space-y-4">
              {filteredStats.map((absence, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecord(absence)}
                  className="bg-gray-50 p-5 rounded-lg border-2 border-gray-200 active:bg-gray-100 touch-manipulation hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{absence.date}</div>
                      <div className="text-xl font-bold text-gray-800">{absence.studentName}</div>
                    </div>
                    <span className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg font-bold">
                      {absence.studentId}번
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded font-semibold">
                      {absence.period}차시
                    </span>
                    <span className="text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded font-semibold">
                      {absence.reason}
                    </span>
                  </div>
                  {absence.detail && (
                    <div className="text-base text-gray-700 mt-2">
                      {absence.detail}
                    </div>
                  )}
                  {absence.deviceInfo && (
                    <div className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">
                      💻 {absence.deviceInfo.browser} / {absence.deviceInfo.os}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12 text-lg">
              {loading ? '로딩 중...' : '검색 결과가 없습니다'}
            </p>
          )}
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-lg p-5 sm:p-6 md:p-8 max-w-2xl w-full my-4 max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">불참 상세 정보</h2>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl w-10 h-10 flex items-center justify-center touch-manipulation"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="text-sm text-gray-600 mb-1">날짜</div>
                  <div className="text-lg sm:text-xl font-bold">{selectedRecord.date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">차시</div>
                  <div className="text-lg sm:text-xl font-bold">야자 {selectedRecord.period}차시</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="text-sm text-gray-600 mb-1">학생 이름</div>
                  <div className="text-lg sm:text-xl font-bold">{selectedRecord.studentName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">학생 번호</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-600">{selectedRecord.studentId}번</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">불참 사유</div>
                <div className="text-lg sm:text-xl font-bold">{selectedRecord.reason}</div>
                {selectedRecord.detail && (
                  <div className="mt-2 text-base text-gray-700">{selectedRecord.detail}</div>
                )}
              </div>

              <div className="border-t-2 pt-5">
                <h3 className="text-lg sm:text-xl font-bold mb-4">📱 등록 기기 정보</h3>
                {selectedRecord.deviceInfo ? (
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-lg space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">브라우저:</span>
                      <span className="font-bold">{selectedRecord.deviceInfo.browser}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">운영체제:</span>
                      <span className="font-bold">{selectedRecord.deviceInfo.os}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">플랫폼:</span>
                      <span className="font-bold">{selectedRecord.deviceInfo.platform}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-gray-500 mb-1">User Agent:</div>
                      <div className="text-xs text-gray-600 break-all">
                        {selectedRecord.deviceInfo.userAgent}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-6">
                    기기 정보가 기록되지 않았습니다
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">등록 시간</div>
                <div className="text-lg font-bold">
                  {selectedRecord.createdAt ? new Date(selectedRecord.createdAt.seconds * 1000).toLocaleString('ko-KR') : '-'}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-full px-6 py-4 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors touch-manipulation text-lg"
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
