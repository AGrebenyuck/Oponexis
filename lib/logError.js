// utils/logError.js
export const logError = (prefix, error) => {
	let message = 'Unknown error'
	if (typeof error === 'object' && error !== null) {
		if ('message' in error) message = error.message
		else message = JSON.stringify(error)
	} else {
		message = String(error)
	}

	console.error(`❌ ${prefix}:`, message)
	return message
}
