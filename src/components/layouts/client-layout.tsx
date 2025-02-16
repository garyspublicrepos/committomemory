'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Github, Settings, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, signInWithGithub, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              PushToMemory
            </Link>
          </div>

          {/* Right Side Nav Items */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link href="/reflect">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Export / Reflect
                  </Button>
                </Link>
                <Link href="/setup">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Setup
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={user ? signOut : signInWithGithub}
              className="gap-2"
            >
              <Github className="h-4 w-4" />
              {user ? 'Sign Out' : 'Sign In with GitHub'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 