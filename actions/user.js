'use server'

import { db } from '@/lib/prisma'
import { createZadarmaCustomer } from './zadarma'

export async function createUser(data) {
	try {
		// Проверяем, есть ли пользователь с таким email
		const existingUser = await db.user.findFirst({
			where: {
				OR: [{ email: data.email }, { phone: data.phone }],
			},
		})

		if (existingUser) {
			return existingUser
		}

		const dataCustomer = {
			name: data.name,
			email: data.email || '',
			phone: data.phone,
		}

		const customer = await createZadarmaCustomer(dataCustomer)

		const dataUser = {
			phone: data.phone,
			name: data.name,
			zadarmaId: customer.data.id,
		}

		if (data.email) {
			dataUser.email = data.email
			dataUser.username = data.name + '-' + data.email.split('@')[0]
		} else {
			dataUser.username = data.name + customer.data.id
		}

		const newUser = await db.user.create({
			data: dataUser,
		})

		return newUser
	} catch (error) {
		console.error(error)
	}
}
