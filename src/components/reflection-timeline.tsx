'use client'

import { format, isSameDay } from 'date-fns'
import { MessageSquare, FileText } from 'lucide-react'
import { PushReflection } from '@/types'
import { cn } from '@/lib/utils'

interface ReflectionTimelineProps {
  reflections: PushReflection[]
  onSelectReflection: (id: string) => void
  selectedId: string | null
}

interface GroupedReflections {
  date: Date
  reflections: PushReflection[]
}

export function ReflectionTimeline({ reflections, onSelectReflection, selectedId }: ReflectionTimelineProps) {
  // Group reflections by date
  const groupedReflections = reflections.reduce((groups: GroupedReflections[], reflection) => {
    const date = reflection.createdAt
    const existingGroup = groups.find(group => isSameDay(group.date, date))
    
    if (existingGroup) {
      existingGroup.reflections.push(reflection)
    } else {
      groups.push({ date, reflections: [reflection] })
    }
    
    return groups
  }, []).sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by most recent first

  return (
    <div className="relative space-y-8">
      {groupedReflections.map((group, groupIndex) => (
        <div key={group.date.toISOString()} className="relative">
          {/* Date Header */}
          <h3 className="text-lg font-semibold mb-4 text-purple-400">
            {format(group.date, 'MMMM d, yyyy')}
          </h3>
          
          {/* Reflections for this date */}
          <div className="space-y-4">
            {group.reflections.map((reflection) => (
              <div
                key={reflection.id}
                className={cn(
                  "cursor-pointer group relative",
                  "hover:opacity-100 transition-all duration-200",
                  "p-4 rounded-lg",
                  selectedId === reflection.id ? 
                    "bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-100" : 
                    "opacity-80 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-blue-500/5"
                )}
                onClick={() => onSelectReflection(reflection.id)}
              >
                {/* Content */}
                <h4 className={cn(
                  "text-base font-medium mb-2 transition-colors duration-200",
                  selectedId === reflection.id ? "text-purple-500" : "text-foreground group-hover:text-purple-500"
                )}>
                  {reflection.repositoryName}
                </h4>
                
                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className={cn(
                    "flex items-center transition-colors duration-200",
                    selectedId === reflection.id ? "text-blue-400" : "text-muted-foreground"
                  )}>
                    <FileText className="w-4 h-4 mr-1" />
                    {reflection.commits.length} commit{reflection.commits.length !== 1 ? 's' : ''}
                  </div>
                  {reflection.reflection && (
                    <div className={cn(
                      "flex items-center transition-colors duration-200",
                      selectedId === reflection.id ? "text-emerald-400" : "text-muted-foreground"
                    )}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Reflection added
                    </div>
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