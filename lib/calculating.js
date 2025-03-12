export const calculateTotalDuration = (selectedServices, allServices) => {
	const Total = selectedServices.reduce((total, serviceName) => {
		const service = allServices.find(s => s.name === serviceName)
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
	const baseTotal = selectedServices.reduce((total, serviceName) => {
		const service = allServices.find(s => s.name === serviceName)
		return service ? total + service.price : total
	}, 0)

	// Ищем промокод в доступных
	const promo = availablePromoCodes?.find(p => p.code === promoCode?.value)

	let discountedTotal = baseTotal
	let discountAmount = 0
	let discountType = null

	if (promo) {
		if (promo.type === 'percentage') {
			discountAmount = (baseTotal * promo.value) / 100
			discountType = `%`
		} else if (promo.type === 'fixed') {
			discountAmount = promo.value
			discountType = `PLN`
		}

		discountedTotal = Math.max(0, baseTotal - discountAmount)
	}

	return {
		baseTotal,
		discountedTotal,
		discountAmount,
		discountType,
		isDiscountApplied: !!promo,
	}
}
