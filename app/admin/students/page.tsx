'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import Link from 'next/link'

interface StudentData {
  id: number // 학번 (번호)
  name: string
  email: string
  studentId?: string // 실제 학번 (예: 20501)
}

export default function AdminStudentManagement() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState('2-5')
  const [students, setStudents] = useState<StudentData[]>([])
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)

  // 관리자 권한 체크
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-lg text-red-600 mb-4">⛔ 관리자 권한이 필요합니다</p>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // CSV 텍스트를 파싱하여 학생 데이터로 변환
  const parseCsvText = (text: string): StudentData[] => {
    const lines = text.trim().split('\n')
    const result: StudentData[] = []

    for (let line of lines) {
      // CSV 형식: 번호,이름,이메일,학번(선택)
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 3) {
        result.push({
          id: parseInt(parts[0]),
          name: parts[1],
          email: parts[2],
          studentId: parts[3] || undefined
        })
      }
    }

    return result
  }

  // CSV 데이터 미리보기
  const handlePreviewCSV = () => {
    try {
      const parsed = parseCsvText(csvText)
      setStudents(parsed)
      alert(`${parsed.length}명의 학생 데이터를 확인했습니다.`)
    } catch (error) {
      console.error('CSV 파싱 오류:', error)
      alert('CSV 형식이 올바르지 않습니다.')
    }
  }

  // Firestore에 학생 등록
  const handleUploadStudents = async () => {
    if (students.length === 0) {
      alert('등록할 학생이 없습니다.')
      return
    }

    const confirmed = confirm(`${selectedClass} 반에 ${students.length}명의 학생을 등록하시겠습니까?`)
    if (!confirmed) return

    setLoading(true)

    try {
      // classes/{classId}/students/{email} 형식으로 저장
      for (const student of students) {
        await setDoc(
          doc(db, 'classes', selectedClass, 'students', student.email),
          {
            ...student,
            classId: selectedClass,
            createdAt: new Date()
          }
        )

        // users 컬렉션에도 등록 (사용자가 처음 로그인할 때 참조)
        await setDoc(
          doc(db, 'users', student.email),
          {
            email: student.email,
            name: student.name,
            role: 'student',
            classId: selectedClass,
            studentId: student.id
          },
          { merge: true } // 기존 데이터가 있으면 병합
        )
      }

      alert(`✅ ${students.length}명의 학생이 성공적으로 등록되었습니다!`)
      setStudents([])
      setCsvText('')
    } catch (error: any) {
      console.error('학생 등록 실패:', error)
      alert(`등록 실패: ${error.message}`)
    }

    setLoading(false)
  }

  // 특정 반의 학생 목록 조회
  const handleLoadStudents = async () => {
    setLoading(true)

    try {
      const studentsRef = collection(db, 'classes', selectedClass, 'students')
      const snapshot = await getDocs(studentsRef)
      const loadedStudents: StudentData[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        loadedStudents.push({
          id: data.id,
          name: data.name,
          email: data.email,
          studentId: data.studentId
        })
      })

      loadedStudents.sort((a, b) => a.id - b.id)
      setStudents(loadedStudents)
      alert(`${loadedStudents.length}명의 학생을 불러왔습니다.`)
    } catch (error) {
      console.error('학생 조회 실패:', error)
      alert('학생 목록을 불러오는데 실패했습니다.')
    }

    setLoading(false)
  }

  // 학생 삭제
  const handleDeleteStudent = async (email: string) => {
    const confirmed = confirm(`${email} 학생을 삭제하시겠습니까?`)
    if (!confirmed) return

    try {
      await deleteDoc(doc(db, 'classes', selectedClass, 'students', email))
      setStudents(students.filter(s => s.email !== email))
      alert('학생이 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('학생 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">학생 명렬표 관리</h1>
            <p className="text-gray-600 mt-2">반별 학생 등록 및 관리</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            ← 홈으로
          </Link>
        </div>

        {/* 반 선택 */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            반 선택
          </label>
          <div className="flex gap-3">
            {Array.from({ length: 10 }, (_, i) => `2-${i + 1}`).map(classId => (
              <button
                key={classId}
                onClick={() => setSelectedClass(classId)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  selectedClass === classId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {classId}
              </button>
            ))}
          </div>
        </div>

        {/* CSV 입력 */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">명렬표 데이터 입력 (CSV)</h2>
          <p className="text-sm text-gray-600 mb-3">
            형식: <code className="bg-gray-100 px-2 py-1 rounded">번호,이름,이메일,학번(선택)</code>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            예시: <code className="bg-gray-100 px-2 py-1 rounded">1,김철수,chulsoo@example.com,20501</code>
          </p>
          
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="1,김철수,chulsoo@school.com,20501&#10;2,이영희,younghee@school.com,20502&#10;3,박민수,minsu@school.com,20503"
            className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePreviewCSV}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              미리보기
            </button>
            <button
              onClick={handleUploadStudents}
              disabled={students.length === 0 || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : `${students.length}명 등록하기`}
            </button>
            <button
              onClick={handleLoadStudents}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
            >
              현재 명렬표 불러오기
            </button>
          </div>
        </div>

        {/* 학생 목록 */}
        {students.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              학생 목록 ({students.length}명)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">번호</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">학번</th>
                    <th className="px-4 py-3 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.email} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{student.id}</td>
                      <td className="px-4 py-3 font-semibold">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm">{student.studentId || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteStudent(student.email)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
