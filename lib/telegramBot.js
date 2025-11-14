// lib/telegramBot.js
import dotenv from 'dotenv'
import { Markup, Telegraf } from 'telegraf'
import { db } from './prisma'

// В проде Vercel сам подставляет env, dotenv нужен только локально
if (process.env.NODE_ENV !== 'production') {
	dotenv.config()
}

// ==== CONFIG ====
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) {
	throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

const GROUP_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID)
if (!GROUP_CHAT_ID) {
	throw new Error('TELEGRAM_CHAT_ID is not set or invalid')
}

// разрешенные пользователи для кнопок
const ALLOWED_HANDLERS = [
	Number(process.env.TELEGRAM_ADMIN_1),
	Number(process.env.TELEGRAM_ADMIN_2),
].filter(Boolean)

// кому слать напоминания
const NOTIFY_USERS = ALLOWED_HANDLERS

// Google form
const GOOGLE_FORM_BASE = process.env.GOOGLE_FORM_BASE
const ENTRY_FULLNAME = process.env.GOOGLE_FORM_ENTRY_FULLNAME
const ENTRY_PHONE = process.env.GOOGLE_FORM_ENTRY_PHONE

// таймеры и статусы лидов
// ключи всегда String(id), чтобы не было бага "5" vs 5
const pendingTimers = new Map() // id -> timer
const leadStatus = new Map() // id -> 'pending' | 'accepted' | 'closed'

// кеш данных юзеров (для красивых имён в напоминании)
const USER_CACHE = {}

// init bot в режиме WEBHOOK
export const bot = new Telegraf(BOT_TOKEN, {
	telegram: { webhookReply: false },
})

// ───────────────────────────────────────────────────────────
// 🔄 Предзагрузка имён / username админов
// ───────────────────────────────────────────────────────────
async function preloadUsernames() {
	for (const id of NOTIFY_USERS) {
		try {
			const data = await bot.telegram.getChatMember(GROUP_CHAT_ID, id)
			USER_CACHE[id] = {
				username: data.user.username || null,
				first: data.user.first_name || null,
				last: data.user.last_name || null,
			}
		} catch (e) {
			console.error('Failed to load user', id, e.message)
		}
	}
}

// не ждём, просто запускаем
preloadUsernames().catch(err => console.error('preloadUsernames error', err))

// ───────────────────────────────────────────────────────────
// 📩 ОТПРАВКА НОВОГО ЛИДА
// ───────────────────────────────────────────────────────────
export async function sendLeadToTelegram({ id, name, phone, services }) {
	if (!GROUP_CHAT_ID) {
		throw new Error('GROUP_CHAT_ID is not configured')
	}

	const key = String(id)
	leadStatus.set(key, 'pending')

	let formUrl = null
	if (GOOGLE_FORM_BASE && ENTRY_FULLNAME && ENTRY_PHONE) {
		const params = new URLSearchParams()
		params.set(ENTRY_FULLNAME, name)
		params.set(ENTRY_PHONE, phone)
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

	// Клавиатура: 2 callback-кнопки + кнопка на форму
	const inline = []
	inline.push([Markup.button.callback('Przejmuję', `accept_${key}`)])
	inline.push([Markup.button.callback('Zamykam zgłoszenie', `close_${key}`)])
	if (formUrl) {
		inline.push([Markup.button.url('Otwórz formularz', formUrl)])
	}

	const keyboard = Markup.inlineKeyboard(inline)

	const sent = await bot.telegram.sendMessage(GROUP_CHAT_ID, text, {
		reply_markup: keyboard.reply_markup,
	})

	// ⚠️ На Vercel таймеры живут только пока живёт инстанс функции
	// но локально и в long-lived-сервисе будет ок
	const timer = setTimeout(async () => {
		try {
			await sendReminder(key)
		} catch (e) {
			console.error('Error in reminder', e)
		}
	}, 5 * 60 * 1000)

	pendingTimers.set(key, timer)

	return sent
}

// ───────────────────────────────────────────────────────────
// ✔ ПРИНЯТЬ ЛИД
// ───────────────────────────────────────────────────────────
bot.action(/accept_(.+)/, async ctx => {
	const id = ctx.match[1]
	const key = String(id)
	const user = ctx.from

	// обновим кеш пользователя (получаем реальные имя/username)
	USER_CACHE[user.id] = {
		username: user.username || null,
		first: user.first_name || null,
		last: user.last_name || null,
	}

	if (!ALLOWED_HANDLERS.includes(user.id)) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	// снять таймер и пометить лид как принятый
	const timer = pendingTimers.get(key)
	if (timer) {
		clearTimeout(timer)
		pendingTimers.delete(key)
	}

	await db.lead.update({
		where: { id },
		data: { status: 'accepted' },
	})
	leadStatus.set(id, 'accepted')

	const time = new Date().toLocaleTimeString('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
	})

	const msg = ctx.update.callback_query.message

	const updatedText = msg.text.replace(
		/Status:([\s\S]*)$/,
		`Status: ✅ Przejęte przez @${user.username || user.first_name}\n⏱ ${time}`
	)

	// Оставляем только кнопку "Otwórz formularz"
	let formRow = null
	if (msg.reply_markup?.inline_keyboard) {
		formRow =
			msg.reply_markup.inline_keyboard.find(row => row.some(btn => btn.url)) ||
			null
	}

	const newMarkup = formRow ? { inline_keyboard: [formRow] } : undefined

	await ctx.editMessageText(
		updatedText,
		newMarkup && { reply_markup: newMarkup }
	)
	await ctx.answerCbQuery('Przejęte ✓')
})

// ───────────────────────────────────────────────────────────
// ❌ ЗАКРЫТЬ ЛИД
// ───────────────────────────────────────────────────────────
bot.action(/close_(.+)/, async ctx => {
	const id = ctx.match[1]
	const key = String(id)
	const user = ctx.from

	USER_CACHE[user.id] = {
		username: user.username || null,
		first: user.first_name || null,
		last: user.last_name || null,
	}

	if (!ALLOWED_HANDLERS.includes(user.id) || user.id != 621536075) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	const timer = pendingTimers.get(key)
	if (timer) {
		clearTimeout(timer)
		pendingTimers.delete(key)
	}
	await db.lead.update({
		where: { id },
		data: { status: 'closed' },
	})
	leadStatus.set(id, 'closed')

	const time = new Date().toLocaleTimeString('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
	})

	const msg = ctx.update.callback_query.message

	const updatedText = msg.text.replace(
		/Status:([\s\S]*)$/,
		`Status: ❌ Zamknięte przez @${user.username || user.first_name}\n⏱ ${time}`
	)

	// Тут логично тоже оставить только кнопку "Otwórz formularz"
	let formRow = null
	if (msg.reply_markup?.inline_keyboard) {
		formRow =
			msg.reply_markup.inline_keyboard.find(row => row.some(btn => btn.url)) ||
			null
	}

	const newMarkup = formRow ? { inline_keyboard: [formRow] } : undefined

	await ctx.editMessageText(
		updatedText,
		newMarkup && { reply_markup: newMarkup }
	)
	await ctx.answerCbQuery('Zamknięte ✓')
})

// ───────────────────────────────────────────────────────────
// 🔔 НАПОМИНАНИЕ
// ───────────────────────────────────────────────────────────
async function sendReminder(id) {
	const key = String(id)

	// если уже приняли или закрыли — просто не шлём напоминание
	const lead = await db.lead.findUnique({ where: { id } })
	if (!lead || lead.status !== 'new') return // НЕ отправлять

	const users = NOTIFY_USERS.map(u => {
		const cache = USER_CACHE[u]
		if (cache?.username) return `• @${cache.username}`
		if (cache?.first) return `• ${cache.first}`
		// запасной вариант — ссылка по ID
		return `<a href="tg://user?id=${u}">• użytkownik</a>`
	}).join('\n')

	const text = `
⏰ Zgłoszenie #${key} wciąż nieprzejęte od 5 minut.
${users}
  `.trim()

	await bot.telegram.sendMessage(GROUP_CHAT_ID, text, {
		parse_mode: 'HTML',
	})
}

// ❗ НИКАКОГО bot.launch() — всё идёт через webhook и bot.handleUpdate(...)
