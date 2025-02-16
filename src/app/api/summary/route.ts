import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function POST(request: Request) {
  try {
    const { reflections, prompt } = await request.json()

    // Combine the prompt and reflections
    const fullPrompt = `${prompt}\n\nHere are the reflections to analyze:\n\n${reflections}`

    // Generate the summary
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const summary = response.text()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
} 