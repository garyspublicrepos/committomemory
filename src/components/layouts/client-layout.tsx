'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Github, Settings, ArrowRightLeft, Menu } from 'lucide-react'
import Link from 'next/link'
import { NotificationToggle } from '@/components/notification-toggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, signInWithGithub, signOut } = useAuth()

  const NavItems = () => (
    <>
      {user && (
        <>
          <NotificationToggle />
          <Link href="/reflect">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 w-full justify-start"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Export / Reflect
            </Button>
          </Link>
          <Link href="/setup">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 w-full justify-start"
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
        className="gap-2 w-full justify-start"
      >
        <Github className="h-4 w-4" />
        {user ? 'Sign Out' : 'Sign In with GitHub'}
      </Button>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="PushToMemory Logo" className="h-8 w-8 rounded-full" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                PushToMemory
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-4">
            <NavItems />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-4">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
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