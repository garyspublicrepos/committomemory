import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

export function NotificationToggle() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      setSubscription(existingSubscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

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

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings',
          variant: 'destructive'
        })
        return
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

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