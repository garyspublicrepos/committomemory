'use client'

import { format } from 'date-fns'
import { MessageSquare, FileText, Pencil, CheckCircle2 } from 'lucide-react'
import { PushReflection } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReflectionEditor } from '@/components/reflection-editor'
import { useState, useEffect } from 'react'
import { updateReflection } from '@/lib/services/reflection'

// Add custom styles for the slow glow animation
const glowStyles = `
  @keyframes slowGlow {
    0% {
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.1);
    }
    50% {
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
    }
    100% {
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.1);
    }
  }

  .glow-effect {
    animation: slowGlow 3s ease-in-out infinite;
  }
`

interface ReflectionTimelineProps {
  reflections: PushReflection[]
}

export function ReflectionTimeline({ reflections }: ReflectionTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Find the most recent unreflected push
  const mostRecentUnreflectedPush = reflections.find(r => !r.reflection)

  // Auto-open editor for new pushes
  useEffect(() => {
    if (mostRecentUnreflectedPush && !editingId) {
      setEditingId(mostRecentUnreflectedPush.id)
    }
  }, [mostRecentUnreflectedPush?.id])

  // Add keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if space is pressed and we have an unreflected push
      if (event.code === 'Space' && mostRecentUnreflectedPush && !editingId) {
        // Don't trigger if user is typing in an input or textarea
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return
        }
        event.preventDefault() // Prevent page scroll
        setEditingId(mostRecentUnreflectedPush.id)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mostRecentUnreflectedPush, editingId])

  // Add the styles to the document
  if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = glowStyles
    document.head.appendChild(style)
  }

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
                  "p-6 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-white/20 transition-all duration-1000",
                  mostRecentUnreflectedPush?.id === reflection.id && !reflection.reflection && [
                    "glow-effect bg-gradient-to-r from-purple-500/10 to-blue-500/10"
                  ]
                )}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-purple-500">
                    {reflection.repositoryName}
                  </h4>
                  {reflection.reflection ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
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