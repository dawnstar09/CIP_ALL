'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      '최진명', '허선호', '황동규'
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
      studentCount = 35
      nameList = class8Names
    }
    
    const studentList: Student[] = Array.from({ length: studentCount }, (_, i) => ({
      id: i + 1,
      name: nameList.length > 0 ? nameList[i] : `${i + 1}번 학생`
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

        absences.sort((a, b) => {
          // 날짜 비교 우선 (최신순)
          const dateCompare = b.date.localeCompare(a.date)
          if (dateCompare !== 0) return dateCompare
          
          // 같은 날짜면 번호순 (오름차순)
          return a.studentId - b.studentId
        })
        
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

  const handleRejoin = async (absenceId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 야자에 다시 참가시키시겠습니까?\n(불참 기록이 삭제됩니다)`)) {
      return
    }

    try {
      setDeletingId(absenceId)
      await deleteDoc(doc(db, 'absences', absenceId))
      alert('재참가 처리되었습니다!')
    } catch (error) {
      console.error('재참가 처리 실패:', error)
      alert('재참가 처리에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

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
                    {classNumber === 5 || classNumber === 6 
                      ? `${student.name} (${student.id}번)` 
                      : `${student.id}번 학생`}
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

        {/* 상세 기록 - 테이블 */}
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md overflow-x-auto">
          <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">상세 기록</h3>
          
          {filteredStats.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">날짜</th>
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">차시</th>
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">번호</th>
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">이름</th>
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">사유</th>
                  <th className="px-4 py-3 text-left text-sm sm:text-base font-semibold text-gray-700">재참가</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((absence, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm sm:text-base">{absence.date}</td>
                    <td className="px-4 py-3 text-sm sm:text-base">야자 {absence.period}차시</td>
                    <td className="px-4 py-3 text-sm sm:text-base">{absence.studentId}</td>
                    <td className="px-4 py-3 text-sm sm:text-base">{absence.studentName}</td>
                    <td className="px-4 py-3 text-sm sm:text-base">
                      {absence.detail ? (
                        <span>{absence.reason}: {absence.detail}</span>
                      ) : (
                        absence.reason
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm sm:text-base">
                      <button
                        onClick={() => handleRejoin(absence.id, absence.studentName)}
                        disabled={deletingId === absence.id}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium touch-manipulation"
                      >
                        {deletingId === absence.id ? '처리중...' : '재참가'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={async () => {
                  await handleRejoin(selectedRecord.id, selectedRecord.studentName)
                  setSelectedRecord(null)
                }}
                disabled={deletingId === selectedRecord.id}
                className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors touch-manipulation text-lg"
              >
                {deletingId === selectedRecord.id ? '처리중...' : '재참가 처리'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors touch-manipulation text-lg"
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
