'use client'
import { useEffect } from 'react'

function setCookie(name, value, days = 180) {
	const d = new Date()
	d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
	document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`
}
function getCookie(name) {
	return document.cookie
		.split('; ')
		.find(r => r.startsWith(name + '='))
		?.split('=')[1]
}
function uuid() {
	return (
		crypto.randomUUID?.() ||
		Math.random().toString(16).slice(2) + '-' + Date.now()
	)
}

export default function ReferralInit() {
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const ref = params.get('ref')
		if (ref) setCookie('opx_ref_code', ref, 30)

		if (!getCookie('opx_vid')) setCookie('opx_vid', uuid(), 180)

		const code = ref || getCookie('opx_ref_code')
		if (code) {
			fetch('/api/ref/hit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code }),
			}).catch(() => {})
		}
	}, [])
	return null
}
