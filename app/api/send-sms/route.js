// app/api/send-sms/route.js
import { api } from 'zadarma'

export async function POST(req) {
	const { number, message } = await req.json()

	try {
		const response = await api({
			http_method: 'POST',
			api_method: '/v1/sms/send',
			params: { number, message },
		})

		return Response.json(response)
	} catch (error) {
		console.error('SMS error:', error)
		return Response.json(
			{ error: 'Nie udało się wysłać wiadomości' },
			{ status: 500 }
		)
	}
}
