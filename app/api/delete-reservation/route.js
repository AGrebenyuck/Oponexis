import { db } from '@/lib/prisma'

export async function DELETE(req) {
	try {
		const { id } = await req.json()

		console.log(id)

		await db.reservation.delete({
			where: { id },
		})

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Błąd usuwania rezerwacji:', error)
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}
