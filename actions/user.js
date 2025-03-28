'use server'

import { db } from '@/lib/prisma'
import { createZadarmaCustomer } from './zadarma'

export async function createUser(data) {
	try {
		// Проверяем, есть ли пользователь с таким email
		const existingUser = await db.user.findUnique({
			where: { email: data.email },
		})

		if (existingUser) {
			return existingUser
		}

		const dataCustomer = {
			name: data.name,
			email: data.email,
			phone: data.phone,
		}

		const customer = await createZadarmaCustomer(dataCustomer)

		const newUser = await db.user.create({
			data: {
				email: data.email,
				phone: data.phone,
				name: data.name,
				username: data.name + '-' + data.email.split('@')[0],
				zadarmaId: customer.data.id,
			},
		})

		return newUser
	} catch (error) {
		console.error(error)
	}
}
