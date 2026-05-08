// lib/telegramBot.js
import dotenv from 'dotenv'
import { DateTime } from 'luxon'
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
const WORK_SCHEDULE_MESSAGE_ID =
	Number(process.env.TELEGRAM_WORK_SCHEDULE_MESSAGE_ID || 0) || null

const SMS_TRACKER_MESSAGE_ID =
	Number(process.env.TELEGRAM_SMS_TRACKER_MESSAGE_ID || 0) || null

let dynamicSmsTrackerMessageId = null

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

// Luxon: зона Польши
const ZONE = 'Europe/Warsaw'

// init bot в режиме WEBHOOK
export const bot = new Telegraf(BOT_TOKEN, {
	telegram: { webhookReply: false },
})

// =========================
// ВСПОМОГАТЕЛЬНЫЕ ДЛЯ ДАТ/ССЫЛОК
// =========================

function nowPL() {
	return DateTime.now().setZone(ZONE)
}

// YYYY-MM-DD → Date (UTC-ish, но считаем по Польше, старт дня)
function parseVisitDateToDate(str) {
	if (!str) return null

	const raw = String(str).trim()
	if (!raw) return null

	const dt = DateTime.fromISO(raw, { zone: ZONE })
	if (!dt.isValid) return null

	// нормализуем к началу дня по Польше и сохраняем как JS Date (Prisma DateTime)
	return dt.startOf('day').toJSDate()
}

// форматирует дату как "21.11.2025 (Pt)" по Польше
function formatDateWithDay(date) {
	if (!date) return ''
	let dt

	if (date instanceof Date) {
		dt = DateTime.fromJSDate(date, { zone: ZONE })
	} else {
		dt = DateTime.fromISO(String(date), { zone: ZONE })
	}

	if (!dt.isValid) return ''

	return dt.setLocale('pl').toFormat('dd.LL.yyyy (ccc)')
}

// форматирует visitTime "13:00" → "13:00"
function formatTime(timeStr) {
	if (!timeStr) return ''
	const [h, m] = String(timeStr).split(':')
	return `${h?.padStart(2, '0') || '00'}:${m?.padStart(2, '0') || '00'}`
}

// строим ссылку на сообщение в приватной группе / супергруппе
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

// вспомогательная: форматирует datę + dzień tygodnia
// поддерживает Date из БД и строки "YYYY-MM-DD"
function buildTerminLine(visitDate, visitTime) {
	try {
		if (!visitDate) return visitTime ? String(visitTime) : ''

		let dt
		if (visitDate instanceof Date) {
			dt = DateTime.fromJSDate(visitDate, { zone: ZONE })
		} else {
			// строка/ISO
			const raw = String(visitDate)
			const datePart = raw.includes('T') ? raw.split('T')[0] : raw
			dt = DateTime.fromISO(datePart, { zone: ZONE })
		}

		if (!dt.isValid) throw new Error('bad date')
		dt = dt.startOf('day')

		if (visitTime) {
			const [h, m] = String(visitTime).split(':').map(Number)
			dt = dt.set({ hour: h || 0, minute: m || 0 })
			return dt.setLocale('pl').toFormat('dd.LL.yyyy (ccc), HH:mm')
		}

		return dt.setLocale('pl').toFormat('dd.LL.yyyy (ccc)')
	} catch {
		return visitTime ? `${String(visitDate)}, ${visitTime}` : String(visitDate)
	}
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

	// Клавиатура
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

	const lead = await db.lead.update({
		where: { id },
		data: { status: 'accepted' },
	})

	const time = nowPL().toFormat('HH:mm')

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

	if (!ALLOWED_HANDLERS.includes(user.id) || user.id != 621536075) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	const lead = await db.lead.update({
		where: { id },
		data: { status: 'closed' },
	})

	const time = nowPL().toFormat('HH:mm')

	const msg = ctx.update.callback_query.message

	const updatedText = msg.text.replace(
		/Status:([\s\S]*)$/,
		`Status: ❌ Zamknięte przez @${user.username || user.first_name}\n⏱ ${time}`
	)

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

	if (!ALLOWED_HANDLERS.includes(user.id)) {
		return ctx.answerCbQuery('Brak uprawnień', { show_alert: true })
	}

	const id = ctx.match[1]

	try {
		const order = await db.workOrder.update({
			where: { id: Number(id) },
			data: {
				visitDate: null,
				visitTime: null,
			},
		})

		const msg = ctx.update.callback_query.message
		const timeStr = nowPL().toFormat('HH:mm')

		const updatedText =
			msg.text +
			`\n\nStatus: ❌ Anulowane przez @${
				user.username || user.first_name
			} o ${timeStr}`

		await ctx.editMessageText(updatedText)
		await ctx.answerCbQuery('Zlecenie anulowane ✓')

		await updateScheduleMessage()
	} catch (err) {
		console.error('cancel_order failed:', err)
		await ctx.answerCbQuery('Błąd przy anulowaniu zlecenia', {
			show_alert: true,
		})
	}
})

// 🚚 OТПРАВКА КАРТОЧКИ ЗАКАЗА В РАБОЧИЙ ЧАТ
// extra: { visitDate?: 'YYYY-MM-DD' | Date, visitTime?: 'HH:MM' }
export async function sendWorkOrderToTelegram(order, extra = {}) {
	if (!WORK_CHAT_ID) {
		console.warn('WORK_CHAT_ID is not configured, skip work order message')
		return
	}

	const { visitDate: extraVisitDate, visitTime: extraVisitTime } = extra

	// effective termin: сначала из order (если в БД уже есть),
	// иначе то, что прилетело через extra
	const effectiveVisitDate = order.visitDate || extraVisitDate || null
	const effectiveVisitTime =
		order.visitTime || extraVisitTime || extraVisitTime || null

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

	if (effectiveVisitDate || effectiveVisitTime) {
		const terminLine = buildTerminLine(effectiveVisitDate, effectiveVisitTime)
		if (terminLine) {
			lines.push(`📅 TERMIN: ${terminLine}`)
			lines.push('')
		}
	}

	if (order.name) lines.push(`👤 Imię: ${order.name}`)
	if (order.phone) lines.push(`📞 Telefon: ${order.phone}`)
	if (order.service) lines.push(`🔧 Usługa: ${order.service}`)
	if (order.regNumber) lines.push(`🚘 Rejestracja: ${order.regNumber}`)
	if (order.carModel) lines.push(`🚗 Model: ${order.carModel}`)
	if (order.color) lines.push(`🎨 Kolor: ${order.color}`)
	if (order.wheelRimSize) lines.push(`🛞 Felga: ${order.wheelRimSize}`)
	if (order.tireSize) lines.push(`📏 Rozmiar opony: ${order.tireSize}`)
	if (order.address) lines.push(`📍 Adres: ${order.address}`)
	if (mapsUrl) lines.push(`🗺 Google Maps: ${mapsUrl}`)
	if (order.leadId) lines.push(`🆔 ID zgłoszenia: ${order.leadId}`)

	// 💼 Faktura
	if (order.wantsInvoice) {
		lines.push('')
		lines.push('💼 Faktura: TAK')
		if (order.invoiceNip) lines.push(`   • NIP: ${order.invoiceNip}`)
		if (order.invoiceEmail) lines.push(`   • E-mail: ${order.invoiceEmail}`)
	}

	if (order.notes) {
		lines.push('')
		lines.push(`📝 Uwagi: ${order.notes}`)
	}

	const text = lines.join('\n')

	// 4) Клавиатура: Anuluj + Edytuj + (опц.) Formularz
	const inline = []

	if (order.id) {
		inline.push([
			Markup.button.callback('❌ Anuluj zlecenie', `cancel_order_${order.id}`),
		])
	}

	const rowEdit = []

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

// =========================
// 📲 LOG: wysłane SMS z formularzem
// =========================

export async function logSmsFormSent({
	phone,
	name,
	service,
	leadId,
	source,
	visitDate, // "YYYY-MM-DD" или Date
	visitTime, // "HH:MM"
}) {
	try {
		if (!phone) {
			console.warn('[logSmsFormSent] no phone, skip')
			return
		}

		let visitDateObj = null

		if (typeof visitDate === 'string' && visitDate) {
			// строка "YYYY-MM-DD" → дата по Польше (00:00) → JS Date
			visitDateObj = parseVisitDateToDate(visitDate)
		} else if (visitDate instanceof Date) {
			// если вдруг прилетела JS Date — тоже нормализуем к началу дня по Польше
			const dt = DateTime.fromJSDate(visitDate, { zone: ZONE }).startOf('day')
			if (dt.isValid) {
				visitDateObj = dt.toJSDate()
			}
		}

		const entry = await db.smsFormLog.create({
			data: {
				phone,
				name: name || null,
				service: service || null,
				leadId: leadId ? String(leadId) : null,
				source: source || null,
				status: 'pending',
				sentAt: nowPL().toJSDate(), // время отправки по Польше
				visitDate: visitDateObj,
				visitTime: visitTime || null,
			},
		})

		console.log('[logSmsFormSent] created SmsFormLog id =', entry.id)

		await updateSmsTrackerMessage()
	} catch (err) {
		console.error('[logSmsFormSent] FAILED:', err)
	}
}

export async function markSmsFormCompletedByLead(leadId) {
	try {
		if (!leadId) {
			console.warn('[markSmsFormCompletedByLead] no leadId, skip')
			return
		}

		const updated = await db.smsFormLog.updateMany({
			where: {
				leadId: String(leadId),
				status: 'pending',
			},
			data: {
				status: 'done',
				completedAt: nowPL().toJSDate(),
			},
		})

		console.log(
			`[markSmsFormCompletedByLead] updated ${updated.count} entries for leadId =`,
			leadId
		)

		if (updated.count > 0) {
			await updateSmsTrackerMessage()
		}
	} catch (err) {
		console.error('[markSmsFormCompletedByLead] FAILED:', err)
	}
}

export async function markSmsFormCompletedByPhone(
	phone,
	{ visitDate, visitTime } = {}
) {
	try {
		if (!phone) {
			console.warn('[markSmsFormCompletedByPhone] no phone, skip')
			return
		}

		// базовый фильтр
		const where = {
			phone,
			status: 'pending',
		}

		// если есть дата визита — нормализуем её так же, как при логировании
		let visitDateObj = null
		if (typeof visitDate === 'string' && visitDate) {
			visitDateObj = parseVisitDateToDate(visitDate)
		} else if (visitDate instanceof Date) {
			const dt = DateTime.fromJSDate(visitDate, { zone: ZONE }).startOf('day')
			if (dt.isValid) {
				visitDateObj = dt.toJSDate()
			}
		}

		if (visitDateObj) {
			where.visitDate = visitDateObj
		}
		if (visitTime) {
			where.visitTime = visitTime
		}

		const updated = await db.smsFormLog.updateMany({
			where,
			data: {
				status: 'done',
				completedAt: nowPL().toJSDate(),
			},
		})

		console.log(
			`[markSmsFormCompletedByPhone] phone=${phone}, visitDate=${
				visitDate || ''
			}, visitTime=${visitTime || ''} → updated ${updated.count}`
		)

		if (updated.count > 0) {
			await updateSmsTrackerMessage()
		}
	} catch (err) {
		console.error('[markSmsFormCompletedByPhone] FAILED:', err)
	}
}

// =========================
// 📅 ЗАКРЕПЛЁННОЕ РАСПИСАНИЕ В РАБОЧЕМ ЧАТЕ
// =========================

let dynamicScheduleMessageId = null

// HH:MM -> минуты с полуночи
function timeToMinutes(timeStr) {
	if (!timeStr) return 99999
	const [h, m] = String(timeStr).split(':')
	const hh = parseInt(h, 10)
	const mm = parseInt(m || '0', 10)
	if (Number.isNaN(hh) || Number.isNaN(mm)) return 99999
	return hh * 60 + mm
}

export async function updateScheduleMessage() {
	// 👇 Жёсткий лог в самом начале, чтобы проверить, что функция вообще вызывается на проде
	console.log('[updateScheduleMessage] START, WORK_CHAT_ID =', WORK_CHAT_ID)

	if (!WORK_CHAT_ID) {
		console.warn(
			'[updateScheduleMessage] WORK_CHAT_ID is not configured, skip schedule update'
		)
		return
	}

	let text = ''
	let orders = []

	try {
		const todayPL = nowPL().startOf('day')
		const todayDate = todayPL.toJSDate()

		console.log(
			'[updateScheduleMessage] todayPL (Europe/Warsaw) =',
			todayPL.toISO(),
			'-> JS Date =',
			todayDate.toISOString()
		)

		// берём только визиты с датой+временем, начиная СЕГОДНЯ по Польше
		orders = await db.workOrder.findMany({
			where: {
				visitDate: {
					gte: todayDate,
				},
				visitTime: {
					not: null,
				},
			},
			orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
		})

		console.log(
			`[updateScheduleMessage] found ${orders.length} orders (>= today)`
		)

		// ручная сортировка: дата (PL) → время → id
		orders.sort((a, b) => {
			const da = a.visitDate
				? DateTime.fromJSDate(a.visitDate, { zone: ZONE }).startOf('day')
				: null
			const dbt = b.visitDate
				? DateTime.fromJSDate(b.visitDate, { zone: ZONE }).startOf('day')
				: null

			if (da && dbt) {
				const diff = da.toMillis() - dbt.toMillis()
				if (diff !== 0) return diff
			}

			const ta = timeToMinutes(a.visitTime)
			const tb = timeToMinutes(b.visitTime)
			if (ta !== tb) return ta - tb

			if (a.id === b.id) return 0
			return a.id > b.id ? 1 : -1
		})

		if (!orders.length) {
			text = '📅 Aktualny grafik wizyt\n\nNa razie brak zaplanowanych wizyt.'
		} else {
			// группируем по дате (ключ по Польше, yyyy-MM-dd)
			const byDate = new Map()
			for (const o of orders) {
				if (!o.visitDate) continue

				const dtPL = DateTime.fromJSDate(o.visitDate, { zone: ZONE }).startOf(
					'day'
				)
				if (!dtPL.isValid) continue

				const key = dtPL.toISODate() // yyyy-MM-dd

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

				const dt = DateTime.fromISO(key, { zone: ZONE })
				const header = formatDateWithDay(dt.toJSDate())

				if (idx > 0) {
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

					lines.push('')
				}
			})

			text = lines.join('\n')
		}
	} catch (err) {
		// Если вообще что-то пошло не так при работе с БД/датами — ЛОГИРУЕМ и всё равно пытаемся отправить сообщение
		console.error('[updateScheduleMessage] BUILD FAILED:', err)
		text =
			'📅 Aktualny grafik wizyt\n\n⚠️ Błąd przy generowaniu grafiku. Sprawdź logi serwera.'
	}

	// ---- этап отправки в Telegram — вынесен в отдельный try/catch ----

	try {
		const targetMessageId = dynamicScheduleMessageId || WORK_SCHEDULE_MESSAGE_ID

		console.log(
			'[updateScheduleMessage] sending to Telegram, targetMessageId =',
			targetMessageId
		)

		// если ни env, ни динамический id ещё не известны — просто создаём новое
		if (!targetMessageId) {
			const sent = await bot.telegram.sendMessage(WORK_CHAT_ID, text)
			dynamicScheduleMessageId = sent.message_id
			console.log(
				'[updateScheduleMessage] schedule message created with id:',
				sent.message_id
			)
			return
		}

		try {
			await bot.telegram.editMessageText(
				WORK_CHAT_ID,
				targetMessageId,
				undefined,
				text
			)

			console.log(
				'[updateScheduleMessage] schedule message UPDATED, id =',
				targetMessageId
			)
		} catch (errEdit) {
			const desc =
				errEdit?.response?.description ||
				errEdit?.description ||
				errEdit?.message ||
				''

			// --------------------------
			// 🟩 1. Особый случай: текст тот же
			// --------------------------
			if (desc.includes('message is not modified')) {
				console.log(
					'[updateScheduleMessage] message is not modified → skipping creating new'
				)
				return
			}

			// --------------------------
			// 🟥 2. Любая другая ошибка — создаём новое сообщение
			// --------------------------
			console.error(
				'[updateScheduleMessage] editMessageText failed, will create new one:',
				errEdit?.response || errEdit
			)

			const sent = await bot.telegram.sendMessage(WORK_CHAT_ID, text)
			dynamicScheduleMessageId = sent.message_id

			console.log(
				'[updateScheduleMessage] NEW schedule message id:',
				sent.message_id,
				'(pin it and/or put into env TELEGRAM_WORK_SCHEDULE_MESSAGE_ID)'
			)
		}
	} catch (errSend) {
		console.error('[updateScheduleMessage] SEND FAILED (Telegram):', errSend)
	}
}

// =========================
// 📲 ZAKŁADKA: SMS z formularzem (w GROUP_CHAT_ID)
// =========================

export async function updateSmsTrackerMessage() {
	try {
		console.log(
			'[updateSmsTrackerMessage] START, GROUP_CHAT_ID =',
			GROUP_CHAT_ID
		)

		if (!GROUP_CHAT_ID) {
			console.warn(
				'[updateSmsTrackerMessage] GROUP_CHAT_ID is not configured, skip'
			)
			return
		}

		// "Сегодня" по Польше
		const todayPL = nowPL().startOf('day')
		const todayDate = todayPL.toJSDate()

		// 🔹 ЛОГИКА ФИЛЬТРА:
		//   - если есть visitDate → считаем по visitDate >= сегодня
		//   - если visitDate нет → фильтруем по sentAt >= сегодня
		const logs = await db.smsFormLog.findMany({
			where: {
				status: { not: 'deleted' },
				OR: [
					{
						visitDate: {
							gte: todayDate,
						},
					},
					{
						AND: [
							{ visitDate: null },
							{
								sentAt: {
									gte: todayDate,
								},
							},
						],
					},
				],
			},
			orderBy: [{ visitDate: 'asc' }, { sentAt: 'asc' }, { id: 'asc' }],
		})

		console.log(
			`[updateSmsTrackerMessage] fetched ${
				logs.length
			} SMS logs (>= ${todayDate.toISOString()} by visitDate/sentAt)`
		)

		let text = ''

		if (!logs.length) {
			text =
				'📲 SMS z formularzem\n\nNa razie brak wysłanych SMS z formularzem (od dziś).'
		} else {
			const lines = []
			lines.push('📲 SMS z formularzem – od dziś i później')
			lines.push('')

			// 🔹 Группируем по "дате показа":
			//   если есть visitDate → по visitDate
			//   иначе по дате отправки (sentAt)
			const byDate = new Map()

			for (const log of logs) {
				const baseDate = log.visitDate || log.sentAt
				if (!baseDate) continue

				const dt = DateTime.fromJSDate(baseDate, { zone: ZONE }).startOf('day')
				if (!dt.isValid) continue

				const key = dt.toISODate() // 'yyyy-MM-dd'

				if (!byDate.has(key)) byDate.set(key, [])
				byDate.get(key).push(log)
			}

			const dateKeys = Array.from(byDate.keys()).sort()

			dateKeys.forEach((key, idx) => {
				const group = byDate.get(key)
				if (!group || !group.length) return

				const dt = DateTime.fromISO(key, { zone: ZONE })
				const header = formatDateWithDay(dt.toJSDate())

				const total = group.length
				const pending = group.filter(g => g.status === 'pending').length

				if (idx > 0) {
					lines.push('')
					lines.push('────────────────────')
					lines.push('')
				}

				lines.push(
					`📆 ${header} – wysłane: ${total}${
						pending ? ` (⏳ oczekuje: ${pending})` : ''
					}`
				)
				lines.push('')

				for (const log of group) {
					// время отправки СМС по Польше
					const t = DateTime.fromJSDate(log.sentAt, { zone: ZONE }).toFormat(
						'HH:mm'
					)

					const parts = []
					parts.push(`#${log.id}`)
					parts.push(t)
					parts.push(log.phone)

					if (log.name) parts.push(log.name)

					// если есть планируемое время визита — подсветим
					if (log.visitTime) {
						parts.push(`🕒 ${formatTime(log.visitTime)}`)
					}

					if (log.status === 'done') {
						parts.push('✅')
					} else {
						parts.push('⏳')
					}

					lines.push(parts.join(' – '))
				}
			})

			text = lines.join('\n')
		}

		const targetMessageId = dynamicSmsTrackerMessageId || SMS_TRACKER_MESSAGE_ID

		console.log(
			'[updateSmsTrackerMessage] sending to Telegram, targetMessageId =',
			targetMessageId
		)

		if (!targetMessageId) {
			const sent = await bot.telegram.sendMessage(GROUP_CHAT_ID, text)
			dynamicSmsTrackerMessageId = sent.message_id
			console.log(
				'[updateSmsTrackerMessage] tracker message created with id:',
				sent.message_id
			)
			return
		}

		try {
			await bot.telegram.editMessageText(
				GROUP_CHAT_ID,
				targetMessageId,
				undefined,
				text
			)
			console.log(
				'[updateSmsTrackerMessage] tracker message UPDATED, id =',
				targetMessageId
			)
		} catch (errEdit) {
			const desc =
				errEdit?.response?.description ||
				errEdit?.description ||
				errEdit?.message ||
				''

			// если "message is not modified" — не создаём новое
			if (
				errEdit?.response?.error_code === 400 &&
				typeof desc === 'string' &&
				desc.includes('message is not modified')
			) {
				console.log(
					'[updateSmsTrackerMessage] message not modified, skip creating new one'
				)
				return
			}

			console.error(
				'[updateSmsTrackerMessage] editMessageText failed, will create new one:',
				errEdit?.response || errEdit
			)

			const sent = await bot.telegram.sendMessage(GROUP_CHAT_ID, text)
			dynamicSmsTrackerMessageId = sent.message_id
			console.log(
				'[updateSmsTrackerMessage] NEW tracker message id:',
				sent.message_id,
				'(pin it and/or put into env TELEGRAM_SMS_TRACKER_MESSAGE_ID)'
			)
		}
	} catch (err) {
		console.error('[updateSmsTrackerMessage] FAILED:', err)
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

		const lines = []

		lines.push('🔧 Dane klienta (zaktualizowane)')
		lines.push('')

		if (order.visitDate || order.visitTime) {
			const terminLine = buildTerminLine(order.visitDate, order.visitTime)
			if (terminLine) {
				lines.push(`📅 TERMIN: ${terminLine}`)
				lines.push('')
			}
		}

		if (order.name) lines.push(`👤 Imię: ${order.name}`)
		if (order.phone) lines.push(`📞 Telefon: ${order.phone}`)
		if (order.service) lines.push(`🔧 Usługa: ${order.service}`)
		if (order.regNumber) lines.push(`🚘 Rejestracja: ${order.regNumber}`)
		if (order.carModel) lines.push(`🚗 Model: ${order.carModel}`)
		if (order.color) lines.push(`🎨 Kolor: ${order.color}`)
		if (order.wheelRimSize) lines.push(`🛞 Felga: ${order.wheelRimSize}`)
		if (order.tireSize) lines.push(`📏 Rozmiar opony: ${order.tireSize}`)
		if (order.address) lines.push(`📍 Adres: ${order.address}`)

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

		// 💼 Faktura
		if (order.wantsInvoice) {
			lines.push('')
			lines.push('💼 Faktura: TAK')
			if (order.invoiceNip) lines.push(`   • NIP: ${order.invoiceNip}`)
			if (order.invoiceEmail) lines.push(`   • E-mail: ${order.invoiceEmail}`)
		}

		if (order.notes) {
			lines.push('')
			lines.push(`📝 Uwagi: ${order.notes}`)
		}

		const text = lines.join('\n')

		const inline = []

		// Formularz Google
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

		// Edytuj
		if (order.id && SITE_URL) {
			const editUrl = new URL('/admin/work-order', SITE_URL)
			editUrl.searchParams.set('id', order.id)
			inline.push([Markup.button.url('✏️ Edytuj zlecenie', editUrl.toString())])
		}

		// Anuluj
		inline.push([
			Markup.button.callback('❌ Anuluj zlecenie', `cancel_order_${order.id}`),
		])

		const keyboard = Markup.inlineKeyboard(inline)

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

function normalizePhone(raw) {
	if (!raw) return null

	const trimmed = raw.trim()
	const hasPlus = trimmed.startsWith('+')

	const digits = trimmed.replace(/[^\d]/g, '')

	if (digits.length < 7) return null

	let phone

	if (hasPlus) {
		phone = '+' + digits
	} else if (digits.length === 9) {
		phone = '+48' + digits
	} else {
		phone = '+' + digits
	}

	return phone
}

async function handleSmsLinkForPhone(ctx, rawInput) {
	if (!ALLOWED_HANDLERS.includes(ctx.from.id)) {
		return
	}

	if (ctx.chat?.type !== 'private') {
		return
	}

	const phone = normalizePhone(rawInput)
	if (!phone) {
		return ctx.reply('Podaj poprawny numer telefonu, np. +48 123 456 789')
	}

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

bot.command('sms', async ctx => {
	const parts = ctx.message.text.split(/\s+/)

	if (parts.length < 2) {
		return ctx.reply('Użycie: /sms 123456789 lub /sms +48 123 456 789')
	}

	const rawPhone = parts.slice(1).join(' ')
	return handleSmsLinkForPhone(ctx, rawPhone)
})

bot.on('text', async (ctx, next) => {
	const text = ctx.message.text?.trim() || ''

	// если это команда (/coś) — не трогаем, но пропускаем дальше
	if (text.startsWith('/')) {
		return next()
	}

	// для обычного текста в ЛС можем пробовать разобрать телефон
	await handleSmsLinkForPhone(ctx, text)

	// обязательно вызываем next(), чтобы другие обработчики тоже могли отработать
	return next()
})

/* ─────────────────────────────────────────────
   🔹 Команда: /smsdel 123  → пометить лог как deleted
───────────────────────────────────────────── */

bot.command('smsdel', async ctx => {
	try {
		// только админы
		if (!ALLOWED_HANDLERS.includes(ctx.from.id)) {
			return ctx.reply('Brak uprawnień.')
		}

		const chatType = ctx.chat?.type
		const isPrivate = chatType === 'private'
		const isGroup = chatType === 'group' || chatType === 'supergroup'

		if (!isPrivate && !isGroup) {
			return ctx.reply('Ta komenda działa tylko w czacie prywatnym lub grupie.')
		}

		const parts = ctx.message.text.split(/\s+/)
		if (parts.length < 2) {
			return ctx.reply('Użycie: /smsdel <id>, np. /smsdel 12')
		}

		const id = Number(parts[1])
		if (!id || Number.isNaN(id)) {
			return ctx.reply('Podaj poprawne ID (liczba), np. /smsdel 12')
		}

		const res = await db.smsFormLog.updateMany({
			where: { id, status: { not: 'deleted' } },
			data: { status: 'deleted' },
		})

		if (res.count === 0) {
			await ctx.reply(
				`Brak logu z ID #${id} lub już jest oznaczony jako usunięty.`
			)
			return
		}

		await ctx.reply(`Log SMS #${id} został oznaczony jako usunięty.`, {
			reply_to_message_id: ctx.message.message_id,
		})

		await updateSmsTrackerMessage()
	} catch (err) {
		console.error('/smsdel failed:', err)
		return ctx.reply('Wystąpił błąd przy usuwaniu logu.')
	}
})
/* ─────────────────────────────────────────────
   🔍 Komenda: /debug  → info dla developera
───────────────────────────────────────────── */

bot.command('debug', async ctx => {
	try {
		// только админы, чтобы клиентам не светить внутренности
		if (!ALLOWED_HANDLERS.includes(ctx.from.id)) {
			return ctx.reply('Brak uprawnień do debugowania.')
		}

		const chatId = ctx.chat?.id
		const chatType = ctx.chat?.type
		const chatTitle = ctx.chat?.title || ctx.chat?.username || '(brak tytułu)'
		const userId = ctx.from?.id
		const username = ctx.from?.username || ctx.from?.first_name || 'unknown'

		const lines = []

		// базовая инфа
		lines.push('🔧 DEBUG BOT')
		lines.push('')
		lines.push(`👤 Ty: ${username} (id: ${userId})`)
		lines.push(
			`💬 Chat: ${chatTitle} (type: ${chatType || 'unknown'}, id: ${chatId})`
		)
		lines.push('')

		// update / message
		const updateId = ctx.update?.update_id
		const msg = ctx.message
		if (msg) {
			lines.push(`📨 update_id: ${updateId ?? '(brak)'}`)
			lines.push(`📩 message_id: ${msg.message_id}`)
			lines.push(
				`🕒 date: ${new Date(msg.date * 1000).toISOString().slice(0, 19)}`
			)
			if (msg.text) {
				const shortText =
					msg.text.length > 80 ? msg.text.slice(0, 77) + '...' : msg.text
				lines.push(`📝 text: ${JSON.stringify(shortText)}`)
			}
			lines.push('')
		}

		// env / config
		lines.push(`GROUP_CHAT_ID: ${GROUP_CHAT_ID}`)
		lines.push(`WORK_CHAT_ID: ${WORK_CHAT_ID}`)
		lines.push(`WORK_SCHEDULE_MESSAGE_ID: ${WORK_SCHEDULE_MESSAGE_ID}`)
		lines.push(`SMS_TRACKER_MESSAGE_ID: ${SMS_TRACKER_MESSAGE_ID}`)
		lines.push('')

		// админы чата (если это группа)
		if (chatId && (chatType === 'group' || chatType === 'supergroup')) {
			try {
				const admins = await ctx.telegram.getChatAdministrators(chatId)
				lines.push('👥 Administratorzy tego czatu:')
				for (const a of admins) {
					const u = a.user
					const name = u.username || u.first_name || 'bez nazwy'
					lines.push(`• ${name} (id: ${u.id})`)
				}
				lines.push('')
			} catch (e) {
				console.error('debug: getChatAdministrators failed', e)
				lines.push('👥 Administratorzy: błąd przy pobieraniu.')
				lines.push('')
			}
		}

		// последние 5 логов СМС
		try {
			const lastLogs = await db.smsFormLog.findMany({
				orderBy: { id: 'desc' },
				take: 5,
			})

			if (lastLogs.length) {
				lines.push('📲 Ostatnie SMS logs (max 5):')
				for (const log of lastLogs) {
					const dt = DateTime.fromJSDate(log.sentAt, { zone: ZONE }).toFormat(
						'dd.LL HH:mm'
					)

					const visitStr = log.visitDate
						? DateTime.fromJSDate(log.visitDate, {
								zone: ZONE,
						  }).toFormat('dd.LL')
						: '-'

					lines.push(
						`#${log.id} – ${dt} – ${log.phone} – ${
							log.status
						} – visit: ${visitStr} ${log.visitTime || ''}`
					)
				}
			} else {
				lines.push('📲 Ostatnie SMS logs: brak wpisów.')
			}
		} catch (e) {
			console.error('debug: smsFormLog query failed', e)
			lines.push('📲 Ostatnie SMS logs: błąd przy pobieraniu.')
		}

		await ctx.reply(lines.join('\n'), {
			reply_to_message_id: ctx.message.message_id,
		})
	} catch (err) {
		console.error('/debug failed:', err)
		return ctx.reply('Wystąpił błąd przy debugowaniu.')
	}
})

/* ─────────────────────────────────────────────
   🔍 /rawdebug → сырой JSON
   - если команда с ответом на сообщение → debug этого сообщения
   - иначе → полный ctx.update
───────────────────────────────────────────── */

bot.command('rawdebug', async ctx => {
	try {
		if (!ALLOWED_HANDLERS.includes(ctx.from.id)) {
			return ctx.reply('Brak uprawnień do debugowania.')
		}

		// 1) Если /rawdebug отправлен как ответ на сообщение — берём именно его
		let target = null
		let label = ''

		if (ctx.message?.reply_to_message) {
			target = ctx.message.reply_to_message
			label = '🔍 RAW reply_to_message:'
		} else {
			// 2) Иначе — весь update (как раньше)
			target = ctx.update
			label = '🔍 RAW ctx.update:'
		}

		const payload = JSON.stringify(target, null, 2)

		// Если влезает — отправляем текстом
		if (payload.length <= 3500) {
			return ctx.reply(`${label}\n\n${payload}`)
		}

		// Если слишком большой — отправляем файлом
		const buffer = Buffer.from(payload, 'utf8')

		await ctx.reply(`${label} wysyłam jako plik JSON…`, {
			reply_to_message_id: ctx.message.message_id,
		})

		return ctx.replyWithDocument(
			{ source: buffer, filename: 'rawdebug.json' },
			{ reply_to_message_id: ctx.message.message_id }
		)
	} catch (err) {
		console.error('/rawdebug failed:', err)
		return ctx.reply('Wystąpił błąd przy rawdebug.')
	}
})
