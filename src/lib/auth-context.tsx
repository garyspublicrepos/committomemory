'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGithub: () => Promise<string>
  signOut: () => Promise<void>
  getGithubToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [githubToken, setGithubToken] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGithub = async (): Promise<string> => {
    try {
      const provider = new GithubAuthProvider()
      // Add all required scopes for organization webhook management
      provider.addScope('admin:org')
      provider.addScope('admin:org_hook')
      provider.addScope('write:org')
      provider.addScope('read:org')
      // Add scopes for repository webhook management
      provider.addScope('admin:repo_hook')
      provider.addScope('repo')
      
      const result = await signInWithPopup(auth, provider)
      const credential = GithubAuthProvider.credentialFromResult(result)
      
      if (!credential?.accessToken) {
        throw new Error('Failed to get GitHub access token')
      }

      setGithubToken(credential.accessToken)
      return credential.accessToken
    } catch (error) {
      console.error('Error signing in with GitHub:', error)
      if (error instanceof Error) {
        if (error.message.includes('auth/popup-blocked')) {
          throw new Error('Please allow popups for this site to sign in with GitHub')
        }
        if (error.message.includes('auth/cancelled-popup-request')) {
          throw new Error('Sign in was cancelled. Please try again.')
        }
      }
      throw new Error('Failed to sign in with GitHub. Please try again.')
    }
  }

  const getGithubToken = async (): Promise<string> => {
    if (githubToken) return githubToken
    
    if (!user) {
      throw new Error('User must be logged in to get GitHub token')
    }

    return signInWithGithub()
  }

  const signOut = async () => {
    try {
      setGithubToken(null)
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGithub, signOut, getGithubToken }}>
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