'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUserReflections } from '@/lib/services/reflection'
import { PushReflection } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil } from 'lucide-react'
import { ReflectionEditor } from '@/components/reflection-editor'
import { toFrontendReflections } from '@/lib/utils'
import { ShareLearningsDialog } from '@/components/share-learnings-dialog'
import { ReflectionTimeline } from '@/components/reflection-timeline'

export default function DashboardPage() {
  const { user } = useAuth()
  const [reflections, setReflections] = useState<PushReflection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReflections() {
      if (!user) return

      try {
        const data = await getUserReflections(user.uid)
        const frontendReflections = toFrontendReflections(data)
        setReflections(frontendReflections)
        if (frontendReflections.length > 0) {
          setSelectedId(frontendReflections[0].id)
        }
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

  const selectedReflection = reflections.find(r => r.id === selectedId)

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Your Push Reflections</h1>
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
        <div className="space-y-8">
          {/* Timeline */}
          <div>
            <ReflectionTimeline
              reflections={reflections}
              selectedId={selectedId}
              onSelectReflection={setSelectedId}
            />
          </div>

          {/* Selected Reflection */}
          {selectedReflection && (
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-purple-500">
                      {selectedReflection.repositoryName}
                    </CardTitle>
                    <CardDescription className="text-blue-400">
                      {new Date(selectedReflection.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {!selectedReflection.reflection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(selectedReflection.id)}
                      className="border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10"
                    >
                      <Pencil className="h-4 w-4 mr-2 text-purple-500" />
                      Write Reflection
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-blue-400">Commits in this Push:</h3>
                  <ul className="space-y-2">
                    {selectedReflection.commits.map(commit => (
                      <li key={commit.id} className="text-muted-foreground group hover:text-blue-400 transition-colors duration-200">
                        <code className="text-sm font-mono text-purple-400 group-hover:text-purple-500">{commit.id.substring(0, 7)}</code>
                        {' - '}
                        {commit.message}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-emerald-400">Your Reflection:</h3>
                  {editingId === selectedReflection.id ? (
                    <ReflectionEditor
                      reflection={selectedReflection}
                      onSave={handleSaveReflection}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {selectedReflection.reflection || 'No reflection written yet'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  )
} 