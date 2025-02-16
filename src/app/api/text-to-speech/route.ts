import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Get the Google Cloud API key from environment variables
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud API key not configured' },
        { status: 500 }
      )
    }

    // Send to Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-D',
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Google Cloud API error: ${response.statusText}`)
    }

    const data = await response.json()
    const audioContent = data.audioContent

    // Convert base64 to ArrayBuffer
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Return the audio data
    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': 'audio/mp3'
      }
    })
  } catch (error) {
    console.error('Error in text-to-speech:', error)
    return NextResponse.json(
      { error: 'Failed to convert text to speech' },
      { status: 500 }
    )
  }
} 