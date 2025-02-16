'use client'

import { format, isToday } from 'date-fns'
import { MessageSquare, FileText, Pencil, CheckCircle2, Brain, Zap, Trophy } from 'lucide-react'
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

function getEncouragementMessage(stats: { total: number, completed: number, streak: number }) {
  // No reflections yet
  if (stats.completed === 0) {
    const messages = [
      "Ready to reflect on your coding journey?",
      "Take a moment to think about what you've learned today 💭",
      "Every reflection makes you a better developer ✨",
      "What did you learn from your latest changes? 🤔",
      "Time to capture your coding insights! 📝"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // All reflections completed
  if (stats.completed === stats.total) {
    const messages = [
      "Amazing! You've reflected on all your pushes today! 🎉",
      "Perfect reflection score today! Your future self will thank you 🙌",
      "All caught up! You're building a great learning habit 🌟",
      "Reflection champion! You're maximizing your learning 🏆",
      "Incredible! Every push has its reflection today 💫"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Streak messages
  if (stats.streak >= 3) {
    const messages = [
      `${stats.streak} reflections in a row! You're on fire! 🔥`,
      `${stats.streak} streak! You're in the zone! ⚡️`,
      `Unstoppable! ${stats.streak} reflections and counting! 🚀`,
      `${stats.streak} reflections deep - what a learning streak! 🎯`,
      `You're crushing it with ${stats.streak} reflections in a row! 💪`
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // First reflection
  if (stats.completed === 1) {
    const messages = [
      "Great start! Keep the reflections coming! ✨",
      "First reflection of the day - nicely done! 🌱",
      "One down! Your learning journey begins here! 🎯",
      "First reflection captured! Keep building that habit! 💫",
      "Excellent start to your reflection practice! 🌟"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // In progress (some reflections done but not all)
  const messages = [
    "You're building great reflection habits! 💪",
    `${stats.completed} reflections done - keep the momentum going! 🚀`,
    "Every reflection helps you grow as a developer! 🌱",
    "You're making great progress! Keep reflecting! ⭐️",
    "Keep capturing those learning moments! 💭"
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

export function ReflectionTimeline({ reflections }: ReflectionTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Calculate daily stats
  const todayStats = reflections.reduce((stats, reflection) => {
    if (isToday(reflection.createdAt)) {
      stats.total++
      if (reflection.reflection) {
        stats.completed++
        stats.streak = stats.currentStreak + 1
        stats.currentStreak++
      } else {
        stats.currentStreak = 0
      }
    }
    return stats
  }, { total: 0, completed: 0, streak: 0, currentStreak: 0 })

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
      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-400">Today&apos;s Learning Journey</h2>
          {todayStats.completed > 0 && (
            <Trophy className="h-6 w-6 text-yellow-500" />
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              Pushes Today
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{todayStats.total}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              Reflections
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {todayStats.completed}/{todayStats.total}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              Current Streak
              <MessageSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{todayStats.streak}</div>
          </div>
        </div>

        <p className="text-muted-foreground italic">
          {getEncouragementMessage(todayStats)}
        </p>
      </div>

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
                  "p-6 rounded-lg transition-all duration-1000",
                  reflection.reflection
                    ? "bg-gradient-to-r from-purple-500/[0.02] to-blue-500/[0.02] border border-white/10"  // Muted colors for completed reflections
                    : cn(
                        "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-white/20",
                        mostRecentUnreflectedPush?.id === reflection.id && [
                          "glow-effect bg-gradient-to-r from-purple-500/10 to-blue-500/10"
                        ]
                      )
                )}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h4 className={cn(
                    "text-xl font-semibold",
                    reflection.reflection ? "text-purple-500/70" : "text-purple-500"
                  )}>
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
                  <h5 className={cn(
                    "font-medium mb-2 flex items-center",
                    reflection.reflection ? "text-blue-400/70" : "text-blue-400"
                  )}>
                    <FileText className="w-4 h-4 mr-2" />
                    Commits in this Push:
                  </h5>
                  <ul className="space-y-2">
                    {reflection.commits.map(commit => (
                      <li key={commit.id} className={cn(
                        "group transition-colors duration-200",
                        reflection.reflection 
                          ? "text-muted-foreground/80 hover:text-blue-400/70"
                          : "text-muted-foreground hover:text-blue-400"
                      )}>
                        <code className={cn(
                          "text-sm font-mono",
                          reflection.reflection 
                            ? "text-purple-400/70 group-hover:text-purple-500/70"
                            : "text-purple-400 group-hover:text-purple-500"
                        )}>
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
                  <h5 className={cn(
                    "font-medium mb-2 flex items-center",
                    reflection.reflection ? "text-emerald-400/70" : "text-emerald-400"
                  )}>
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
                    <p className={cn(
                      reflection.reflection ? "text-muted-foreground/80" : "text-muted-foreground"
                    )}>
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