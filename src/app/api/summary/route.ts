import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function POST(request: Request) {
  try {
    const { reflections, prompt } = await request.json()
    const currentTime = format(new Date(), 'PPPp')

    // Combine the prompt and reflections with explicit plain text instruction
    const fullPrompt = `IMPORTANT: Format requirements for your response:
1. Use plain text only - no markdown formatting or special characters
2. Use dashes (-) for all bullet points
3. Be concise and direct - avoid unnecessary words or repetition
4. Keep paragraphs short and focused

Generated on: ${currentTime}

${prompt}

Here are the reflections to analyze:

${reflections}`

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