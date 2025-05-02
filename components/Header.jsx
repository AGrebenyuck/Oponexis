'use client'

import { checkUser } from '@/lib/checkUser'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useEffect, useState } from 'react'
import Button from './ui/button'
import UserMenu from './userMenu'

const Header = memo(() => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [role, setRole] = useState('user')
	const [isLargeScreen, setIsLargeScreen] = useState(false)

	useEffect(() => {
		const handleResize = () => {
			setIsLargeScreen(window?.innerWidth >= 1440)
		}
		handleResize()
		const fetchUser = async () => {
			const role = await checkUser()
			setRole(role?.role)
		}

		fetchUser()
	}, [])

	const menuVariants = {
		open: { opacity: 1, x: 0 },
		closed: { opacity: 0, x: '100vw' },
	}

	const handleClick = (e, targetId) => {
		e.preventDefault()

		document?.getElementById(targetId)?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

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
						className='w-[160px] h-[28px] md:w-[230px] lg:w-[300px] md:h-[40px] lg:h-[52px]'
					/>
				</Link>

				{/* Для больших экранов меню всегда на месте, без анимации */}
				{isLargeScreen ? (
					<ul className='flex gap-11 font-semibold'>
						<li>
							<Link
								href={'#howItWorks'}
								onClick={e => handleClick(e, 'howItWorks')}
								className='transition-colors hover:text-accent-blue'
							>
								Jak działamy
							</Link>
						</li>
						<li>
							<Link
								href={'#services'}
								className='transition-colors hover:text-accent-blue'
								onClick={e => handleClick(e, 'services')}
							>
								Usługi
							</Link>
						</li>
						<li>
							<Link
								href={'#contacts'}
								className='transition-colors hover:text-accent-blue'
								onClick={e => handleClick(e, 'contacts')}
							>
								Kontakt
							</Link>
						</li>
					</ul>
				) : (
					<motion.ul
						className='absolute top-full left-0 w-full flex flex-col items-end gap-6 py-6 px-4 font-semibold z-10 bg-primary-blue'
						variants={menuVariants}
						initial='closed'
						animate={menuOpen ? 'open' : 'closed'}
						transition={{ duration: 0.5 }}
					>
						<li>
							<Link
								href={'#howItWorks'}
								onClick={e => handleClick(e, 'howItWorks')}
								className='transition-colors hover:text-accent-blue'
							>
								Jak działamy
							</Link>
						</li>
						<li>
							<Link
								href={'#services'}
								className='transition-colors hover:text-accent-blue'
								onClick={e => handleClick(e, 'services')}
							>
								Usługi
							</Link>
						</li>
						<li>
							<Link
								href={'#contacts'}
								className='transition-colors hover:text-accent-blue'
								onClick={e => handleClick(e, 'contacts')}
							>
								Kontakt
							</Link>
						</li>
					</motion.ul>
				)}

				<div className='flex items-center gap-3'>
					<Button
						className='hidden 3xl:block'
						onClick={e => handleClick(e, 'reservation')}
					>
						Zarezerwuj
					</Button>

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

					{/* Бургер-меню */}

					<button
						type='button'
						className='2xl:hidden z-50'
						onClick={() => setMenuOpen(!menuOpen)}
						suppressHydrationWarning
						aria-label='Nawigacja po stronie'
					>
						<span id='nav-icon4' className={`${menuOpen ? 'open' : ''}`}>
							<span></span>
							<span></span>
							<span></span>
						</span>
					</button>
				</div>

				<style jsx>{`
					#nav-icon4 {
						width: 32px;
						height: 25px;
						position: relative;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						cursor: pointer;
					}
					#nav-icon4 span {
						display: block;
						width: 100%;
						height: 3px;
						background: #fff;
						transition: all 0.3s ease-in-out;
					}

					#nav-icon4.open span:nth-child(1) {
						transform: rotate(45deg) translate(10px, 10px);
					}
					#nav-icon4.open span:nth-child(2) {
						opacity: 0;
					}
					#nav-icon4.open span:nth-child(3) {
						transform: rotate(-45deg) translate(5px, -5px);
					}
				`}</style>
			</nav>
		</header>
	)
})

export default Header
