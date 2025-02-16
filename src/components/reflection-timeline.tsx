'use client'

import { format, isToday } from 'date-fns'
import { MessageSquare, FileText, Pencil, CheckCircle2, Brain, Zap, Trophy, Search, Info } from 'lucide-react'
import { PushReflection } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReflectionEditor } from '@/components/reflection-editor'
import { useState, useEffect, useMemo } from 'react'
import { updateReflection } from '@/lib/services/reflection'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate daily stats from all reflections (not filtered)
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

  // Memoize the encouragement message
  const encouragementMessage = useMemo(() => 
    getEncouragementMessage(todayStats),
    [todayStats]
  )

  // Filter reflections based on search query
  const filteredReflections = reflections.filter(reflection => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    const date = format(reflection.createdAt, 'MMMM d, yyyy').toLowerCase()
    return (
      // Search in repository name
      reflection.repositoryName.toLowerCase().includes(searchLower) ||
      // Search in commit messages
      reflection.commits.some(commit => 
        commit.message.toLowerCase().includes(searchLower)
      ) ||
      // Search in reflection content
      (reflection.reflection && 
        reflection.reflection.toLowerCase().includes(searchLower)) ||
      // Search in date
      date.includes(searchLower)
    )
  })

  // Find the most recent unreflected push from all reflections (not filtered)
  const mostRecentUnreflectedPush = reflections.find(r => !r.reflection)

  // Auto-open editor for new pushes
  useEffect(() => {
    if (mostRecentUnreflectedPush && !editingId) {
      setEditingId(mostRecentUnreflectedPush.id)
    }
  }, [mostRecentUnreflectedPush, editingId])

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
  const groupedReflections = filteredReflections.reduce((groups: { date: Date; reflections: PushReflection[] }[], reflection) => {
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
      {/* Stats Section - Always visible */}
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
          {encouragementMessage}
        </p>
      </div>

      {/* Search Section with Export Button */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {groupedReflections.map((group) => (
        <div key={group.date.toISOString()} className="relative">
          {/* Date Header */}
          <h3 className="text-lg font-semibold mb-4 text-white italic text-center">
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
                  <div className="space-y-2 flex-1">
                    <h3 className={cn(
                      "text-xl font-semibold leading-tight",
                      reflection.reflection ? "text-white/80" : "text-white"
                    )}>
                      {reflection.commits[0].message}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "text-sm",
                        reflection.reflection ? "text-purple-500/70" : "text-purple-500"
                      )}>
                        <span className="text-muted-foreground">in</span>{' '}
                        {reflection.repositoryName}
                        <span className="text-muted-foreground ml-2">by</span>{' '}
                        <span className={cn(
                          reflection.reflection ? "text-blue-400/70" : "text-blue-400"
                        )}>
                          {reflection.commits[0].author.name}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                              <Info className="h-3 w-3 text-muted-foreground hover:text-purple-400 transition-colors" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[300px] space-y-2 p-4 bg-zinc-900/95 border border-white/10">
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium text-sm text-purple-400 mb-1">Repository</p>
                                <p className="text-sm text-white">{reflection.repositoryName}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-blue-400 mb-1">Push Details</p>
                                <div className="space-y-1">
                                  <p className="text-sm text-white">
                                    <span className="text-white/60">Time:</span>{' '}
                                    {format(reflection.createdAt, 'PPpp')}
                                  </p>
                                  <p className="text-sm text-white">
                                    <span className="text-white/60">Total Commits:</span>{' '}
                                    {reflection.commits.length}
                                  </p>
                                  <p className="text-sm text-white">
                                    <span className="text-white/60">Author:</span>{' '}
                                    {reflection.commits[0].author.name}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-emerald-400 mb-1">Commits</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                  {reflection.commits.map(commit => (
                                    <a 
                                      key={commit.id}
                                      href={commit.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-sm text-white hover:text-purple-400 transition-colors"
                                    >
                                      <div className="flex items-start gap-2">
                                        <code className="text-xs text-purple-400/90 font-mono whitespace-nowrap">
                                          {commit.id.substring(0, 7)}
                                        </code>
                                        <span className="break-words">{commit.message}</span>
                                      </div>
                                      <div className="text-xs text-white/50 mt-0.5 pl-[3.5rem]">
                                        {format(new Date(commit.timestamp), 'MMM d, h:mm a')}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-yellow-400 mb-1">Files Changed</p>
                                <div className="space-y-4 max-h-[200px] overflow-y-auto">
                                  {reflection.added?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-green-400 mb-1">Added</p>
                                      {reflection.added.map((file, index) => (
                                        <div key={`added-${index}`} className="text-sm text-white/80 pl-2">
                                          {file}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {reflection.modified?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-blue-400 mb-1">Modified</p>
                                      {reflection.modified.map((file, index) => (
                                        <div key={`modified-${index}`} className="text-sm text-white/80 pl-2">
                                          {file}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {reflection.removed?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-red-400 mb-1">Removed</p>
                                      {reflection.removed.map((file, index) => (
                                        <div key={`removed-${index}`} className="text-sm text-white/80 pl-2">
                                          {file}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {reflection.reflection ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-4 mt-1" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(reflection.id)}
                      className="border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 ml-4"
                    >
                      <Pencil className="h-4 w-4 mr-2 text-purple-500" />
                      Write Reflection
                    </Button>
                  )}
                </div>

                {/* Commits - Only show additional commits if there are more than one */}
                {reflection.commits.length > 1 && (
                  <div className="mb-4">
                    <h5 className={cn(
                      "font-medium mb-2 flex items-center",
                      reflection.reflection ? "text-blue-400/70" : "text-blue-400"
                    )}>
                      <FileText className="w-4 h-4 mr-2" />
                      Additional Commits:
                    </h5>
                    <ul className="space-y-2">
                      {reflection.commits.slice(1).map(commit => (
                        <li key={commit.id} className={cn(
                          "group transition-colors duration-200",
                          reflection.reflection 
                            ? "text-muted-foreground/80 hover:text-blue-400/70"
                            : "text-muted-foreground hover:text-blue-400"
                        )}>
                          <a 
                            href={commit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center hover:text-purple-400 transition-colors"
                          >
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
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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