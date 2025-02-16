import { NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
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
    const { subscription, userId } = await request.json()

    // Store the subscription in Firestore
    await setDoc(
      doc(db, 'pushSubscriptions', userId),
      {
        subscription,
        userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )

    return NextResponse.json({ message: 'Subscription saved successfully' })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    // Remove the subscription from Firestore
    await setDoc(
      doc(db, 'pushSubscriptions', userId),
      {
        subscription: null,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )

    return NextResponse.json({ message: 'Subscription removed successfully' })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
} 