'use client'

import type { Student, AttendanceStatus, Absence } from '@/types'

interface StudentGridProps {
  students: Student[]
  attendanceStatus: AttendanceStatus[]
  onAbsenceClick: (absence: Absence) => void
}

export default function StudentGrid({ students, attendanceStatus, onAbsenceClick }: StudentGridProps) {
  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-md">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-10">학생 현황</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-4 sm:gap-5">
        {students.map((student) => {
          const status = attendanceStatus.find((s) => s.studentId === student.id)
          const isPresent = status?.isPresent ?? true
          const reason = status?.absence?.reason
          
          return (
            <button
              key={student.id}
              onClick={() => {
                if (!isPresent && status?.absence) {
                  onAbsenceClick(status.absence)
                }
              }}
              className={`
                aspect-square p-2 sm:p-3 rounded-lg font-bold text-white text-lg sm:text-xl
                transition-all duration-200 shadow-md hover:shadow-xl active:scale-95
                touch-manipulation min-h-[90px] sm:min-h-[100px] md:min-h-[110px]
                ${isPresent 
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700 cursor-pointer'
                }
              `}
              disabled={isPresent}
            >
              <div className="flex flex-col items-center justify-between h-full py-1">
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold">{student.id}</div>
                <div className="text-sm sm:text-base">번</div>
                {!isPresent && reason && (
                  <div className="text-[10px] sm:text-xs opacity-90 mt-auto truncate w-full px-1">
                    사유:{reason}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-5 sm:gap-10 justify-center items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg"></div>
          <span className="text-xl sm:text-2xl text-gray-700 font-bold">참가</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-lg"></div>
          <span className="text-xl sm:text-2xl text-gray-700 font-bold">불참 (터치하여 상세보기)</span>
        </div>
      </div>
    </div>
  )
}
