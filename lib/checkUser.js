'use server'

import { createZadarmaCustomer } from '@/actions/zadarma'
import { clerkClient, currentUser } from '@clerk/nextjs/server'
import { db } from './prisma'

export const checkUser = async () => {
	const user = await currentUser()

	if (!user) {
		return null
	}
	try {
		const loggedInUser = await db?.user.findUnique({
			where: {
				clerkUserId: user.id,
			},
		})
		if (loggedInUser) {
			return loggedInUser
		}
		const name = `${user.firstName} ${user.lastName}`

		await (
			await clerkClient()
		).users.updateUser(user.id, {
			username: name.split(' ').join('-') + user.id.slice(-4),
		})

		// 1. Ищем пользователя по email
		const existingUser = await db.user.findUnique({
			where: { email: user.emailAddresses[0].emailAddress },
		})

		let newUser

		if (existingUser) {
			// 🔹 Пользователь существует — просто обновляем
			newUser = await db.user.update({
				where: { email: user.emailAddresses[0].emailAddress },
				data: {
					clerkUserId: user.id,
				},
			})
		} else {
			// 🔹 Пользователя нет — создаём и регистрируем в Zadarma
			const customerData = {
				name: name,
				email: user.emailAddresses[0].emailAddress,
				phone: '',
			}

			const customer = await createZadarmaCustomer(customerData)

			newUser = await db.user.create({
				data: {
					clerkUserId: user.id,
					name: name,
					email: user.emailAddresses[0].emailAddress,
					username: name
						? name.split(' ').join('-') + user.id.slice(-4)
						: `user-${user.id.slice(-4)}`,
					zadarmaId: customer?.data?.id,
				},
			})
		}

		return newUser
	} catch (error) {
		console.error(error)
	}
}

export const isLoggedIn = async () => {
	const user = await currentUser()
	return !!user
}
