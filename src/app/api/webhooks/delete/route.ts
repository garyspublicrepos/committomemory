import { NextResponse } from 'next/server'
import { deleteGithubWebhook } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const { organization, webhookId, token } = await request.json()

    if (!organization || !webhookId || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await deleteGithubWebhook(organization, webhookId, token)

    return NextResponse.json({ message: 'Webhook deleted successfully' })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete webhook' },
      { status: 500 }
    )
  }
} 