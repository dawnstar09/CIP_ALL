'use client'

import type { Student, AttendanceStatus, Absence } from '@/types'

interface StudentGridProps {
  students: Student[]
  attendanceStatus: AttendanceStatus[]
  onAbsenceClick: (absence: Absence) => void
}

export default function StudentGrid({ students, attendanceStatus, onAbsenceClick }: StudentGridProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">학생 현황</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
        {students.map((student) => {
          const status = attendanceStatus.find((s) => s.studentId === student.id)
          const isPresent = status?.isPresent ?? true
          
          return (
            <button
              key={student.id}
              onClick={() => {
                if (!isPresent && status?.absence) {
                  onAbsenceClick(status.absence)
                }
              }}
              className={`
                aspect-square p-4 rounded-lg font-bold text-white text-lg
                transition-all duration-200 shadow-md hover:shadow-lg
                ${isPresent 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600 cursor-pointer'
                }
              `}
              disabled={isPresent}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-2xl">{student.id}</div>
                <div className="text-xs mt-1">번</div>
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-6 flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">참가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">불참 (클릭하여 상세보기)</span>
        </div>
      </div>
    </div>
  )
}
