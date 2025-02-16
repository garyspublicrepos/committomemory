import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

export function NotificationToggle() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const checkSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported')
        return
      }

      // Wait for service worker registration
      const registration = await navigator.serviceWorker.ready
      console.log('Service worker ready:', registration)

      const existingSubscription = await registration.pushManager.getSubscription()
      console.log('Existing subscription:', existingSubscription)
      setSubscription(existingSubscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
      toast({
        title: 'Error',
        description: 'Failed to check notification status',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const subscribe = async () => {
    try {
      setLoading(true)

      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be signed in to enable notifications',
          variant: 'destructive'
        })
        return
      }

      // Wait for service worker registration
      const registration = await navigator.serviceWorker.ready
      console.log('Service worker ready for subscription')

      // Request notification permission
      const permission = await Notification.requestPermission()
      console.log('Notification permission:', permission)
      
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings',
          variant: 'destructive'
        })
        return
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not found')
        toast({
          title: 'Configuration Error',
          description: 'Push notification setup is incomplete',
          variant: 'destructive'
        })
        return
      }

      // Convert VAPID key to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })
      console.log('Push subscription created:', subscription)

      // Save subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: user.uid
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setSubscription(subscription)
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive notifications about your reflections'
      })
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    try {
      setLoading(true)

      if (!user || !subscription) return

      // Unsubscribe from push notifications
      await subscription.unsubscribe()
      console.log('Unsubscribed from push notifications')

      // Remove subscription from backend
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription')
      }

      setSubscription(null)
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive notifications'
      })
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to disable notifications. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't render if notifications are not supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={subscription ? unsubscribe : subscribe}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscription ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {subscription ? 'Disable' : 'Enable'} Notifications
    </Button>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
} 