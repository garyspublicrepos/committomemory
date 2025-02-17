'use client'

import { format, isToday, isSameDay, isYesterday, subDays } from 'date-fns'
import { MessageSquare, FileText, Pencil, CheckCircle2, Brain, Zap, Trophy, Search, Info, XCircle, Flame, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { PushReflection } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReflectionEditor } from '@/components/reflection-editor'
import { useState, useEffect, useMemo, useRef } from 'react'
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

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .glow-effect {
    animation: slowGlow 3s ease-in-out infinite;
  }

  .fade-in {
    animation: fadeIn 3s ease-out forwards;
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
      `${stats.streak} days in a row! You're on fire! 🔥`,
      `${stats.streak}-day streak! Keep the momentum going! ⚡️`,
      `Unstoppable! ${stats.streak} consecutive days of learning! 🚀`,
      `${stats.streak}-day reflection streak - what a journey! 🎯`,
      `You're crushing it with ${stats.streak} days straight! 💪`
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // First reflection
  if (stats.completed === 1) {
    const messages = [
      "Great start! Keep the reflections coming! ✨",
      "First reflection of the day - nicely done! ��",
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

// Add this component at the top level, before ReflectionTimeline
function GrowthCompanionMessage({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('ended', () => setIsPlaying(false))
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ margin: 0 }}>
      <div className="relative fade-in">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 p-[2px] -m-[2px]">
          {/* Inner ring with glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 blur-md" />
        </div>

        {/* Main circular container */}
        <div className="w-[400px] h-[400px] rounded-full overflow-hidden relative bg-zinc-900/95 border border-white/10">
          {/* Video element */}
          <video
            ref={videoRef}
            src="/demo.mp4"
            className="w-full h-full object-cover"
            playsInline
          />
          
          {/* Subtle overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* Play/Pause button - Moved outside the main container */}
        <div 
          className="absolute bottom-5 right-5 cursor-pointer group z-[60]"
          onClick={togglePlayback}
        >
          <div className="transform transition-all group-hover:scale-110">
            {isPlaying ? (
              <div className="w-16 h-16 rounded-full bg-white/60 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl hover:border-black/20">
                <Pause className="h-8 w-8 text-black" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/60 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl hover:border-black/20">
                <Play className="h-8 w-8 text-black ml-1" />
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-2 -right-2 rounded-full w-8 h-8 bg-zinc-900 border border-white/20 hover:bg-zinc-800 hover:border-white/40 transition-all shadow-lg"
        >
          <XCircle className="h-6 w-6 text-white/80" />
        </Button>
      </div>
    </div>
  )
}

export function ReflectionTimeline({ reflections }: ReflectionTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMessage, setShowMessage] = useState(true)

  // Calculate daily stats and streak from all reflections (not filtered)
  const todayStats = useMemo(() => {
    // First, calculate today's stats
    const today = reflections.reduce((stats, reflection) => {
      if (isToday(reflection.createdAt)) {
        stats.total++
        if (reflection.reflection) {
          stats.completed++
        }
      }
      return stats
    }, { total: 0, completed: 0, streak: 0 })

    // Then, calculate the streak by looking at consecutive days with reflections
    const reflectionDays = new Set(
      reflections
        .filter(r => r.reflection) // Only count days with completed reflections
        .map(r => format(r.createdAt, 'yyyy-MM-dd'))
    )

    let currentStreak = 0
    let date = new Date()

    // If no reflection today, check if we had one yesterday to continue the streak
    if (!reflectionDays.has(format(date, 'yyyy-MM-dd'))) {
      if (!reflectionDays.has(format(subDays(date, 1), 'yyyy-MM-dd'))) {
        // No reflection yesterday either, start counting from the most recent day with a reflection
        const sortedDays = Array.from(reflectionDays).sort().reverse()
        if (sortedDays.length > 0) {
          date = new Date(sortedDays[0])
        }
      } else {
        // Had reflection yesterday, start counting from yesterday
        date = subDays(date, 1)
      }
    }

    // Count consecutive days
    while (reflectionDays.has(format(date, 'yyyy-MM-dd'))) {
      currentStreak++
      date = subDays(date, 1)
    }

    return { ...today, streak: currentStreak }
  }, [reflections])

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
  const mostRecentUnreflectedPush = reflections.find(r => r.status === 'pending')

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
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Your Week in Code</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-lg text-purple-400 font-semibold">
              Learnings:
            </div>
            <div className="text-lg text-purple-400/70 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-purple-400/10 text-purple-400 text-sm">Reflected on 22 git pushes this week</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-lg text-blue-400 font-semibold">
              New libraries:
            </div>
            <div className="text-lg text-blue-400/70 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-blue-400/10 text-blue-400 text-sm">Browser-use</span>
              <span className="px-2 py-1 rounded bg-blue-400/10 text-blue-400 text-sm">Hedra</span>
              <span className="px-2 py-1 rounded bg-blue-400/10 text-blue-400 text-sm">Comfy-UI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-lg text-emerald-400 font-semibold">
              Skills grown:
            </div>
            <div className="text-lg text-emerald-400/70 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 text-sm">API Design</span>
              <span className="px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 text-sm">UI/UX</span>
              <span className="px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 text-sm">TypeScript</span>
              <span className="px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 text-sm">Python</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-amber-400">
              6 days
            </div>
            <div className="text-lg text-amber-400/70 flex items-center">
              Daily streak
              <span className="inline-flex items-center ml-2">
                <Flame className="h-5 w-5 text-amber-400/70" />
              </span>
              <span className="ml-2 text-amber-400/70">(new record!)</span>
            </div>
          </div>
        </div>
      </div>

      {showMessage && <GrowthCompanionMessage onClose={() => setShowMessage(false)} />}

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
                  reflection.status === 'completed'
                    ? "bg-gradient-to-r from-purple-500/[0.02] to-blue-500/[0.02] border border-white/10"  // Completed reflections
                    : reflection.status === 'skipped'
                    ? "bg-gradient-to-r from-gray-500/[0.02] to-gray-500/[0.02] border border-white/10"  // Skipped reflections
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
                      reflection.status !== 'pending' ? "text-white/80" : "text-white"
                    )}>
                      {reflection.commits[0].message}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "text-sm",
                        reflection.status !== 'pending' ? "text-purple-500/70" : "text-purple-500"
                      )}>
                        <span className="text-muted-foreground">in</span>{' '}
                        {reflection.repositoryName}
                        <span className="text-muted-foreground ml-2">by</span>{' '}
                        <span className={cn(
                          reflection.status !== 'pending' ? "text-blue-400/70" : "text-blue-400"
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
                  {reflection.status === 'completed' || (reflection.reflection && reflection.reflection.trim().length > 0) ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-4 mt-1" />
                  ) : reflection.status === 'skipped' ? (
                    <XCircle className="h-5 w-5 text-gray-500 ml-4 mt-1" />
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
                      reflection.status !== 'pending' ? "text-blue-400/70" : "text-blue-400"
                    )}>
                      <FileText className="w-4 h-4 mr-2" />
                      Additional Commits:
                    </h5>
                    <ul className="space-y-2">
                      {reflection.commits.slice(1).map(commit => (
                        <li key={commit.id} className={cn(
                          "group transition-colors duration-200",
                          reflection.status !== 'pending' ? "text-muted-foreground/80 hover:text-blue-400/70" : "text-muted-foreground hover:text-blue-400"
                        )}>
                          <a 
                            href={commit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center hover:text-purple-400 transition-colors"
                          >
                            <code className={cn(
                              "text-sm font-mono",
                              reflection.status !== 'pending' ? "text-purple-400/70 group-hover:text-purple-500/70" : "text-purple-400 group-hover:text-purple-500"
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
                    reflection.status !== 'pending' ? "text-emerald-400/70" : "text-emerald-400"
                  )}>
                  </h5>
                  {editingId === reflection.id ? (
                    <ReflectionEditor
                      reflection={reflection}
                      onSave={handleSaveReflection}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <p className={cn(
                      reflection.status !== 'pending' ? "text-muted-foreground/80" : "text-muted-foreground"
                    )}>
                      {reflection.status === 'skipped' 
                        ? 'Skipped' 
                        : (reflection.reflection || 'No reflection written yet')}
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