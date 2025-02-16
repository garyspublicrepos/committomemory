self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
})

self.addEventListener('push', function(event) {
  console.log('Push notification received:', event.data?.text())
  
  if (!event.data) {
    console.log('No data received with push event')
    return
  }

  try {
    const data = event.data.json()
    console.log('Push data:', data)
    
    const options = {
      body: data.body,
      icon: '/icon.png',
      badge: '/badge.png',
      data: {
        url: data.url
      },
      actions: [
        {
          action: 'open',
          title: 'View'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Error processing push notification:', error)
  }
})

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    if (event.notification.data?.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      )
    }
  }
}) 