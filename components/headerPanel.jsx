'use client'

import { checkUser } from '@/lib/checkUser'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Button from './ui/button'
import UserMenu from './userMenu'

const HeaderPanel = () => {
	const [role, setRole] = useState('user')

	useEffect(() => {
		const fetchUser = async () => {
			const role = await checkUser()
			setRole(role?.role)
		}

		fetchUser()
	}, [])

	return (
		<header className='relative px-4 py-3 sm:px-10 md:px-16 sm:py-6'>
			<nav
				className='flex items-center justify-between'
				aria-label='Podstawowa nawigacja'
			>
				<Link href={'/'}>
					<Image
						src={'/logo.svg'}
						alt='Logo Oponexis'
						width={300}
						height={52}
						className='w-[160px] h-[28px] md:w-[230px] lg:w-[300px] md:h-[40px] lg:h-[52px] cursor-pointer'
					/>
				</Link>

				<div className='flex items-center gap-3'>
					<SignedOut>
						<SignInButton
							mode='modal'
							forceRedirectUrl='/'
							signUpForceRedirectUrl='/'
						>
							<Button
								type='alternative'
								className='md:px-6 md:py-1 lg:px-8 lg:py-2 3xl:px-18 3xl:py-5'
								suppressHydrationWarning
							>
								Login
							</Button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<UserMenu role={role} />
					</SignedIn>
				</div>
			</nav>
		</header>
	)
}

export default HeaderPanel
