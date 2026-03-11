'use client'

import Link from 'next/link'
import Image from 'next/image'
import LoginButton from '@/components/LoginButton'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const classes = Array.from({ length: 10 }, (_, i) => i + 1)
  const { user, loading } = useAuth()

  return (
    <main className="min-h-screen p-5 sm:p-6 md:p-8 lg:p-10 bg-gray-50 relative overflow-hidden">
      {/* 로그인 버튼 (상단 우측) */}
      <div className="absolute top-4 right-4 z-20">
        <LoginButton />
      </div>

      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative w-[250px] h-[250px] sm:w-[400px] sm:h-[400px]">
          <Image
            src="/image.png"
            alt="Background"
            fill
            className="object-contain opacity-50"
            priority
          />
        </div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-gray-800">
          야자 관리 시스템
        </h1>
        <p className="text-center text-gray-600 mb-10 sm:mb-14 md:mb-16 text-base sm:text-lg">2학년</p>
        
        {/* 로그인 안내 */}
        {!loading && !user && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800">
              🔐 반에 접근하려면 먼저 로그인해주세요 (우측 상단)
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {classes.map((classNum) => (
            <Link
              key={classNum}
              href={`/class/${classNum}`}
              className="bg-white p-8 sm:p-10 md:p-12 rounded-xl shadow-lg hover:shadow-2xl active:shadow-3xl transition-all duration-200 text-center border-2 border-gray-200 active:border-blue-400 touch-manipulation min-h-[120px] sm:min-h-[140px] flex items-center justify-center"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
                {classNum}반
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
