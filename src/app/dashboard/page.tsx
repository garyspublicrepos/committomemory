'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUserReflections } from '@/lib/services/reflection'
import { PushReflection } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil } from 'lucide-react'
import { ReflectionEditor } from '@/components/reflection-editor'

export default function DashboardPage() {
  const { user } = useAuth()
  const [reflections, setReflections] = useState<PushReflection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReflections() {
      if (!user) return

      try {
        const data = await getUserReflections(user.uid)
        // Convert Firestore Timestamps to Dates
        const formattedReflections = data.map(r => ({
          ...r,
          createdAt: r.createdAt.toDate(),
          updatedAt: r.updatedAt.toDate()
        }))
        setReflections(formattedReflections)
      } catch (error) {
        console.error('Error loading reflections:', error)
        setError('Failed to load reflections. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadReflections()
  }, [user])

  const handleSaveReflection = (updatedReflection: PushReflection) => {
    setReflections(reflections.map(r => 
      r.id === updatedReflection.id ? updatedReflection : r
    ))
    setEditingId(null)
  }

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
    <main className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Your Push Reflections</h1>
      
      {reflections.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Reflections Yet</CardTitle>
            <CardDescription>
              Your push reflections will appear here once you start pushing code to your connected repositories.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reflections.map((reflection) => (
            <Card key={reflection.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {reflection.repositoryName}
                    </CardTitle>
                    <CardDescription>
                      {new Date(reflection.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {!reflection.reflection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(reflection.id)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Write Reflection
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Commits in this Push:</h3>
                  <ul className="space-y-2">
                    {reflection.commits.map(commit => (
                      <li key={commit.id} className="text-muted-foreground">
                        <code className="text-sm font-mono">{commit.id.substring(0, 7)}</code>
                        {' - '}
                        {commit.message}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Your Reflection:</h3>
                  {editingId === reflection.id ? (
                    <ReflectionEditor
                      reflection={reflection}
                      onSave={handleSaveReflection}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {reflection.reflection || 'No reflection written yet'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
} 