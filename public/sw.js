self.addEventListener('push', function (event) {
	console.log('📥 PUSH EVENT:', event)

	try {
		const data = event.data?.json()
		console.log('📦 Parsed payload:', data)

		const title = data.title || '📅 Powiadomienie'
		const options = {
			body: data.body || 'Masz nowe zadania do wykonania.',
			icon: '/siteIcon/icon.svg',
			vibrate: [200, 100, 200],
			data: {
				url: '/calendar',
			},
		}

		event.waitUntil(self.registration.showNotification(title, options))
	} catch (err) {
		console.error('❌ Błąd w push event:', err)
	}
})

self.addEventListener('notificationclick', function (event) {
	console.log('🔔 Notification clicked', event)
	event.notification.close()

	const url = event.notification.data?.url || '/'

	event.waitUntil(
		clients.matchAll({ type: 'window' }).then(windowClients => {
			for (const client of windowClients) {
				if (client.url.includes(url) && 'focus' in client) {
					return client.focus()
				}
			}
			if (clients.openWindow) {
				return clients.openWindow(url)
			}
		})
	)
})
