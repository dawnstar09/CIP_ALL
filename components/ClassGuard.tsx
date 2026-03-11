'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ClassGuardProps {
  classId: string
  children: React.ReactNode
}

export default function ClassGuard({ classId, children }: ClassGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      // 인증 로딩 중이면 대기
      if (authLoading) return

      // 로그인하지 않은 경우
      if (!user) {
        alert('로그인이 필요합니다.')
        router.push('/')
        return
      }

      try {
        // 관리자 또는 교사는 모든 반 접근 가능
        if (user.role === 'admin' || user.role === 'teacher') {
          setHasAccess(true)
          setChecking(false)
          return
        }

        // 학생인 경우: 해당 반 명렬표에 등록되어 있는지 확인
        if (user.role === 'student') {
          const studentDoc = await getDoc(
            doc(db, 'classes', classId, 'students', user.email)
          )

          if (studentDoc.exists() && user.classId === classId) {
            setHasAccess(true)
          } else {
            alert('해당 반에 접근 권한이 없습니다.')
            router.push('/')
          }
        }
      } catch (error) {
        console.error('접근 권한 확인 실패:', error)
        alert('접근 권한을 확인하는 중 오류가 발생했습니다.')
        router.push('/')
      }

      setChecking(false)
    }

    checkAccess()
  }, [user, authLoading, classId, router])

  // 로딩 중
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">접근 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // 접근 권한 없음
  if (!hasAccess) {
    return null
  }

  // 접근 권한 있음
  return <>{children}</>
}
