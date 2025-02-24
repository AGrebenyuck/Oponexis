'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Button from './ui/button'

const Header = () => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [isLargeScreen, setIsLargeScreen] = useState(false)

	useEffect(() => {
		const handleResize = () => {
			setIsLargeScreen(window.innerWidth >= 1440)
		}
		handleResize()
	}, [])

	const menuVariants = {
		open: { opacity: 1, x: 0 },
		closed: { opacity: 0, x: '100vw' },
	}

	return (
		<header className='relative px-4 py-3 sm:px-10 md:px-16 sm:py-6'>
			<nav className='flex items-center justify-between  '>
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
								href={'/'}
								className='transition-colors hover:text-accent-blue'
							>
								Jak działamy
							</Link>
						</li>
						<li>
							<Link
								href={'/'}
								className='transition-colors hover:text-accent-blue'
							>
								Usługi
							</Link>
						</li>
						<li>
							<Link
								href={'/'}
								className='transition-colors hover:text-accent-blue'
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
								href={'/'}
								className='title-2 transition-colors hover:text-accent-blue'
							>
								Jak działamy
							</Link>
						</li>
						<li>
							<Link
								href={'/'}
								className='title-2 transition-colors hover:text-accent-blue'
							>
								Usługi
							</Link>
						</li>
						<li>
							<Link
								href={'/'}
								className='title-2 transition-colors hover:text-accent-blue'
							>
								Kontakt
							</Link>
						</li>
					</motion.ul>
				)}

				<div className='flex items-center gap-3'>
					<Link href={'/'} className='hidden 3xl:block'>
						<Button>Zarezerwuj</Button>
					</Link>
					<SignedOut>
						<SignInButton mode='modal'>
							<Button
								type='alternative'
								className='md:px-6 md:py-1 lg:px-8 lg:py-2 3xl:px-18 3xl:py-5'
							>
								Login
							</Button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									avatarBox:
										'w-12 h-12 md:w-14 md:h-14 xl:w-18 xl:h-18 3xl:w-24 3xl:h-24',
								},
							}}
						/>
					</SignedIn>

					{/* Бургер-меню */}
					<button
						type='button'
						className='2xl:hidden z-50'
						onClick={() => setMenuOpen(!menuOpen)}
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
}

export default Header
