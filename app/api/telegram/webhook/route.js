// app/api/telegram/webhook/route.js
import { bot } from '@/lib/telegramBot'

export async function POST(req) {
	try {
		const update = await req.json()

		// Передаём апдейт в Telegraf
		await bot.handleUpdate(update)

		// Telegram ожидает любой 200-ответ
		return new Response('OK', { status: 200 })
	} catch (err) {
		console.error('Telegram webhook error', err)
		return new Response('ERROR', { status: 500 })
	}
}

// Иногда Telegram дергает GET при setWebhook, пусть тоже отвечает 200
export async function GET() {
	return new Response('OK', { status: 200 })
}
