'use client'

interface PeriodSelectorProps {
  currentPeriod: 1 | 2 | 3
  onPeriodChange: (period: 1 | 2 | 3) => void
}

const periodTimes = {
  1: '16:50-17:40',
  2: '18:40-20:00',
  3: '20:10-21:00'
}

export default function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period as 1 | 2 | 3)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            currentPeriod === period
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
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
  )
}
