self.addEventListener('push', function(event) {
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    data: {
      url: data.url
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
}) 