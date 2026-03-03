'use client'

import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

export default function ClassPage({ params }: PageProps) {
  const classNumber = parseInt(params.id)

  const menus = [
    {
      title: '야자 현황 보기',
      description: '학생 출결 현황을 확인합니다',
      href: `/class/${classNumber}/current`,
      icon: '📊',
      color: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
    },
    {
      title: '야자 불참 추가',
      description: '새로운 불참 기록을 추가합니다',
      href: `/class/${classNumber}/add`,
      icon: '➕',
      color: 'bg-red-500 hover:bg-red-600 active:bg-red-700'
    },
    {
      title: '야자 통계',
      description: '기간별 통계를 조회합니다',
      href: `/class/${classNumber}/statistics`,
      icon: '📈',
      color: 'bg-green-500 hover:bg-green-600 active:bg-green-700'
    }
  ]

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <Link
            href="/"
            className="inline-block px-4 py-2 sm:px-5 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg transition-colors text-sm sm:text-base touch-manipulation mb-6"
          >
            ← 뒤로 가기
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mt-6">
            2학년 {classNumber}반
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mt-3">야자 관리 시스템</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`${menu.color} text-white p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-200 touch-manipulation hover:shadow-xl active:scale-95 min-h-[180px] sm:min-h-[200px] flex flex-col`}
            >
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">{menu.icon}</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{menu.title}</h2>
              <p className="text-sm sm:text-base opacity-90 mt-auto">{menu.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">안내사항</h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li className="flex items-start gap-2 sm:gap-3 leading-relaxed">
              <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
              <span><strong>야자 현황 보기:</strong> 선택한 날짜와 차시의 학생 출결 현황을 확인할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 leading-relaxed">
              <span className="text-red-500 mt-1 flex-shrink-0">•</span>
              <span><strong>야자 불참 추가:</strong> 학생의 불참 사유를 입력하고 여러 차시를 한 번에 선택할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 leading-relaxed">
              <span className="text-green-500 mt-1 flex-shrink-0">•</span>
              <span><strong>야자 통계:</strong> 기간별, 학생별, 사유별로 불참 통계를 조회할 수 있습니다</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}