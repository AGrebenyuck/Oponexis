// /api/zadarma-sync/route.js

import { getZadarmaEvents, updateZadarmaDeal } from '@/actions/zadarma'
import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const today = DateTime.fromISO('2025-03-27T00:00:00+01:00').toISODate() // format YYYY-MM-DD
		const eventsResponse = await getZadarmaEvents()

		if (!eventsResponse.status) throw new Error(eventsResponse.error)

		const events = eventsResponse.data.events

		// 🔹 Filtrowanie wydarzeń na dzisiaj
		const todayEvents = events.filter(event => event.start.startsWith(today))

		for (const event of todayEvents) {
			// 🔍 Szukamy dealId w tytule (title), np. "Rezerwacja: Serwis | dealId: 123"
			const match = event.title?.match(/dealId:\s*(\d+)/)

			if (match) {
				const dealId = match[1]
				await updateZadarmaDeal(dealId, { status: 'in_progress' })
				console.log(`✅ Deal ${dealId} ustawiony jako \"in_progress\"`)
			}
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('❌ Błąd synchronizacji Zadarma CRM:', error)
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		)
	}
}
