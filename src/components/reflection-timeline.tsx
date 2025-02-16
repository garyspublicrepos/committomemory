'use client'

import { format } from 'date-fns'
import { MessageSquare, FileText, Pencil } from 'lucide-react'
import { PushReflection } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReflectionEditor } from '@/components/reflection-editor'
import { useState } from 'react'
import { updateReflection } from '@/lib/services/reflection'

interface ReflectionTimelineProps {
  reflections: PushReflection[]
}

export function ReflectionTimeline({ reflections }: ReflectionTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Find the most recent unreflected push
  const mostRecentUnreflectedPush = reflections.find(r => !r.reflection)

  const handleSaveReflection = async (reflection: PushReflection) => {
    try {
      await updateReflection(reflection.id, reflection.reflection)
      setEditingId(null)
    } catch (error) {
      console.error('Error saving reflection:', error)
    }
  }

  // Group reflections by date
  const groupedReflections = reflections.reduce((groups: { date: Date; reflections: PushReflection[] }[], reflection) => {
    const date = reflection.createdAt
    const existingGroup = groups.find(group => 
      group.date.getFullYear() === date.getFullYear() &&
      group.date.getMonth() === date.getMonth() &&
      group.date.getDate() === date.getDate()
    )
    
    if (existingGroup) {
      existingGroup.reflections.push(reflection)
    } else {
      groups.push({ date, reflections: [reflection] })
    }
    
    return groups
  }, []).sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="relative space-y-8">
      {groupedReflections.map((group) => (
        <div key={group.date.toISOString()} className="relative">
          {/* Date Header */}
          <h3 className="text-lg font-semibold mb-4 text-purple-400">
            {format(group.date, 'MMMM d, yyyy')}
          </h3>
          
          {/* Reflections for this date */}
          <div className="space-y-6">
            {group.reflections.map((reflection) => (
              <div
                key={reflection.id}
                className={cn(
                  "p-6 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 transition-all duration-500",
                  mostRecentUnreflectedPush?.id === reflection.id && !reflection.reflection && 
                  "animate-pulse border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-gradient-to-r from-purple-500/10 to-blue-500/10"
                )}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-purple-500">
                    {reflection.repositoryName}
                  </h4>
                  {!reflection.reflection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(reflection.id)}
                      className="border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10"
                    >
                      <Pencil className="h-4 w-4 mr-2 text-purple-500" />
                      Write Reflection
                    </Button>
                  )}
                </div>

                {/* Commits */}
                <div className="mb-4">
                  <h5 className="font-medium mb-2 text-blue-400 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Commits in this Push:
                  </h5>
                  <ul className="space-y-2">
                    {reflection.commits.map(commit => (
                      <li key={commit.id} className="text-muted-foreground group hover:text-blue-400 transition-colors duration-200">
                        <code className="text-sm font-mono text-purple-400 group-hover:text-purple-500">
                          {commit.id.substring(0, 7)}
                        </code>
                        {' - '}
                        {commit.message}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reflection */}
                <div>
                  <h5 className="font-medium mb-2 text-emerald-400 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Your Reflection:
                  </h5>
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 