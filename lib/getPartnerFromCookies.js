import { cookies } from 'next/headers'
import { db } from './prisma'

export function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100
}

export async function getPartnerFromCookies() {
	const store = await cookies()
	const code = store.get('opx_ref_code')?.value
	if (!code) return null
	return db.partner.findUnique({ where: { code } })
}
