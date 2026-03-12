'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  hasAccessToClass: (classId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser && firebaseUser.email) {
        // Firestore에서 사용자 정보 가져오기 (이메일로 조회)
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.email))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || '',
              role: userData.role || 'student',
              classId: userData.classId,
              photoURL: firebaseUser.photoURL || undefined
            })
          } else {
            // 사용자 정보가 없으면 기본값 설정 (첫 로그인)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: 'student',
              photoURL: firebaseUser.photoURL || undefined
            })
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('로그인 실패:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('로그아웃 실패:', error)
      throw error
    }
  }

  // 반 접근 권한 확인
  const hasAccessToClass = (classId: string): boolean => {
    if (!user) return false
    
    // 관리자는 모든 반 접근 가능
    if (user.role === 'admin' || user.role === 'teacher') return true
    
    // 학생은 자기 반만 접근 가능
    return user.classId === classId
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser,
      loading, 
      signInWithGoogle, 
      signOut,
      hasAccessToClass
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
