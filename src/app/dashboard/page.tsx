'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PushReflection, PushReflectionBase } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toFrontendReflections } from '@/lib/utils'
import { ShareLearningsDialog } from '@/components/share-learnings-dialog'
import { ReflectionTimeline } from '@/components/reflection-timeline'

export default function DashboardPage() {
  const { user } = useAuth()
  const [reflections, setReflections] = useState<PushReflection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    setError(null)

    // Create query for user's reflections
    const reflectionsRef = collection(db, 'pushReflections')
    const q = query(
      reflectionsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    // Subscribe to query
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as PushReflectionBase[]
          const frontendReflections = toFrontendReflections(data)
          setReflections(frontendReflections)
          setLoading(false)
        } catch (error) {
          console.error('Error processing reflection data:', error)
          setError('Failed to process reflection data. Please try again.')
          setLoading(false)
        }
      },
      (error) => {
        console.error('Error subscribing to reflections:', error)
        setError('Failed to load reflections. Please try again.')
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [user])

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Authorized</CardTitle>
          <CardDescription>Please sign in to view your reflections.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <main className="container max-w-3xl mx-auto py-12 px-4">
      <div className="flex justify-end mb-8">
        {user && <ShareLearningsDialog userId={user.uid} />}
      </div>
      
      {reflections.length === 0 ? (
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-500">No Reflections Yet</CardTitle>
            <CardDescription>
              Your push reflections will appear here once you start pushing code to your connected repositories.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ReflectionTimeline reflections={reflections} />
      )}
    </main>
  )
} 