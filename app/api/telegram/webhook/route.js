// app/api/telegram/webhook/route.js
import { bot } from '@/lib/telegramBot'

export async function POST(req) {
	try {
		const update = await req.json()
		await bot.handleUpdate(update)
		return new Response('OK', { status: 200 })
	} catch (err) {
		console.error('Telegram webhook error:', err?.message || err)
		return new Response('ERROR', { status: 500 })
	}
}

export async function GET() {
	return new Response('OK', { status: 200 })
}
