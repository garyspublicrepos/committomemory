import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 300 // 5 minutes

interface OpenAIError {
  message: string
  response?: {
    data?: unknown
  }
}

export async function POST(request: Request) {
  try {
    // Get the audio file and API key from the request
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob
    const apiKey = process.env.OPENAI_API_KEY // Changed to use server-side env var
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Audio file size:', audioFile.size, 'bytes')
    console.log('Audio file type:', audioFile.type)

    const openai = new OpenAI({ apiKey })

    // Convert Blob to File
    const file = new File([audioFile], 'audio.wav', { type: 'audio/wav' })

    try {
      // Transcribe using OpenAI Whisper
      const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      })

      console.log('Transcription successful')
      return NextResponse.json({ text: response.text })
    } catch (openaiError: unknown) {
      console.error('OpenAI transcription error:', openaiError)
      const error = openaiError as OpenAIError
      return NextResponse.json(
        { 
          error: error.message || 'OpenAI transcription failed',
          details: error.response?.data || error
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Error in speech-to-text API:', error)
    const err = error as Error
    return NextResponse.json(
      { 
        error: err.message || 'Failed to transcribe audio',
        details: err
      },
      { status: 500 }
    )
  }
} 