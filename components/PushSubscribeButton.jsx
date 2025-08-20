'use client'

import { useEffect, useState } from 'react'
import Spin from './ui/spin'

export default function PushSubscribeButton() {
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [permission, setPermission] = useState(() =>
		typeof Notification !== 'undefined' ? Notification.permission : 'default'
	)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then(sw => {
				sw.pushManager.getSubscription().then(sub => {
					setIsSubscribed(!!sub)
				})
			})
		}
	}, [])

	const subscribe = async () => {
		setLoading(true)
		try {
			if (!('serviceWorker' in navigator)) return

			const sw = await navigator.serviceWorker.register('/sw.js')
			const reg = await navigator.serviceWorker.ready

			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey:
					process.env.VAPID_PUBLIC_KEY ||
					'BOMcZCFI1pr11AVYKJExa9xowgKQCJZmnRhEFFIYOHYlAqSHf3JgzWgOSUj7KISVH-enzQ1P9hk6PF5SpuxyY9I',
			})

			await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(sub),
			})

			setIsSubscribed(true)
			console.log('✅ Подписка успешна:', sub)
		} catch (error) {
			console.error('❌ Ошибка подписки:', error)
		} finally {
			setLoading(false)
		}
	}

	const unsubscribe = async () => {
		setLoading(true)
		try {
			const reg = await navigator.serviceWorker.ready
			const sub = await reg.pushManager.getSubscription()

			if (sub) {
				await sub.unsubscribe()
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ endpoint: sub.endpoint }),
				})
				setIsSubscribed(false)
			}
		} catch (error) {
			console.error('❌ Ошибка отписки:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleClick = async () => {
		if (loading) return

		if (typeof Notification === 'undefined') {
			console.warn('Notification API is not supported in this browser')
			return
		}

		if (permission !== 'granted') {
			const result = await Notification.requestPermission()
			setPermission(result)
			if (result !== 'granted') return
		}

		if (!isSubscribed) {
			await subscribe()
		} else {
			await unsubscribe()
		}
	}

	return (
		<button
			onClick={handleClick}
			className='px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2'
			disabled={loading}
		>
			{loading ? <Spin size='small' /> : null}
			{isSubscribed ? 'Wyłącz powiadomienia' : 'Włącz powiadomienia'}
		</button>
	)
}
