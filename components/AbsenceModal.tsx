'use client'

import { useState } from 'react'
import type { Student, Absence, AbsenceReason } from '@/types'

interface AbsenceModalProps {
  students: Student[]
  onClose: () => void
  onSubmit: (absences: Omit<Absence, 'createdAt'>[]) => void
}

export default function AbsenceModal({ students, onClose, onSubmit }: AbsenceModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | null>(null)
  const [detail, setDetail] = useState('')
  const [selectedPeriods, setSelectedPeriods] = useState<(1 | 2 | 3)[]>([1])

  const reasons: AbsenceReason[] = ['병원', '학원', '동아리', '방과후', '기타']

  const periodTimes = {
    1: '16:50-17:40',
    2: '18:40-20:00',
    3: '20:10-21:00'
  }

  const togglePeriod = (period: 1 | 2 | 3) => {
    if (selectedPeriods.includes(period)) {
      if (selectedPeriods.length > 1) {
        setSelectedPeriods(selectedPeriods.filter(p => p !== period))
      }
    } else {
      setSelectedPeriods([...selectedPeriods, period].sort())
    }
  }

  const handleSubmit = () => {
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

    const absences = selectedPeriods.map(period => ({
      studentId: selectedStudent,
      studentName: student.name,
      reason: selectedReason,
      detail: detail,
      date: '', // 부모 컴포넌트에서 설정
      period: period
    }))

    onSubmit(absences)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">야자 불참 추가</h2>

        {/* 차시 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            차시 선택 (복수 선택 가능)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => togglePeriod(period as 1 | 2 | 3)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedPeriods.includes(period as 1 | 2 | 3)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="text-center">
                  <div>{period}차시</div>
                  <div className="text-xs mt-1 opacity-75">
                    {periodTimes[period as 1 | 2 | 3]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 학생 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            학생 선택
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudent(student.id)}
                className={`p-3 rounded-lg font-semibold transition-colors ${
                  selectedStudent === student.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {student.id}
              </button>
            ))}
          </div>
        </div>

        {/* 불참 사유 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            불참 사유
          </label>
          <div className="space-y-2">
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
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors text-left ${
                  selectedReason === reason
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 사유 입력 */}
        {(selectedReason === '동아리' || selectedReason === '방과후' || selectedReason === '기타') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            추가
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
