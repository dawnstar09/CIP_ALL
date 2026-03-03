import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const classes = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <main className="min-h-screen p-8 bg-gray-50 relative overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative w-[400px] h-[400px]">
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
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          야자 관리 시스템
        </h1>
        <p className="text-center text-gray-600 mb-12">2학년</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {classes.map((classNum) => (
            <Link
              key={classNum}
              href={`/class/${classNum}`}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 text-center border-2 border-gray-200 hover:border-blue-400"
            >
              <div className="text-3xl font-bold text-gray-800">
                {classNum}반
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
