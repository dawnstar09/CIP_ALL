'use client'

import type { Student, AttendanceStatus, Absence } from '@/types'

interface StudentGridProps {
  students: Student[]
  attendanceStatus: AttendanceStatus[]
  onAbsenceClick: (absence: Absence) => void
}

export default function StudentGrid({ students, attendanceStatus, onAbsenceClick }: StudentGridProps) {
  return (
    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 md:mb-8">학생 현황</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-3 sm:gap-4">
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
                aspect-square p-3 sm:p-4 rounded-lg font-bold text-white text-lg sm:text-xl
                transition-all duration-200 shadow-md hover:shadow-xl active:scale-95
                touch-manipulation min-h-[70px] sm:min-h-[80px]
                ${isPresent 
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700 cursor-pointer'
                }
              `}
              disabled={isPresent}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-2xl sm:text-3xl">{student.id}</div>
                <div className="text-xs sm:text-sm mt-1">번</div>
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
          <span className="text-base sm:text-lg text-gray-700 font-medium">참가</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
          <span className="text-base sm:text-lg text-gray-700 font-medium">불참 (터치하여 상세보기)</span>
        </div>
      </div>
    </div>
  )
}
