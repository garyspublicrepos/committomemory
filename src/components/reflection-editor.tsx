'use client'

import { useState, ChangeEvent, useRef, useCallback } from 'react'
import { Loader2, MessageSquare, Mic, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateReflection } from '@/lib/services/reflection'
import { cn } from '@/lib/utils'
import type { PushReflection, ReflectionStatus } from '@/types'

interface ReflectionEditorProps {
  reflection: PushReflection
  onSave: (updatedReflection: PushReflection) => void
  onCancel: () => void
}

export function ReflectionEditor({ reflection, onSave, onCancel }: ReflectionEditorProps) {
  const [content, setContent] = useState(reflection.reflection)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        }
      })
      
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder
      audioChunks.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        
        try {
          setLoading(true)
          const formData = new FormData()
          formData.append('audio', audioBlob)

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Failed to transcribe audio')
          }

          const { text } = await response.json()
          
          // Append transcribed text to existing content
          setContent(prev => {
            const separator = prev.trim().length > 0 ? ' ' : ''
            return prev.trim() + separator + text.trim()
          })
        } catch (error) {
          console.error('Transcription error:', error)
          setError('Failed to transcribe audio. Please try again.')
        } finally {
          setLoading(false)
          setIsRecording(false)
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
        }
      }

      recorder.start()
      setIsRecording(true)
      setError(null)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to access microphone. Please check your permissions.')
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
  }, [])

  const handleSave = async (status: ReflectionStatus) => {
    setLoading(true)
    setError(null)

    try {
      const id = reflection.id
      if (!id) {
        throw new Error('Reflection ID is missing')
      }

      // For skipped status, we don't need content
      const reflectionContent = status === 'skipped' ? '' : content

      await updateReflection(id, reflectionContent, status)
      onSave({
        ...reflection,
        reflection: reflectionContent,
        status,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error saving reflection:', error)
      setError('Failed to save reflection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    await handleSave('skipped')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium flex items-center text-emerald-400">
          <MessageSquare className="w-4 h-4 mr-2" />
          Your Reflection:
        </h5>
      </div>

      <div className="relative">
        <Textarea
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="Write your reflection here..."
          className="min-h-[200px] bg-white/[0.08] text-white placeholder:text-white/50 border-white/20 focus:border-white/30 focus:bg-white/[0.12] pr-12"
          disabled={loading}
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute right-2 top-2 h-8 w-8 transition-colors",
            isRecording && "text-red-500 bg-red-500/10",
            loading && "pointer-events-none opacity-50"
          )}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          type="button"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className={cn(
              "h-4 w-4",
              isRecording && "animate-pulse"
            )} />
          )}
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="flex justify-between gap-2">
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={loading}
          className="text-muted-foreground hover:text-white"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Skip Reflection
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave('completed')}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Reflection'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 