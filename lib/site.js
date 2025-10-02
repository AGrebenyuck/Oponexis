export const SITE = {
	NAME: 'Oponexis',
	CITY: 'Opole',
	PHONE_DISPLAY: '+48 733 889 722',
	PHONE_RAW: '+48733889722',
	EMAIL: 'info@oponexis.pl',
	ADDRESS: 'Opole i okolice',
}

export const LINKS = {
	PHONE_TEL: `tel:${SITE.PHONE_RAW}`,
	EMAIL_MAILTO: `mailto:${SITE.EMAIL}`,
}

export function formatPhone(raw = SITE.PHONE_RAW) {
	return raw
		.replace('+48', '+48 ')
		.replace(/(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3')
}
