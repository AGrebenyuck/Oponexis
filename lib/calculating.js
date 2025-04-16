export const calculateTotalDuration = (selectedServices, allServices) => {
	const Total = selectedServices.reduce((total, serviceName) => {
		const service = allServices?.find(s => s.name === serviceName)
		return service ? total + service.duration : total
	}, 0)
	return Total
}

export const calculateTotalPrice = (
	selectedServices,
	allServices,
	promoCode,
	availablePromoCodes
) => {
	let baseTotal = 0
	let originalTotal = 0

	for (const name of selectedServices) {
		// Ищем в основных услугах
		const main = allServices?.find(service => service.name === name)

		if (main) {
			baseTotal += main.price ?? 0
			originalTotal += main.originalPrice ?? main.price ?? 0
			continue
		}

		// Ищем в подуслугах
		if (allServices) {
			for (const s of allServices) {
				const sub = s.additionalServices?.find(sub => sub.name === name)
				if (sub) {
					baseTotal += sub.price ?? 0
					originalTotal += sub.originalPrice ?? sub.price ?? 0
					break
				}
			}
		}
	}

	// Ищем промокод
	const promo = availablePromoCodes?.find(p => p.code === promoCode)

	let discountedTotal = baseTotal
	let discountAmount = 0
	let discountType = null
	let discountValue = 0

	if (promo) {
		if (promo.type === 'percentage') {
			discountValue = promo.value
			discountAmount = (baseTotal * discountValue) / 100
			discountType = `%`
		} else if (promo.type === 'fixed') {
			discountValue = promo.value
			discountAmount = discountValue
			discountType = `PLN`
		}

		discountedTotal = Math.max(0, baseTotal - discountAmount)
	}

	return {
		baseTotal: originalTotal, // для отображения зачёркнутой
		discountedTotal,
		discountAmount,
		discountType,
		discountValue,
		isDiscountApplied: !!promo,
		discountFromOriginal: originalTotal - discountedTotal,
	}
}
