// lib/telegramBot.js
import dotenv from 'dotenv'
import { Markup, Telegraf } from 'telegraf'
import { db } from './prisma'

// В проде Vercel сам подставляет env, dotenv нужен только локально
if (process.env.NODE_ENV !== 'production') {
	dotenv.config()
}

// =========================
// CONFIG
// =========================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) {
	throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

// Главный чат с лидами
const GROUP_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID)
if (!GROUP_CHAT_ID) {
	throw new Error('TELEGRAM_CHAT_ID is not set or invalid')
}

// Чат с рабочими заказами (может быть 0, тогда просто не шлём туда)
const WORK_CHAT_ID = Number(process.env.TELEGRAM_WORK_CHAT_ID || 0)

// кто может нажимать кнопки в карточке лида
const ALLOWED_HANDLERS = [
	Number(process.env.TELEGRAM_ADMIN_1),
	Number(process.env.TELEGRAM_ADMIN_2),
].filter(Boolean)

// базовый URL сайта, например: https://oponexis.pl или https://xxx.ngrok-free.app
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oponexis.pl'

// Google form
const GOOGLE_FORM_BASE = process.env.GOOGLE_FORM_BASE
const ENTRY_FULLNAME = process.env.GOOGLE_FORM_ENTRY_FULLNAME
const ENTRY_PHONE = process.env.GOOGLE_FORM_ENTRY_PHONE
const FORM_ENTRY_CAR = 'entry.1900237660'

// init bot в режиме WEBHOOK
export const bot = new Telegraf(BOT_TOKEN, {
	telegram: { webhookReply: false },
})

// =========================
// 📩 ОТПРАВКА НОВОГО ЛИДА В ГЛАВНЫЙ ЧАТ
// =========================
export async function sendLeadToTelegram({ id, name, phone, services }) {
	if (!GROUP_CHAT_ID) {
		throw new Error('GROUP_CHAT_ID is not configured')
	}

	const key = String(id)

	// Ссылка на Google Form
	let formUrl = null
	if (GOOGLE_FORM_BASE && ENTRY_FULLNAME && ENTRY_PHONE) {
		const params = new URLSearchParams()
		params.set(ENTRY_FULLNAME, name || '')
		params.set(ENTRY_PHONE, phone || '')
		formUrl = `${GOOGLE_FORM_BASE}?${params.toString()}`
	}

	const text = `
📩 Nowa rezerwacja #${id}

👤 Imię: ${name}
📞 Telefon: ${phone}
🔧 Usługi: ${services.join(', ')}

────────────────────
📌 Status: ⏳ Oczekuje na przyjęcie
`.trim()

	// URL на /sms-redirect — для кнопки "Wyślij SMS"
	const smsUrl = new URL('/sms-redirect', SITE_URL)
	smsUrl.searchParams.set('lead', key)
	if (name) smsUrl.searchParams.set('name', name)
	if (phone) smsUrl.searchParams.set('phone', phone)
	if (services?.length) smsUrl.searchParams.set('service', services.join(', '))

	// Клавиатура:
	// 1) Przejmuję
	// 2) Zamykam zgłoszenie
	// 3) Wyślij SMS (URL-кнопка → /sms-redirect)
	// 4) Otwórz formularz (Google Form)
	const inline = []
	inline.push([Markup.button.callback('Przejmuję', `accept_${key}`)])
	inline.push([Markup.button.callback('Zamykam zgłoszenie', `close_${key}`)])
	inline.push([Markup.button.url('Wyślij SMS', smsUrl.toString())])
	if (formUrl) {
		inline.push([Markup.button.url('Otwórz formularz', formUrl)])
	}

	const keyboard = Markup.inlineKeyboard(inline)

	const sent = await bot.telegram.sendMessage(GROUP_CHAT_ID, text, {
		reply_markup: keyboard.reply_markup,
	})

	return sent
}

// =========================
// ✔ ПРИНЯТЬ ЛИД
// =========================
bot.action(/accept_(.+)/, async ctx => {
	const id = ctx.match[1] // строковый cuid
	const user = ctx.from

	if (!ALLOWED_HANDLERS.includes(user.id)) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	// Обновляем статус лида и сразу получаем его
	const lead = await db.lead.update({
		where: { id },
		data: { status: 'accepted' },
	})

	const time = new Date().toLocaleTimeString('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
	})

	const msg = ctx.update.callback_query.message

	const updatedText = msg.text.replace(
		/Status:([\s\S]*)$/,
		`Status: ✅ Przejęte przez @${user.username || user.first_name}\n⏱ ${time}`
	)

	// Ссылка на /sms-redirect для этого лида
	const smsUrl = new URL('/sms-redirect', SITE_URL)
	smsUrl.searchParams.set('lead', lead.id)
	if (lead.name) smsUrl.searchParams.set('name', lead.name)
	if (lead.phone) smsUrl.searchParams.set('phone', lead.phone)

	const serviceForSms = lead.selectedNames?.length
		? lead.selectedNames.join(', ')
		: lead.serviceName || ''
	if (serviceForSms) smsUrl.searchParams.set('service', serviceForSms)

	// Ищем строку с Google Form, чтобы её сохранить
	let formRow = null
	if (msg.reply_markup?.inline_keyboard) {
		formRow =
			msg.reply_markup.inline_keyboard.find(row =>
				row.some(btn => btn.url && btn.text === 'Otwórz formularz')
			) || null
	}

	const inline = []
	inline.push([Markup.button.url('Wyślij SMS', smsUrl.toString())])
	if (formRow) inline.push(formRow)

	const newMarkup = { inline_keyboard: inline }

	await ctx.editMessageText(updatedText, {
		reply_markup: newMarkup,
	})
	await ctx.answerCbQuery('Przejęte ✓')
})

// =========================
// ❌ ЗАКРЫТЬ ЛИД
// (оставляем только у одного админа право закрывать, как ты хотел)
// =========================
bot.action(/close_(.+)/, async ctx => {
	const id = ctx.match[1]
	const user = ctx.from

	// только указанный ID, как у тебя было (621536075 — твой)
	if (!ALLOWED_HANDLERS.includes(user.id) || user.id != 621536075) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	const lead = await db.lead.update({
		where: { id },
		data: { status: 'closed' },
	})

	const time = new Date().toLocaleTimeString('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
	})

	const msg = ctx.update.callback_query.message

	const updatedText = msg.text.replace(
		/Status:([\s\S]*)$/,
		`Status: ❌ Zamknięte przez @${user.username || user.first_name}\n⏱ ${time}`
	)

	// Ссылка на /sms-redirect
	const smsUrl = new URL('/sms-redirect', SITE_URL)
	smsUrl.searchParams.set('lead', lead.id)
	if (lead.name) smsUrl.searchParams.set('name', lead.name)
	if (lead.phone) smsUrl.searchParams.set('phone', lead.phone)

	const serviceForSms = lead.selectedNames?.length
		? lead.selectedNames.join(', ')
		: lead.serviceName || ''
	if (serviceForSms) smsUrl.searchParams.set('service', serviceForSms)

	let formRow = null
	if (msg.reply_markup?.inline_keyboard) {
		formRow =
			msg.reply_markup.inline_keyboard.find(row =>
				row.some(btn => btn.url && btn.text === 'Otwórz formularz')
			) || null
	}

	const inline = []
	inline.push([Markup.button.url('Wyślij SMS', smsUrl.toString())])
	if (formRow) inline.push(formRow)

	const newMarkup = { inline_keyboard: inline }

	await ctx.editMessageText(updatedText, {
		reply_markup: newMarkup,
	})
	await ctx.answerCbQuery('Zamknięte ✓')
})

// 🚚 OТПРАВКА КАРТОЧКИ ЗАКАЗА В РАБОЧИЙ ЧАТ
// (используется из /api/order/client)
// extra: { visitDate?: 'YYYY-MM-DD', visitTime?: 'HH:MM' }
export async function sendWorkOrderToTelegram(order, extra = {}) {
	if (!WORK_CHAT_ID) {
		console.warn('WORK_CHAT_ID is not configured, skip work order message')
		return
	}

	const { visitDate, visitTime } = extra

	// 1) Google Maps URL
	let mapsUrl = ''
	if (order.lat != null && order.lng != null) {
		mapsUrl = `https://www.google.com/maps?q=${order.lat},${order.lng}`
	} else if (order.address) {
		mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			order.address
		)}`
	}

	// 2) Google Form URL (autouzupełnienie)
	let formUrl = null
	if (GOOGLE_FORM_BASE) {
		const params = new URLSearchParams()
		params.set('usp', 'pp_url')

		if (order.name) params.set(ENTRY_FULLNAME, order.name)
		if (order.phone) params.set(ENTRY_PHONE, order.phone)

		const carParts = []
		if (order.carModel) carParts.push(order.carModel)
		if (order.regNumber) carParts.push(order.regNumber)
		if (carParts.length) {
			params.set(FORM_ENTRY_CAR, carParts.join(' / '))
		}

		formUrl = `${GOOGLE_FORM_BASE}?${params.toString()}`
	}

	const lines = []

	lines.push('🔧 Nowe dane od klienta')
	lines.push('')

	if (visitDate) {
		const terminLine = buildTerminLine(visitDate, visitTime)
		lines.push(`📅 TERMIN: ${terminLine}`)
		lines.push('')
	}

	if (order.name) lines.push(`👤 Imię: ${order.name}`)
	if (order.phone) lines.push(`📞 Telefon: ${order.phone}`)
	if (order.service) lines.push(`🔧 Usługa: ${order.service}`)
	if (order.regNumber) lines.push(`🚘 Rejestracja: ${order.regNumber}`)
	if (order.carModel) lines.push(`🚗 Model: ${order.carModel}`)
	if (order.color) lines.push(`🎨 Kolor: ${order.color}`)
	if (order.address) lines.push(`📍 Adres: ${order.address}`)
	if (mapsUrl) lines.push(`🗺 Google Maps: ${mapsUrl}`)
	if (order.leadId) lines.push(`🆔 ID zgłoszenia: ${order.leadId}`)
	if (order.notes) {
		lines.push('')
		lines.push(`📝 Uwagi: ${order.notes}`)
	}

	const text = lines.join('\n')

	const inline = []
	if (formUrl) {
		inline.push([Markup.button.url('📝 Otwórz formularz', formUrl)])
	}
	const keyboard = inline.length > 0 ? Markup.inlineKeyboard(inline) : undefined

	await bot.telegram.sendMessage(WORK_CHAT_ID, text, {
		reply_markup: keyboard?.reply_markup,
	})
}
// вспомогательная: форматирует datę + dzień tygodnia
function buildTerminLine(visitDate, visitTime) {
	// visitDate ожидаем в формате YYYY-MM-DD
	try {
		const [y, m, d] = String(visitDate).split('-').map(Number)
		if (!y || !m || !d) throw new Error('bad date')

		const dt = new Date(Date.UTC(y, m - 1, d))
		const dayIdx = dt.getUTCDay() // 0–6
		const daysPl = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob']
		const dayName = daysPl[dayIdx] || ''

		const dd = String(d).padStart(2, '0')
		const mm = String(m).padStart(2, '0')
		const dateStr = `${dd}.${mm}.${y}`

		if (visitTime) {
			return `${dateStr} (${dayName}), ${visitTime}`
		}
		return `${dateStr} (${dayName})`
	} catch {
		// если формат странный — просто вернём как есть
		return visitTime ? `${visitDate}, ${visitTime}` : String(visitDate)
	}
}

/* ─────────────────────────────────────────────
   📞 /sms + распознавание номера из текста
   - работает только для админов (ALLOWED_HANDLERS)
   - делает ссылку на /sms-redirect только с phone
───────────────────────────────────────────── */

// нормализация номера телефона
function normalizePhone(raw) {
	if (!raw) return null

	// убираем всё, кроме цифр и плюса в начале
	const trimmed = raw.trim()
	const hasPlus = trimmed.startsWith('+')

	const digits = trimmed.replace(/[^\d]/g, '') // только цифры

	if (digits.length < 7) return null // слишком короткий

	let phone

	if (hasPlus) {
		// было + в начале → считаем, что это полный номер
		phone = '+' + digits
	} else if (digits.length === 9) {
		// типичный польский локальный формат: 9 цифр → добавляем +48
		phone = '+48' + digits
	} else {
		// всё остальное — просто +digits (например, уже с кодом страны)
		phone = '+' + digits
	}

	return phone
}

// общий хендлер: из текста → ссылка на sms-redirect
async function handleSmsLinkForPhone(ctx, rawInput) {
	// только админы
	if (!ALLOWED_HANDLERS.includes(ctx.from.id)) {
		return
	}

	// (если хочешь, чтобы работало только в ЛС с ботом — оставь блок ниже,
	// если нужно и в группах — можно удалить этот if)
	if (ctx.chat?.type !== 'private') {
		return
	}

	const phone = normalizePhone(rawInput)
	if (!phone) {
		return ctx.reply('Podaj poprawny numer telefonu, np. +48 123 456 789')
	}

	// ссылка на /sms-redirect ТОЛЬКО с phone
	const smsUrl = new URL('/sms-redirect', SITE_URL)
	smsUrl.searchParams.set('phone', phone)

	const buttonLink = smsUrl.toString()

	return ctx.reply(
		`📲 Kliknij przycisk poniżej, aby otworzyć SMS z gotową wiadomością:`,
		{
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Wyślij SMS',
							url: buttonLink,
						},
					],
				],
			},
		}
	)
}

/* ─────────────────────────────────────────────
   🔹 Команда: /sms 123456789
───────────────────────────────────────────── */

bot.command('sms', async ctx => {
	const parts = ctx.message.text.split(/\s+/)

	if (parts.length < 2) {
		return ctx.reply('Użycie: /sms 123456789 lub /sms +48 123 456 789')
	}

	// всё после /sms считаем номером
	const rawPhone = parts.slice(1).join(' ')
	return handleSmsLinkForPhone(ctx, rawPhone)
})

/* ─────────────────────────────────────────────
   🔹 Просто текст с номером в ЛС бота
   (если это не команда и не что-то другое)
───────────────────────────────────────────── */

bot.on('text', async ctx => {
	const text = ctx.message.text.trim()

	// команды ( /start, /sms и т.п. ) пропускаем — их обрабатывают command-хендлеры
	if (text.startsWith('/')) return

	// Пытаемся распознать номер из текста
	return handleSmsLinkForPhone(ctx, text)
})
