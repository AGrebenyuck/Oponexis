'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, useState } from 'react'
import HeroSlider from './HeroSlider'
import Button from './ui/button'

const handleClick = (e, targetId) => {
	e.preventDefault()

	document?.getElementById(targetId)?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}
const Click = (e, targetId) => {
	e.preventDefault()

	fetch(
		'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/WDB2030611A052311?format=json'
	)
		.then(response => response.json())
		.then(data => {
			const results = data.Results
			const carInfo = results.reduce((acc, item) => {
				// Ищем ключи, которые нам важны
				if (item.Variable === 'Make') acc.make = item.Value
				if (item.Variable === 'Model Year') acc.year = item.Value
				if (item.Variable === 'Vehicle Type') acc.type = item.Value
				return acc
			}, {})

			console.log('Марка:', carInfo.make)
			console.log('Год выпуска:', carInfo.year)
			console.log('Тип автомобиля:', carInfo.type)
		})
		.catch(error => console.log('Ошибка при запросе данных:', error))
}

const Hero = memo(() => {
	const [isMobile, setIsMobile] = useState(true)

	return (
		<section
			aria-labelledby='hero-section'
			className='relative max-h-[768px] h-full w-full'
		>
			<h1 id='hero-section' className='sr-only'>
				Hero Section - Zadbaj o swoje auto bez wychodzenia z domu
			</h1>
			<picture className='absolute inset-0 z-0'>
				<source media='(max-width: 768px)' srcSet='/bg-mobile.jpg' />
				<source media='(min-width: 769px)' srcSet='/background-header.jpg' />
				<Image
					src={'/bg-mobile.jpg'}
					alt='Mobilny serwis opon - Zadbaj o swoje auto'
					fill
					style={{
						objectFit: 'cover',
						objectPosition: 'center',
					}}
					quality={80}
					priority={true}
				/>
			</picture>
			<div className='px-4 pt-16 pb-10 sm:px-10 md:px-16 lg:py-28 2xl:py-48 md:pb-10 z-10 flex justify-between'>
				<div className='relative max-w-[910px]'>
					<h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 md:mb-11'>
						Zadbaj o swoje auto bez wychodzenia z domu !
					</h1>
					<p className='mb-10 sm:mb-11'>
						Nie musisz czekać na wolny termin w tradycyjnym warsztacie ani stać
						w korkach – Nasz mobilny serwis przyjedzie do ciebie .
					</p>
					<div className='flex flex-col gap-2 sm:flex-row sm:gap-5'>
						<Link
							href={'#services'}
							onClick={e => handleClick(e, 'reservation')}
						>
							<Button className='w-full'>Rezerwacja</Button>
						</Link>
						<Link href='tel:+48776888488'>
							<Button type='alternative' className='w-full'>
								Zadzwoń
							</Button>
						</Link>
						<Button type='alternative' className='w-full' onClick={Click}>
							check
						</Button>
					</div>
				</div>
				{!isMobile && <HeroSlider />}
			</div>
		</section>
	)
})

export default Hero
