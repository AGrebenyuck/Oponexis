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

// Чат с рабочими заказами
const WORK_CHAT_ID = Number(process.env.TELEGRAM_WORK_CHAT_ID || 0)

// 👇 ID закреплённого сообщения-расписания в рабочем чате
// (сообщение ты создаёшь и пинаешь вручную, а сюда в env кладёшь его message_id)
const WORK_SCHEDULE_MESSAGE_ID =
	Number(process.env.TELEGRAM_WORK_SCHEDULE_MESSAGE_ID || 0) || null

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
// ВСПОМОГАТЕЛЬНЫЕ ДЛЯ ДАТ/ССЫЛОК
// =========================

// форматирует дату как "21.11.2025 (Pt)"
function formatDateWithDay(date) {
	if (!date) return ''
	const dt = new Date(date)
	const y = dt.getFullYear()
	const m = String(dt.getMonth() + 1).padStart(2, '0')
	const d = String(dt.getDate()).padStart(2, '0')

	const dayIdx = dt.getDay() // 0–6
	const daysPl = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob']
	const dayName = daysPl[dayIdx] || ''

	return `${d}.${m}.${y} (${dayName})`
}

// форматирует visitTime "13:00" → "13:00"
function formatTime(timeStr) {
	if (!timeStr) return ''
	const [h, m] = String(timeStr).split(':')
	return `${h?.padStart(2, '0') || '00'}:${m?.padStart(2, '0') || '00'}`
}

// строим ссылку на сообщение в приватной группе / супергруппе
// формат: https://t.me/c/<internal_chat_id>/<message_id>
// где internal_chat_id = chat_id без -100 / без минуса
function buildMessageLink(chatId, messageId) {
	if (!chatId || !messageId) return null

	const raw = String(chatId)

	let internalId = raw
	if (raw.startsWith('-100')) {
		internalId = raw.slice(4) // убираем -100
	} else if (raw.startsWith('-')) {
		internalId = raw.slice(1) // убираем '-' для обычных групп
	}

	return `https://t.me/c/${internalId}/${messageId}`
}

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
// =========================
// ❌ ANULUJ ZLECENIE (workOrder)
// =========================
bot.action(/cancel_order_(.+)/, async ctx => {
	const user = ctx.from

	// только админы могут отменять
	if (!ALLOWED_HANDLERS.includes(user.id)) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	const id = ctx.match[1]

	try {
		// 1) Убираем визит из графика:
		//    просто очищаем visitDate и visitTime
		const order = await db.workOrder.update({
			where: { id: Number(id) },
			data: {
				visitDate: null,
				visitTime: null,
			},
		})

		// 2) Обновляем текст сообщения (карточки)
		const msg = ctx.update.callback_query.message
		const timeStr = new Date().toLocaleTimeString('pl-PL', {
			hour: '2-digit',
			minute: '2-digit',
		})

		// чтобы не дублировать статус, можно просто дописать блок в конец
		const updatedText =
			msg.text +
			`\n\nStatus: ❌ Anulowane przez @${
				user.username || user.first_name
			} o ${timeStr}`

		// убираем клавиатуру, чтобы по этой кнопке больше не тыкали
		await ctx.editMessageText(updatedText)

		await ctx.answerCbQuery('Zlecenie anulowane ✓')

		// 3) Обновляем закреплённый график
		await updateScheduleMessage()
	} catch (err) {
		console.error('cancel_order failed:', err)
		await ctx.answerCbQuery('Błąd przy anulowaniu zlecenia', {
			show_alert: true,
		})
	}
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

	// 3) текст сообщения
	const lines = []

	lines.push('🔧 Nowe dane od klienta')
	lines.push('')

	// 📅 TERMIN — жирной строкой по смыслу
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

	// 4) Клавиатура: Anuluj + Edytuj + (опц.) Formularz
	const inline = []

	// ❌ Кнопка отмены (callback)
	if (order.id) {
		inline.push([
			Markup.button.callback('❌ Anuluj zlecenie', `cancel_order_${order.id}`),
		])
	}

	// ✏️ Edytuj + 📝 Otwórz formularz в одном ряду
	const rowEdit = []

	// ссылка на страницу редактирования на сайте
	// route можешь поменять под свой (главное, что id передаём)
	if (order.id && SITE_URL) {
		const editUrl = new URL('/admin/work-order', SITE_URL)
		editUrl.searchParams.set('id', order.id)
		rowEdit.push(Markup.button.url('✏️ Edytuj zlecenie', editUrl.toString()))
	}

	if (formUrl) {
		rowEdit.push(Markup.button.url('📝 Otwórz formularz', formUrl))
	}

	if (rowEdit.length) {
		inline.push(rowEdit)
	}

	const keyboard = inline.length > 0 ? Markup.inlineKeyboard(inline) : undefined

	const sent = await bot.telegram.sendMessage(WORK_CHAT_ID, text, {
		reply_markup: keyboard?.reply_markup,
	})

	// сохраняем message_id в БД (чтобы график мог строить ссылку Karta: ...)
	if (sent && sent.message_id && order.id) {
		try {
			await db.workOrder.update({
				where: { id: order.id },
				data: { telegramMessageId: sent.message_id },
			})
		} catch (e) {
			console.error('Failed to save telegramMessageId for workOrder', e)
		}
	}

	return sent
}

// вспомогательная: форматирует datę + dzień tygodnia для карточки
// вспомогательная: форматирует datę + dzień tygodnia
// поддерживает и строки "YYYY-MM-DD", и Date / ISO-строки
function buildTerminLine(visitDate, visitTime) {
	try {
		let y, m, d

		if (visitDate instanceof Date) {
			// напрямую Date из БД
			y = visitDate.getFullYear()
			m = visitDate.getMonth() + 1
			d = visitDate.getDate()
		} else {
			// строка → сначала отрезаем время, если это ISO
			const raw = String(visitDate)
			const datePart = raw.includes('T') ? raw.split('T')[0] : raw
			const parts = datePart.split('-')
			if (parts.length !== 3) throw new Error('bad date')
			;[y, m, d] = parts.map(Number)
		}

		if (!y || !m || !d) throw new Error('bad date')

		// считаем день недели по UTC, как раньше
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
		// если формат совсем неожиданный — хотя бы не ломаемся
		return visitTime ? `${String(visitDate)}, ${visitTime}` : String(visitDate)
	}
}

// =========================
// 📅 ЗАКРЕПЛЁННОЕ РАСПИСАНИЕ В РАБОЧЕМ ЧАТЕ
// =========================
// Вызывается после каждого нового заказа
// динамический id сообщения-расписания, если env указывает на "чужое" сообщение
let dynamicScheduleMessageId = null
// HH:MM -> минуты с полуночи, чтобы сортировать как время, а не строку
function timeToMinutes(timeStr) {
	if (!timeStr) return 99999
	const [h, m] = String(timeStr).split(':')
	const hh = parseInt(h, 10)
	const mm = parseInt(m || '0', 10)
	if (Number.isNaN(hh) || Number.isNaN(mm)) return 99999
	return hh * 60 + mm
}

export async function updateScheduleMessage() {
	try {
		if (!WORK_CHAT_ID) {
			console.warn('WORK_CHAT_ID is not configured, skip schedule update')
			return
		}

		// сегодня 00:00 (локальная дата — как у тебя было)
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		// берём только визиты с датой + временем, сегодня и позже
		let orders = await db.workOrder.findMany({
			where: {
				visitDate: {
					gte: today,
				},
				visitTime: {
					not: null,
				},
			},
			// orderBy можно оставить, но порядок всё равно пересортируем руками
			orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
		})

		// 🔥 РУЧНАЯ СОРТИРОВКА: дата (UTC) → время → id
		orders.sort((a, b) => {
			// сравниваем только календарную дату по UTC,
			// чтобы избежать сдвигов из-за таймзон
			const da = a.visitDate
				? Date.UTC(
						a.visitDate.getUTCFullYear(),
						a.visitDate.getUTCMonth(),
						a.visitDate.getUTCDate()
				  )
				: 0
			const dbt = b.visitDate
				? Date.UTC(
						b.visitDate.getUTCFullYear(),
						b.visitDate.getUTCMonth(),
						b.visitDate.getUTCDate()
				  )
				: 0
			if (da !== dbt) return da - dbt

			// время
			const ta = timeToMinutes(a.visitTime)
			const tb = timeToMinutes(b.visitTime)
			if (ta !== tb) return ta - tb

			// стабильность по id
			if (a.id === b.id) return 0
			return a.id > b.id ? 1 : -1
		})

		// собираем текст
		let text = ''

		if (!orders.length) {
			text = '📅 Aktualny grafik wizyt\n\nNa razie brak zaplanowanych wizyt.'
		} else {
			// группируем по дате (ключ по UTC, чтобы не прыгал день)
			const byDate = new Map()
			for (const o of orders) {
				if (!o.visitDate) continue

				const key = `${o.visitDate.getUTCFullYear()}-${String(
					o.visitDate.getUTCMonth() + 1
				).padStart(2, '0')}-${String(o.visitDate.getUTCDate()).padStart(
					2,
					'0'
				)}`

				if (!byDate.has(key)) byDate.set(key, [])
				byDate.get(key).push(o)
			}

			const lines = []
			lines.push('📅 Aktualny grafik wizyt')
			lines.push('')

			const dateKeys = Array.from(byDate.keys()).sort()

			dateKeys.forEach((key, idx) => {
				const group = byDate.get(key)
				if (!group || !group.length) return

				const [y, m, d] = key.split('-').map(Number)
				// тут строим "локальный" объект Date для красивого форматирования
				const dt = new Date(y, m - 1, d)
				const header = formatDateWithDay(dt)

				if (idx > 0) {
					// разделитель между днями
					lines.push('')
					lines.push('────────────────────')
					lines.push('')
				}

				lines.push(`📆 ${header}`)
				lines.push('')

				for (const o of group) {
					const time = formatTime(o.visitTime)
					const baseLine = `${time || '??:??'} – ${
						o.service || 'Brak nazwy usługi'
					}`

					const link =
						o.telegramMessageId &&
						buildMessageLink(WORK_CHAT_ID, o.telegramMessageId)

					if (link) {
						lines.push(baseLine)
						lines.push(`↪️ Karta: ${link}`)
					} else {
						lines.push(baseLine)
					}

					lines.push('') // пустая строка между карточками
				}
			})

			text = lines.join('\n')
		}

		// ---------------------------------
		// 1) пробуем редактировать уже известное сообщение
		// ---------------------------------
		const targetMessageId = dynamicScheduleMessageId || WORK_SCHEDULE_MESSAGE_ID

		// если ни env, ни динамический id ещё не известны — просто создаём новое
		if (!targetMessageId) {
			const sent = await bot.telegram.sendMessage(WORK_CHAT_ID, text)
			dynamicScheduleMessageId = sent.message_id
			console.log(
				'[telegram] schedule message created with id:',
				sent.message_id
			)
			return
		}

		try {
			// пробуем отредактировать
			await bot.telegram.editMessageText(
				WORK_CHAT_ID,
				targetMessageId,
				undefined,
				text
			)
		} catch (err) {
			// сюда попадём, если:
			// - сообщение не от бота,
			// - message_id не существует,
			// - "message can\'t be edited" и т.п.
			console.error(
				'[telegram] editMessageText for schedule failed, create new one:',
				err?.response || err
			)

			const sent = await bot.telegram.sendMessage(WORK_CHAT_ID, text)
			dynamicScheduleMessageId = sent.message_id
			console.log(
				'[telegram] NEW schedule message id:',
				sent.message_id,
				'(you can pin it and/or put into env TELEGRAM_WORK_SCHEDULE_MESSAGE_ID)'
			)
		}
	} catch (err) {
		console.error('updateScheduleMessage failed:', err)
	}
}

// =========================
// 🔧 Обновление карточки заказа в рабочем чате
// =========================
export async function updateWorkOrderMessage(order) {
	try {
		if (!WORK_CHAT_ID) {
			console.warn('[updateWorkOrderMessage] WORK_CHAT_ID not configured')
			return
		}

		if (!order || !order.telegramMessageId) {
			console.warn('[updateWorkOrderMessage] No telegramMessageId, skip')
			return
		}

		// ===== Budujemy tekst jak przy pierwszym wysłaniu =====
		const lines = []
		lines.push('🔧 Dane klienta (zaktualizowane)')
		lines.push('')

		// termin
		if (order.visitDate) {
			const terminLine = buildTerminLine(order.visitDate, order.visitTime)
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

		// google maps url
		let mapsUrl = ''
		if (order.lat != null && order.lng != null) {
			mapsUrl = `https://www.google.com/maps?q=${order.lat},${order.lng}`
		} else if (order.address) {
			mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
				order.address
			)}`
		}
		if (mapsUrl) lines.push(`🗺 Google Maps: ${mapsUrl}`)

		if (order.leadId) lines.push(`🆔 ID zgłoszenia: ${order.leadId}`)
		if (order.notes) {
			lines.push('')
			lines.push(`📝 Uwagi: ${order.notes}`)
		}

		const text = lines.join('\n')

		// ===== BUDUJEMY PRZYCISKI =====

		const inline = []

		// 1) Formularz Google
		if (GOOGLE_FORM_BASE) {
			const params = new URLSearchParams()
			params.set('usp', 'pp_url')

			if (order.name) params.set(ENTRY_FULLNAME, order.name)
			if (order.phone) params.set(ENTRY_PHONE, order.phone)

			const carParts = []
			if (order.carModel) carParts.push(order.carModel)
			if (order.regNumber) carParts.push(order.regNumber)
			if (carParts.length) params.set(FORM_ENTRY_CAR, carParts.join(' / '))

			const formUrl = `${GOOGLE_FORM_BASE}?${params.toString()}`
			inline.push([Markup.button.url('📝 Otwórz formularz', formUrl)])
		}

		// 2) Edytuj → link do panelu admina
		if (order.id && SITE_URL) {
			const editUrl = new URL('/admin/work-order', SITE_URL)
			editUrl.searchParams.set('id', order.id)
			inline.push(Markup.button.url('✏️ Edytuj zlecenie', editUrl.toString()))
		}

		// 3) Anuluj
		inline.push([
			Markup.button.callback('❌ Anuluj zlecenie', `cancel_order_${order.id}`),
		])

		const keyboard = Markup.inlineKeyboard(inline)

		// ===== Aktualizacja wiadomości =====
		await bot.telegram.editMessageText(
			WORK_CHAT_ID,
			order.telegramMessageId,
			undefined,
			text,
			{
				reply_markup: keyboard.reply_markup,
			}
		)

		console.log(
			`[updateWorkOrderMessage] updated message ${order.telegramMessageId}`
		)
	} catch (err) {
		console.error('[updateWorkOrderMessage] FAILED:', err)
	}
}
/* ─────────────────────────────────────────────
   📞 /sms + распознавание номера из текста
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

	// если хочешь, чтобы работало только в ЛС с ботом — оставляем
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
───────────────────────────────────────────── */

bot.on('text', async ctx => {
	const text = ctx.message.text.trim()

	// команды ( /start, /sms и т.п. ) пропускаем — их обрабатывают command-хендлеры
	if (text.startsWith('/')) return

	// Пытаемся распознать номер из текста
	return handleSmsLinkForPhone(ctx, text)
})
