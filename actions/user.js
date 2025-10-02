'use server'

import { logError } from '@/lib/logError'
import { db } from '@/lib/prisma'

export async function createUser(data) {
	try {
		if (!data.name || !data.phone) {
			throw new Error('❌ createUser: Name and phone are required')
		}

		const existingUser = await db.user.findFirst({
			where: {
				OR: [{ email: data.email }, { phone: data.phone }],
			},
		})

		if (existingUser && existingUser.role !== 'admin') return existingUser

		// const customer = await createZadarmaCustomer({
		// 	name: data.name,
		// 	email: data.email || '',
		// 	phone: data.phone,
		// })

		// if (!customer || customer.status !== 'success') {
		// 	throw new Error('❌ createUser: Failed to create customer in Zadarma')
		// }

		const userPayload = {
			name: data.name,
			phone: data.phone,
			// zadarmaId: customer.data.id.toString() || '',
			email: data.email || undefined,
			username: data.email
				? `${data.name}-${data.email.split('@')[0]}`
				: `${data.name}-${customer.data.id}`,
		}

		const response = await db.user.create({ data: userPayload })

		return response
	} catch (error) {
		const msg = logError('Ошибка в createUser', error)
		throw new Error(msg)
	}
}
