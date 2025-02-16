import { useState, useCallback, useRef, useEffect } from 'react'
import { styledToast } from '@/lib/utils'

interface UseVoiceConversationProps {
  token: string
  onMessage: (message: string) => void
  onError: (error: Error) => void
  onSpeakingChange: (isSpeaking: boolean) => void
}

enum VoiceState {
  IDLE = 'idle',
  WARMING_UP = 'warming_up', 
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking'
}

// Initialize MediaRecorder dynamically on the client side
let isEncoderRegistered = false
let currentMimeType = 'audio/wav'

const isSafari = () => {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('safari') && !ua.includes('chrome')
}

const initMediaRecorder = async (stream: MediaStream) => {
  if (typeof window === 'undefined') return null

  try {
    console.log('Initializing MediaRecorder with stream:', {
      active: stream.active,
      tracks: stream.getTracks().length
    })

    // Special handling for Safari
    if (isSafari()) {
      console.log('Safari detected, using m4a configuration')
      currentMimeType = 'audio/mp4'
      return new window.MediaRecorder(stream)
    }

    // For other browsers, prefer formats compatible with Deepgram
    if (typeof window.MediaRecorder !== 'undefined') {
      const formats = [
        'audio/webm',  // Most compatible format
        'audio/ogg',   // Good fallback
        'audio/mp4',   // For Safari
        'audio/wav'    // Last resort
      ]

      for (const format of formats) {
        if (window.MediaRecorder.isTypeSupported(format)) {
          try {
            currentMimeType = format
            console.log('Using format:', format)
            return new window.MediaRecorder(stream, { mimeType: format })
          } catch (e) {
            console.warn(`Failed to initialize with ${format}:`, e)
          }
        }
      }
    }

    // If no native format worked, fall back to WAV
    console.log('Falling back to WAV format...')
    const [{ MediaRecorder }, { connect }] = await Promise.all([
      import('extendable-media-recorder'),
      import('extendable-media-recorder-wav-encoder')
    ])

    if (!isEncoderRegistered) {
      console.log('Registering WAV encoder...')
      await connect()
      isEncoderRegistered = true
      console.log('WAV encoder registered')
    }

    currentMimeType = 'audio/wav'
    return new MediaRecorder(stream, { mimeType: 'audio/wav' })

  } catch (e) {
    console.error('Failed to initialize MediaRecorder:', e)
    throw new Error('Failed to initialize recording. Please try using a modern browser like Chrome or Safari.')
  }
}

const handleRecordingError = (error: Error) => {
  console.error('Error accessing microphone:', error)

  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    styledToast.error('Microphone access was denied. Please check your browser settings.')
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    styledToast.error('No microphone found. Please connect a microphone and try again.')
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    styledToast.error('Your microphone is currently being used by another application. Please close other apps using the microphone or try again later.')
  } else if (error.name === 'AbortError') {
    styledToast.error('Failed to access microphone. If you\'re in a call, please end it before recording.')
  } else if (error.name === 'OverconstrainedError') {
    styledToast.error('Your microphone settings are not compatible. Please try using a different microphone.')
  } else {
    styledToast.error('Failed to start recording. Please try again or use a different browser.')
  }
}

export function usePushToTalkVoiceConversation({
  token,
  onMessage,
  onError,
  onSpeakingChange
}: UseVoiceConversationProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.IDLE)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const audioSource = useRef<AudioBufferSourceNode | null>(null)
  const stopTimeout = useRef<NodeJS.Timeout | null>(null)
  const warmupTimeout = useRef<NodeJS.Timeout | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioQueue = useRef<ArrayBuffer[]>([])
  const isPlaying = useRef(false)

  // Clean up audio resources
  const cleanupAudio = useCallback(() => {
    if (audioSource.current) {
      audioSource.current.stop()
      audioSource.current.disconnect()
      audioSource.current = null
    }
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (stopTimeout.current) {
      clearTimeout(stopTimeout.current)
      stopTimeout.current = null
    }
    if (warmupTimeout.current) {
      clearTimeout(warmupTimeout.current)
      warmupTimeout.current = null
    }
  }, [])

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContext.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContext.current = new AudioContextClass()
      
      // Resume audio context for iOS Safari
      if (audioContext.current.state === 'suspended') {
        const resumeAudioContext = () => {
          audioContext.current?.resume()
          document.removeEventListener('touchstart', resumeAudioContext)
          document.removeEventListener('touchend', resumeAudioContext)
          document.removeEventListener('click', resumeAudioContext)
        }
        document.addEventListener('touchstart', resumeAudioContext)
        document.addEventListener('touchend', resumeAudioContext)
        document.addEventListener('click', resumeAudioContext)
      }
    }
    return audioContext.current
  }, [])

  // Play the next audio in the queue
  const playNextInQueue = useCallback(async () => {
    if (audioQueue.current.length === 0 || isPlaying.current) {
      return
    }

    isPlaying.current = true
    const arrayBuffer = audioQueue.current.shift()!

    try {
      const context = initAudioContext()
      
      // Resume context before playing (required for iOS Safari)
      if (context.state === 'suspended') {
        await context.resume()
      }
      
      const audioBuffer = await context.decodeAudioData(arrayBuffer)
      
      if (audioSource.current) {
        audioSource.current.stop()
        audioSource.current.disconnect()
      }

      audioSource.current = context.createBufferSource()
      audioSource.current.buffer = audioBuffer
      audioSource.current.connect(context.destination)
      
      audioSource.current.onended = () => {
        isPlaying.current = false
        setVoiceState(VoiceState.IDLE)
        onSpeakingChange(false)
        // Play next audio if available
        playNextInQueue()
      }
      
      setVoiceState(VoiceState.SPEAKING)
      onSpeakingChange(true)
      audioSource.current.start(0)
    } catch (error) {
      console.error('Error playing audio:', error)
      isPlaying.current = false
      onError(error as Error)
      // Try to play next audio even if current one failed
      playNextInQueue()
    }
  }, [initAudioContext, onError, onSpeakingChange])

  // Convert text to speech and add to queue
  const speakText = useCallback(async (text: string) => {
    try {
      // Try to initialize and resume audio context first
      const context = initAudioContext()
      if (!context || context.state === 'closed') {
        console.error('Audio context not available')
        return
      }

      // Ensure audio context can be resumed
      if (context.state === 'suspended') {
        try {
          await context.resume()
        } catch (error) {
          console.error('Failed to resume audio context:', error)
          return
        }
      }

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Failed to convert text to speech')
      }

      const arrayBuffer = await response.arrayBuffer()
      audioQueue.current.push(arrayBuffer)
      playNextInQueue()
    } catch (error) {
      console.error('Error in text to speech:', error)
      onError(error as Error)
    }
  }, [token, playNextInQueue, onError, initAudioContext])

  // Stop listening for voice input
  const stopListening = useCallback(() => {
    setVoiceState(VoiceState.PROCESSING) // Update UI immediately
    
    // Clear any existing timeout
    if (stopTimeout.current) {
      clearTimeout(stopTimeout.current)
    }
    
    // Set new timeout to actually stop recording in 1.3 seconds
    stopTimeout.current = setTimeout(() => {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      stopTimeout.current = null
    }, 1300)
  }, [])

  // Start listening for voice input
  const startListening = useCallback(async () => {
    try {
      // First check if we can even get a media stream
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16
          }
        })
      } catch (error: unknown) {
        handleRecordingError(error as Error)
        return
      }

      console.log('Got media stream:', stream)
      mediaStreamRef.current = stream
      
      console.log('Initializing MediaRecorder...')
      const recorder = await initMediaRecorder(stream)
      if (!recorder) {
        throw new Error('Failed to initialize MediaRecorder')
      }
      console.log('MediaRecorder initialized:', recorder)
      mediaRecorder.current = recorder as unknown as MediaRecorder

      const audioChunks: Blob[] = []

      mediaRecorder.current.ondataavailable = (event) => {
        console.log('Data available:', event.data.size)
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: currentMimeType })
          console.log('Created audio blob:', audioBlob.size, 'with type:', currentMimeType)
          
          // Create form data with the audio and mime type
          const formData = new FormData()
          formData.append('audio', audioBlob)
          formData.append('mimeType', currentMimeType)

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error('Failed to transcribe audio')
          }

          const { text } = await response.json()
          if (text) {
            onMessage(text)
          }
        } catch (error) {
          console.error('Error transcribing audio:', error)
          onError(error as Error)
        } finally {
          setIsVoiceMode(false)
          setVoiceState(VoiceState.IDLE)
        }
      }

      // Start recording immediately
      setIsVoiceMode(true)
      mediaRecorder.current.start(1000) // Collect data every second
      
      // Show warming up state but don't delay recording
      setVoiceState(VoiceState.WARMING_UP)
      warmupTimeout.current = setTimeout(() => {
        // Only update UI state to listening after warmup
        setVoiceState(VoiceState.LISTENING)
        warmupTimeout.current = null
      }, 1000)

      // Set 15-second timeout for recording
      stopTimeout.current = setTimeout(() => {
        stopListening()
        styledToast.info('Recording time limit reached (2 minutes). Processing...')
      }, 120000) // 2 minutes in milliseconds

    } catch (error) {
      console.error('Error starting voice recording:', error)
      onError(error as Error)
      setIsVoiceMode(false)
    }
  }, [token, onMessage, onError, stopListening])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudio()
      if (audioContext.current) {
        audioContext.current.close()
      }
      audioQueue.current = []
      isPlaying.current = false
    }
  }, [cleanupAudio])

  return {
    isListening: voiceState === VoiceState.LISTENING,
    isWarmingUp: voiceState === VoiceState.WARMING_UP,
    isVoiceMode,
    isSpeaking: voiceState === VoiceState.SPEAKING,
    isProcessing: voiceState === VoiceState.PROCESSING,
    startListening,
    stopListening,
    speakText
  }
}