'use client'

import { useEffect } from 'react'

export default function OneSignalInit() {
	useEffect(() => {
		if (typeof window === 'undefined') return

		// Инициализация OneSignal
		window.OneSignal = window.OneSignal || []
		window.OneSignal.push(function () {
			window.OneSignal.init({
				appId:
					process.env.ONE_SIGNAL_API || 'e9040239-fad8-42c5-8967-cb6e2a7998cf',
				notifyButton: {
					enable: true, // Включить плавающую кнопку
				},
				autoRegister: false, // Не запрашивать разрешение автоматически
			})
		})
	}, [])

	return null
}
