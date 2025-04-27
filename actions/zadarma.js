// Импортируем пакет zadarma
const { api } = require('zadarma')

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

export const createZadarmaDeal = async dealData => {
	try {
		const response = await api({
			http_method: 'POST',
			api_method: '/v1/zcrm/deals',
			params: {
				deal: {
					title: dealData.title, // Nazwa transakcji
					budget: dealData.budget, // Kwota
					currency: dealData.currency || 'PLN', // Waluta
					status: dealData.status || 'new', // Domyślnie: new
					responsible_user: 250485,
					customer_id: dealData.customer_id, // ID klienta
				},
			},
		})

		if (response.status === 'success') {
			console.log('✅ Deal utworzony w Zadarma CRM:', response)
			return response
		} else {
			throw new Error(`❌ Błąd Zadarma CRM: ${response.message}`)
		}
	} catch (error) {
		console.error('❌ Błąd podczas tworzenia deal w Zadarma:', error)
		return { success: false, error: error.message }
	}
}

// 🔹 Функция для создания задания в CRM Zadarma
export const createZadarmaTask = async (reservation, customerId, dealId) => {
	try {
		const description = `Rezerwacja usługi: ${reservation.serviceNames.join(
			', '
		)} | Kontakt: ${reservation.contacts}| Adres: ${reservation.address} | ${
			reservation.isAdditionalService ? 'Zadzwoń po dodatkowe usługi' : ''
		} |  ${reservation.vin}`
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
					description: description,
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

export const getMember = async () => {
	const info = await api({
		api_method: '/v1/zcrm/customers/68873909',
	})
	console.log('Ты авторизован как:', info)
}
