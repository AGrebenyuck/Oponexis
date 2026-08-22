'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useEffect, useState } from 'react'
import Button from './ui/button'

const NAV_ITEMS = [
	{ label: 'Jak działamy', target: 'howItWorks' },
	{ label: 'Usługi', target: 'services' },
	{ label: 'Kontakt', target: 'contacts' },
]

const Header = memo(() => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [isLargeScreen, setIsLargeScreen] = useState(false)
	const menuId = 'mobile-navigation'

	useEffect(() => {
		const handleResize = () => setIsLargeScreen(window.innerWidth >= 1440)
		handleResize()
		function onKeyDown(event) {
			if (event.key === 'Escape') setMenuOpen(false)
		}
		window.addEventListener('resize', handleResize)
		window.addEventListener('keydown', onKeyDown)
		return () => {
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('keydown', onKeyDown)
		}
	}, [])

	function handleClick(event, targetId) {
		event.preventDefault()
		document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<header className='sticky top-0 z-[150] border-b border-white/10 bg-primary-blue px-4 py-3 sm:px-10 sm:py-6 md:px-16'>
			<nav className='flex items-center justify-between' aria-label='Podstawowa nawigacja'>
				<Link href='/'>
					<Image src='/logo.svg' alt='Logo Oponexis' width={300} height={52} className='h-[28px] w-[160px] md:h-[40px] md:w-[230px] lg:h-[52px] lg:w-[300px]' />
				</Link>

				{isLargeScreen ? (
					<ul className='flex gap-11 font-semibold'>
						{NAV_ITEMS.map(item => (
							<li key={item.target}><Link href={`#${item.target}`} onClick={event => handleClick(event, item.target)} className='transition-colors hover:text-accent-blue'>{item.label}</Link></li>
						))}
					</ul>
				) : null}

				<div className='flex items-center gap-3'>
					<Button className='hidden 3xl:block' onClick={event => handleClick(event, 'reservation')}>Zarezerwuj</Button>
					<button
						type='button'
						className='relative z-[310] grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.07] backdrop-blur-xl transition-transform duration-200 active:scale-95 2xl:hidden'
						onClick={() => setMenuOpen(open => !open)}
						aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
						aria-expanded={menuOpen}
						aria-controls={menuId}
					>
						<span className={`opx-burger ${menuOpen ? 'opx-burger--open' : ''}`}><i /><i /><i /></span>
					</button>
				</div>
			</nav>

			<AnimatePresence>
				{!isLargeScreen && menuOpen ? (
					<>
						<button type='button' aria-label='Zamknij menu' className='fixed inset-0 z-[200] cursor-default bg-black/[0.04]' onClick={() => setMenuOpen(false)} />
						<motion.div id={menuId} className='absolute left-4 right-4 top-[calc(100%+10px)] z-[300] origin-top rounded-[24px] border border-white/15 bg-[rgba(12,36,55,0.78)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px]' initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
							<ul className='font-semibold'>
								{NAV_ITEMS.map((item, index) => (
									<motion.li key={item.target} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}>
										<Link href={`#${item.target}`} onClick={event => { handleClick(event, item.target); setMenuOpen(false) }} className='flex h-[54px] items-center justify-between rounded-2xl px-3 transition-colors hover:bg-white/[0.06]'>
											<span>{item.label}</span><span aria-hidden className='text-white/60'>→</span>
										</Link>
									</motion.li>
								))}
							</ul>
							<motion.div className='mt-2 border-t border-white/15 pt-3' initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.2 }}>
								<Link href='#reservation' onClick={event => { handleClick(event, 'reservation'); setMenuOpen(false) }} className='flex h-[54px] items-center justify-center rounded-2xl bg-white font-semibold text-primary-blue'>Szybka rezerwacja</Link>
							</motion.div>
						</motion.div>
					</>
				) : null}
			</AnimatePresence>

			<style jsx>{`
				.opx-burger { width: 22px; height: 17px; position: relative; display: flex; flex-direction: column; justify-content: space-between; }
				.opx-burger i { display: block; width: 100%; height: 2px; border-radius: 2px; background: #fff; transition: transform 260ms ease-out, opacity 180ms ease-out, width 180ms ease-out; }
				.opx-burger i:nth-child(2) { width: 72%; align-self: center; }
				.opx-burger--open i:nth-child(1) { transform: translateY(7.5px) rotate(45deg); }
				.opx-burger--open i:nth-child(2) { width: 0; opacity: 0; }
				.opx-burger--open i:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); }
			`}</style>
		</header>
	)
})

export default Header
