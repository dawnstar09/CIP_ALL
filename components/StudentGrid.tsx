'use client'

import type { Student, AttendanceStatus, Absence } from '@/types'

interface StudentGridProps {
  students: Student[]
  attendanceStatus: AttendanceStatus[]
  onAbsenceClick: (absence: Absence) => void
}

export default function StudentGrid({ students, attendanceStatus, onAbsenceClick }: StudentGridProps) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
      <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">학생 현황</h2>
      <div className="grid grid-cols-6 gap-2 md:gap-3">
        {students.map((student) => {
          const status = attendanceStatus.find((s) => s.studentId === student.id)
          const isPresent = status?.isPresent ?? true
          const reason = status?.absence?.reason
          const detail = status?.absence?.detail
          
          return (
            <button
              key={student.id}
              onClick={() => {
                if (!isPresent && status?.absence) {
                  onAbsenceClick(status.absence)
                }
              }}
              className={`
                aspect-square p-2 md:p-3 rounded-lg font-bold text-white
                transition-all duration-200 shadow-md hover:shadow-xl active:scale-95
                touch-manipulation
                ${isPresent 
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700 cursor-pointer'
                }
              `}
              disabled={isPresent}
            >
              <div className="flex flex-col items-center justify-center h-full gap-0.5 md:gap-1">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl md:text-5xl">{student.id}</span>
                  <span className="text-sm md:text-base">번</span>
                </div>
                {!isPresent && (
                  <div className="text-[10px] md:text-xs leading-tight opacity-90 px-1 text-center break-all">
                    {reason || '미입력'}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-4 md:mt-6 flex flex-wrap gap-4 md:gap-6 justify-center items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-lg"></div>
          <span className="text-sm md:text-base text-gray-700 font-medium">참가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-red-500 rounded-lg"></div>
          <span className="text-sm md:text-base text-gray-700 font-medium">불참 (터치하여 상세보기)</span>
        </div>
      </div>
    </div>
  )
}
