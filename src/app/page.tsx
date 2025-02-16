'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight mb-6">
        CommitToMemory
      </h1>
      <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
        Reflect on your code changes and build a learning journal from your commits.
      </p>
      <Button size="lg" onClick={() => router.push('/setup')}>
        Get Started
      </Button>
    </main>
  )
}
