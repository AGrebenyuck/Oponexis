// Импортируем пакет zadarma
const { api } = require('zadarma')

const DEFAULT_USER = 250485 // user-ID, на который выписан API-ключ

/**
 * Пытаемся сменить ответственного за клиента.
 * Если смена не удалась – бросаем Error, чтобы caller решил, что делать дальше.
 */
export async function ensureCustomerAccessible(customerId) {
	const res = await api({
		http_method: 'PUT',
		api_method: `/v1/zcrm/customers/${customerId}`,
		params: {
			customer: {
				responsible_user: DEFAULT_USER, // ← главное поле
			},
		},
	})

	if (res.status === 'success') return true

	throw new Error(
		`❌ Не смог переназначить клиента ${customerId}: ` +
			(res?.data?.error || res.message)
	)
}

// 🔹 Функция для создания клиента в CRM Zadarma
export const createZadarmaCustomer = async customer => {
	try {
		const response = await api({
			http_method: 'POST',
			api_method: '/v1/zcrm/customers',
			params: {
				customer: {
					name: customer.name,
					status: 'individual', // или 'individual' в зависимости от типа клиента
					type: 'client',
					phones: [
						{
							type: 'personal',
							phone: customer.phone,
						},
					],
					contacts: [
						{
							type: 'email_personal',
							value: customer.email ? customer.email : '',
						},
					],
					comment: `Nowy klient: ${customer.name}`,
				},
			},
		})

		if (response.status === 'success') {
			console.log('✅ Klient utworzony w Zadarma CRM:', response)
			return response
		} else {
			throw new Error(`❌ Błąd Zadarma CRM: ${response.message}`)
		}
	} catch (error) {
		console.error('❌ Błąd podczas tworzenia klienta w Zadarma:', error)
		return { success: false, error: error.message }
	}
}

export const updateZadarmaCustomer = async customer => {
	try {
		const customerPayload = {
			status: 'individual',
			type: 'client',
			comment: customer.name ? `Nowy klient: ${customer.name}` : '',
		}

		if (customer.name) {
			customerPayload.name = customer.name
		}

		if (customer.phone) {
			customerPayload.phones = [
				{
					type: 'personal',
					phone: customer.phone,
				},
			]
		}

		if (customer.email) {
			customerPayload.contacts = [
				{
					type: 'email_personal',
					value: customer.email,
				},
			]
		}

		const response = await api({
			http_method: 'PUT',
			api_method: `/v1/zcrm/customers/${customer.id}`,
			params: { customer: customerPayload },
		})

		if (response.status === 'success') {
			console.log('✅ Klient zaktualizowany w Zadarma CRM:', response)
			return response
		} else {
			throw new Error(`❌ Błąd Zadarma CRM: ${response.message}`)
		}
	} catch (error) {
		console.error('❌ Błąd podczas aktualizacji klienta w Zadarma:', error)
		return { success: false, error: error.message }
	}
}

export async function createZadarmaDeal(dealData) {
	const send = () =>
		api({
			http_method: 'POST',
			api_method: '/v1/zcrm/deals',
			params: {
				deal: {
					title: dealData.title,
					budget: dealData.budget,
					currency: dealData.currency || 'PLN',
					status: dealData.status || 'new',
					responsible_user: dealData.responsible_user || 250485,
					customer_id: dealData.customer_id,
				},
			},
		})

	let res = await send()

	// ── Если нет прав на клиента – пробуем «починить» и повторить ──────────
	if (res.status === 'error' && res.data?.validation_errors?.customer_id) {
		console.warn(
			`⚠️ Нет доступа к клиенту ${dealData.customer_id}. ` +
				`Пробую назначить владельца…`
		)

		await ensureCustomerAccessible(dealData.customer_id)
		res = await send() // второй (и обычно успешный) запрос
	}

	// ── Финальная проверка ─────────────────────────────────────────────────
	if (res.status !== 'success') {
		throw new Error(
			`Zadarma Deal Error → ${res.data?.error || res.message || 'unknown'}`
		)
	}

	console.log('✅ Сделка создана:', res.data)
	return res.data // { id, … }
}

// 🔹 Функция для создания задания в CRM Zadarma
export const createZadarmaTask = async (reservation, customerId, dealId) => {
	try {
		const deltaDescription = {
			ops: [
				{
					attributes: {
						bold: true,
					},
					insert: `Rezerwacja usługi:`,
				},
				{
					insert: `${reservation.serviceNames.join(', ')}\n`,
				},
				{
					attributes: {
						bold: true,
					},
					insert: `Kontakt:`,
				},
				{
					insert: `${reservation.contacts}\n`,
				},
				{
					attributes: {
						bold: true,
					},
					insert: `Adres:`,
				},
				{ insert: `${reservation.address}\n` },
				{
					attributes: {
						bold: true,
					},
					insert: `Dodatkowa Informacja:`,
				},
				{ insert: `${reservation.additionalInfo || reservation.comment}\n` },
				reservation.isAdditionalService
					? {
							insert: 'Zadzwoń po dodatkowe usługi\n',
					  }
					: null,
				reservation.vin ? { insert: `VIN: ${reservation.vin}\n` } : null,
			].filter(Boolean),
		}
		const NeedToCall = reservation.isAdditionalService ? ' | Zadzwoń' : ''

		const response = await api({
			http_method: 'POST',
			api_method: '/v1/zcrm/events',
			params: {
				event: {
					type: 'task', // Тип события (например, встреча)
					title: `${reservation.service} | dealId:${dealId} ${NeedToCall}`,
					start: reservation.startTime,
					end: reservation.endTime,
					description: JSON.stringify(deltaDescription),
					customers: [customerId],
					allDay: false,
					responsible_user: 250485,
				},
			},
		})

		if (response.status === 'success') {
			console.log('✅ Zadanie utworzone w Zadarma CRM:', response)
			return response
		} else {
			throw new Error(`❌ Błąd Zadarma CRM: ${response.message}`)
		}
	} catch (error) {
		console.error('❌ Błąd podczas tworzenia zadania w Zadarma:', error)
		return { success: false, error: error.message }
	}
}

export const processReservation = async () => {
	const customer = await createZadarmaCustomer(customerData)
	console.log(customer)

	if (customer.status && customer.data.id) {
		await createZadarmaTask(reservationData, customer.data.id)
	} else {
		console.error('❌ Nie udało się utworzyć klienta.')
	}
}

export const getZadarmaEvents = async () => {
	const response = await api({
		http_method: 'GET',
		api_method: '/v1/zcrm/events',
	})

	return response || []
}

export const getZadarmaDeal = async dealId => {
	const response = await api({
		http_method: 'GET',
		api_method: `/v1/zcrm/deals/${dealId}`,
	})
	return response
}
export const getZadarmaTask = async taskId => {
	const response = await api({
		http_method: 'GET',
		api_method: `/v1/zcrm/events/${taskId}`,
	})
	return response
}

export const updateZadarmaDeal = async (dealId, updateFields = {}) => {
	const existing = await getZadarmaDeal(dealId)

	if (!existing || existing.status !== 'success') {
		console.error(`❌ Nie udało się pobrać transakcji ${dealId}`)
		return { success: false, error: 'Brak danych transakcji' }
	}

	const deal = existing.data

	// 🔹 Sprawdzamy, czy zmiana faktycznie potrzebna
	const fieldsToUpdate = {
		title: updateFields.title ?? deal.title,
		budget: updateFields.budget ?? deal.budget,
		currency: updateFields.currency ?? deal.currency,
		status: updateFields.status ?? deal.status,
	}

	const isSame =
		fieldsToUpdate.status === deal.status &&
		fieldsToUpdate.title === deal.title &&
		fieldsToUpdate.budget === deal.budget &&
		fieldsToUpdate.currency === deal.currency

	if (isSame) {
		console.log(`ℹ️ Deal ${dealId} nie wymaga aktualizacji`)
		return { success: true, skipped: true }
	}

	// 🔄 Wysyłamy PUT
	const response = await api({
		http_method: 'PUT',
		api_method: `/v1/zcrm/deals/${dealId}`,
		params: {
			deal: fieldsToUpdate,
		},
	})

	if (response?.status === 'success') {
		console.log(`✅ Deal ${dealId} zaktualizowany`)
	} else {
		console.error(`❌ Błąd aktualizacji deal ${dealId}:`, response)
	}

	return response
}

function normalizeDelta(deltaStr) {
	try {
		const delta = JSON.parse(deltaStr)
		if (Array.isArray(delta?.ops)) {
			return delta.ops
				.map(op => op.insert)
				.filter(Boolean)
				.join('')
		}
	} catch (e) {}
	return ''
}

export const updateZadarmaTask = async (eventId, updatedFields = {}) => {
	const existing = await getZadarmaTask(eventId)

	if (!existing || existing.status !== 'success') {
		console.error(`❌ Nie udało się pobrać zadania ${eventId}`)
		return { success: false, error: 'Brak danych zadania' }
	}

	const event = existing.data

	console.log('event.description')
	console.log(event.description)

	const oldSections = extractSectionsFromHtml(event.description)
	const newSections = updatedFields.description
		? extractSectionsFromDelta(updatedFields.description)
		: {}

	const mergedSections = { ...oldSections, ...newSections }

	const mergedDescription = buildDeltaFromSections(mergedSections)

	console.log('old section')
	console.log(oldSections)
	console.log('new section')
	console.log(newSections)
	console.log('mergedSections')
	console.log(mergedSections)
	console.log('mergedDescription')
	console.log(mergedDescription)

	const fieldsToUpdate = {
		title: updatedFields.title ?? event.title,
		start: updatedFields.start ?? event.start,
		end: updatedFields.end ?? event.end,
		description: mergedDescription,
		customers: [event.customers[0].id],
		allDay: false,
		responsible_user: 250485,
	}

	console.log('fieldsToUpdate')
	console.log(fieldsToUpdate)

	const isSame =
		fieldsToUpdate.title === event.title &&
		fieldsToUpdate.start === event.start &&
		fieldsToUpdate.end === event.end &&
		event.description.trim() === mergedDescription.trim()

	if (isSame) {
		console.log(`ℹ️ Event ${eventId} nie wymaga aktualizacji`)
		return { success: true, skipped: true }
	}

	const response = await api({
		http_method: 'PUT',
		api_method: `/v1/zcrm/events/${eventId}`,
		params: {
			event: fieldsToUpdate,
		},
	})

	if (response?.status === 'success') {
		console.log(`✅ Zadanie ${eventId} zaktualizowane`)
	} else {
		console.error(`❌ Błąd aktualizacji event ${eventId}:`, response)
	}

	return response
}

// 🔍 Вспомогательные функции
function extractSectionsFromHtml(html) {
	const sections = {}
	const freeText = []

	const extract = p => {
		const text = p.textContent.trim()
		if (!text) return

		// Пытаемся найти `KEY: значение` даже без <strong>
		const match = text.match(/^(.*?):\s*(.*)$/)
		if (match) {
			const key = match[1].trim()
			const value = match[2].trim()
			sections[key] = value
		} else {
			freeText.push(text)
		}
	}

	if (typeof window === 'undefined') {
		const { JSDOM } = require('jsdom')
		const dom = new JSDOM(html)
		dom.window.document.querySelectorAll('p').forEach(extract)
	} else {
		const parser = new DOMParser()
		const doc = parser.parseFromString(html, 'text/html')
		doc.querySelectorAll('p').forEach(extract)
	}

	if (freeText.length) {
		sections['__freeText'] = freeText
	}

	return sections
}

function extractSectionsFromDelta(delta) {
	const text = normalizeDelta(delta)
	const lines = text.split('\n')
	const sections = {}
	let currentKey = null

	lines.forEach(line => {
		const match = line.match(/^(.*?):\s*(.*)$/)
		if (match) {
			currentKey = match[1].trim()
			const value = match[2].trim()
			sections[currentKey] = value
		} else if (currentKey) {
			sections[currentKey] += '\n' + line
		}
	})

	return sections
}

function buildDeltaFromSections(sections) {
	const ops = []

	Object.entries(sections).forEach(([key, value]) => {
		if (key) {
			ops.push({ insert: key + ':', attributes: { bold: true } })
		}
		if (value) {
			ops.push({ insert: value + '\n' })
		} else {
			ops.push({ insert: '\n' })
		}
	})

	return JSON.stringify({ ops })
}

export const deleteZadarmaEvent = async eventId => {
	try {
		const response = await api({
			http_method: 'DELETE',
			api_method: `/v1/zcrm/events/${eventId}`,
		})

		if (response?.status === 'success') {
			console.log(`✅ Zadarma event ${eventId} został usunięty`)
			return { success: true }
		} else {
			console.error(`❌ Błąd usuwania eventu ${eventId}:`, response)
			return { success: false, error: response?.message || 'Błąd API' }
		}
	} catch (error) {
		console.error(`❌ Wyjątek przy usuwaniu eventu ${eventId}:`, error)
		return { success: false, error: error.message }
	}
}

export const deleteZadarmaDeal = async dealId => {
	try {
		const response = await api({
			http_method: 'DELETE',
			api_method: `/v1/zcrm/deals/${dealId}`,
		})

		if (response?.status === 'success') {
			console.log(`✅ Deal ${dealId} został usunięty z Zadarma CRM`)
			return { success: true }
		} else {
			console.error(`❌ Błąd podczas usuwania deal ${dealId}:`, response)
			return { success: false, error: response?.message || 'Błąd API' }
		}
	} catch (error) {
		console.error(`❌ Wyjątek przy usuwaniu deal ${dealId}:`, error)
		return { success: false, error: error.message }
	}
}

export const getMember = async () => {
	const info = await api({
		api_method: '/v1/zcrm/events/936190',
	})
	return info
}
