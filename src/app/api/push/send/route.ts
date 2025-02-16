import { NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import webpush from 'web-push'

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json()

    // Get user's push subscription
    const subscriptionDoc = await getDoc(doc(db, 'pushSubscriptions', userId))
    if (!subscriptionDoc.exists()) {
      return NextResponse.json(
        { error: 'No subscription found for user' },
        { status: 404 }
      )
    }

    const { subscription } = subscriptionDoc.data()
    if (!subscription) {
      return NextResponse.json(
        { error: 'User has no active subscription' },
        { status: 404 }
      )
    }

    // Send push notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        url
      })
    )

    return NextResponse.json({ message: 'Notification sent successfully' })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
} 