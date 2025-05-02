'use server'

import { db } from '@/lib/prisma'
import { createZadarmaCustomer } from './zadarma'

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

		if (existingUser) return existingUser

		const customer = await createZadarmaCustomer({
			name: data.name,
			email: data.email || '',
			phone: data.phone,
		})

		if (!customer || customer.status !== 'success') {
			throw new Error('❌ createUser: Failed to create customer in Zadarma')
		}

		const userPayload = {
			name: data.name,
			phone: data.phone,
			zadarmaId: customer.data.id,
			email: data.email || undefined,
			username: data.email
				? `${data.name}-${data.email.split('@')[0]}`
				: `${data.name}-${customer.data.id}`,
		}

		return await db.user.create({ data: userPayload })
	} catch (error) {
		console.error('❌ Ошибка в createUser:', error)
		throw new Error(error.message || 'Unknown error in createUser')
	}
}
