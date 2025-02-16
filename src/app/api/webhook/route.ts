import { NextResponse } from 'next/server'
import type { GithubWebhookPayload } from '@/types'
import { verifyGithubWebhook } from '@/lib/github'
import { getOrganizationWebhookByName } from '@/lib/services/organization'
import { createPushReflection } from '@/lib/services/reflection'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody)
    const event = request.headers.get('x-github-event')
    
    // Get organization name from the payload
    const orgName = payload.organization?.login
    if (!orgName) {
      throw new Error('No organization found in webhook payload')
    }

    // Get webhook details to verify signature
    const webhook = await getOrganizationWebhookByName(orgName)
    if (!webhook) {
      console.error('No webhook found:', { orgName, event })
      return NextResponse.json(
        { error: 'No webhook found for this organization' },
        { status: 404 }
      )
    }

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256')
    if (!signature || !verifyGithubWebhook(rawBody, signature, webhook.webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Handle ping event
    if (event === 'ping') {
      return NextResponse.json({ message: 'Webhook verified successfully' })
    }

    // Handle push event
    if (event === 'push') {
      const pushPayload = payload as GithubWebhookPayload
      
      // Only create a reflection if there are commits
      if (pushPayload.commits && pushPayload.commits.length > 0) {
        const reflectionId = await createPushReflection(
          webhook.userId,
          pushPayload.repository.name,
          pushPayload.commits
        )

        // Send push notification
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(`${baseUrl}/api/push/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: webhook.userId,
              title: 'New Code Changes',
              body: `You have new changes to reflect on in ${pushPayload.repository.name}`,
              url: `/dashboard#${reflectionId}`
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error('Push notification failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            })
          } else {
            console.log('Push notification sent successfully')
          }
        } catch (error) {
          console.error('Error sending push notification:', error)
          // Continue even if notification fails
        }

        return NextResponse.json({ 
          message: 'Push reflection created successfully',
          reflectionId
        })
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing webhook' },
      { status: 500 }
    )
  }
} 