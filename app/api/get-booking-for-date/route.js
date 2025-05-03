import { getBookingForDate } from '@/actions/booking'

// app/api/get-booking-for-date/route.js
export const dynamic = 'force-dynamic'

export async function POST(request) {
	try {
		const { date } = await request.json()

		if (!date) {
			return new Response(JSON.stringify({ error: 'Missing date' }), {
				status: 400,
			})
		}

		const bookings = await getBookingForDate(date)
		return Response.json(bookings)
	} catch (error) {
		console.error('❌ API get-booking-for-date:', error)
		return new Response(JSON.stringify({ error: 'Internal error' }), {
			status: 500,
		})
	}
}
