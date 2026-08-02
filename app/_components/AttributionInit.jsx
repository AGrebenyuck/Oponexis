'use client'

import { captureFirstTouch } from '@/lib/attribution'
import { useEffect } from 'react'

export default function AttributionInit() {
	useEffect(() => {
		captureFirstTouch()
	}, [])
	return null
}
