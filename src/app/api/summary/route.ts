import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PushReflection } from '@/types'
import { format } from 'date-fns'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

export async function POST(request: Request) {
  try {
    const { reflections, prompt } = await request.json() as { 
      reflections: PushReflection[]
      prompt: string 
    }
    
    if (!reflections || !Array.isArray(reflections)) {
      return NextResponse.json(
        { error: 'Invalid reflections data' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Format reflections into a readable text
    const formattedReflections = reflections.map(r => `
Date: ${format(new Date(r.createdAt), 'PPP')}
Repository: ${r.repositoryName}
Commits: ${r.commits.map((c) => `\n- ${c.message}`).join('')}
Reflection: ${r.reflection}
    `).join('\n---\n')

    // Combine the user's prompt with the formatted reflections
    const finalPrompt = `${prompt}

Reflections:
${formattedReflections}`

    // Generate summary with Gemini
    const result = await model.generateContent(finalPrompt)
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