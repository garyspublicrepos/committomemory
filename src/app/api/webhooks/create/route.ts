import { NextResponse } from 'next/server'
import { createOrganizationWebhook } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const { organization, token } = await request.json()

    if (!organization || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const webhook = await createOrganizationWebhook(organization, token)

    return NextResponse.json(webhook)
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create webhook' },
      { status: 500 }
    )
  }
} 