'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Loader2 } from 'lucide-react'
import { usePushToTalkVoiceConversation } from '@/hooks/use-voice-conversation'
import { cn } from '@/lib/utils'

interface PushToTalkProps {
  onMessage: (message: string) => void
  onError: (error: Error) => void
  className?: string
}

export function PushToTalk({ onMessage, onError, className }: PushToTalkProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    isListening,
    isWarmingUp,
    isProcessing,
    startListening,
    stopListening
  } = usePushToTalkVoiceConversation({
    token: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
    onMessage,
    onError,
    onSpeakingChange: () => {}
  })

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isProcessing) {
        e.preventDefault()
        startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (isListening || isWarmingUp)) {
        e.preventDefault()
        stopListening()
      }
    }

    button.addEventListener('keydown', handleKeyDown)
    button.addEventListener('keyup', handleKeyUp)

    return () => {
      button.removeEventListener('keydown', handleKeyDown)
      button.removeEventListener('keyup', handleKeyUp)
    }
  }, [isListening, isWarmingUp, isProcessing, startListening, stopListening])

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="icon"
      className={cn(
        "relative transition-all duration-200",
        isListening && "bg-red-500/10 border-red-500/50 hover:bg-red-500/20 hover:border-red-500/50",
        isWarmingUp && "bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-500/50",
        isProcessing && "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500/50",
        className
      )}
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onMouseLeave={stopListening}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      ) : (
        <Mic className={cn(
          "h-4 w-4",
          isListening && "text-red-500",
          isWarmingUp && "text-yellow-500"
        )} />
      )}
    </Button>
  )
} 