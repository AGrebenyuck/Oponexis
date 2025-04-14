'use client'

import { getServices } from '@/actions/service'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import {
	OilChangeIcon,
	WheelBalancingIcon,
	WheelHoldIcon,
	WinterSummerIcon,
} from './Icons'
import Button from './ui/button'

const tabs = [
	{
		key: '1',
		icon: (
			<WheelBalancingIcon
				className={`w-[45px] h-[45px] md:w-[60px] md:h-[60px]  lg:fill-secondary-orange`}
			/>
		),
		title: 'Wymiana i wyważanie kół',
		image: '/wheel-balancing.png',
		description:
			'Zapewniamy bezpieczne i profesjonalne wykonanie usługi pod Twoim domem lub miejscem pracy.',
		descriptionList: [
			'• Demontujemy stare koła.',
			'• Montujemy nowe lub przełożone opony.',
			'• Ustawiamy ciśnienie w oponach zgodnie z zaleceniami producenta.',
		],
	},
	{
		key: '2',
		icon: (
			<OilChangeIcon
				className={`w-[45px] h-[45px] md:w-[60px] md:h-[60px] lg:fill-secondary-orange`}
			/>
		),
		title: 'Wymiana oleju',
		image: '/oil-change.png',
		description:
			'Zapewniamy wymianę oleju i filtrów dla prawidłowego działania silnika.',
		descriptionList: [
			'• Opróżniamy stary olej i demontujemy zużyty filtr.',
			'• Instalujemy nowy filtr i wlewamy świeży olej odpowiedni do Twojego pojazdu.',
			'• Sprawdzamy poziom oleju i szczelność systemu.',
		],
	},

	{
		key: '4',
		icon: (
			<WinterSummerIcon
				className={`w-[45px] h-[45px] md:w-[60px] md:h-[60px] lg:fill-secondary-orange`}
			/>
		),
		title: 'Sezonowa wymiana opon',
		image: '/winter-summer.png',
		description: 'Przygotowujemy Twój samochód na każde warunki pogodowe.',
		descriptionList: [
			'• Demontujemy i montujemy opony sezonowe.',
			'• Sprawdzamy i dostosowujemy ciśnienie w oponach.',
			'• Upewniamy się, że koła są prawidłowo zamontowane i solidnie przykręcone.',
			<p className='text-secondary-orange'>
				Uprzejmie informujemy, że opony RunFlat montujemy wyłącznie w naszym
				serwisie stacjonarnym.
			</p>,
		],
	},
	{
		key: '5',
		icon: (
			<WheelHoldIcon
				className={`w-[45px] h-[45px] md:w-[60px] md:h-[60px] lg:fill-secondary-orange`}
			/>
		),
		title: 'Przechowywanie kół w naszym magazynie',
		image: '/wheel-hold.png',
		description:
			'Oszczędzamy Twoją przestrzeń i zapewniamy odpowiednie warunki przechowywania kół.',
		descriptionList: [
			'• Przyjmujemy Twoje opony do przechowania w suchym i czystym magazynie.',
			'• Sprawdzamy opony pod kątem uszkodzeń przed przechowaniem.',
			'• Zapewniamy odpowiednie warunki, aby wydłużyć żywotność opon.',
		],
	},
]

const handleClick = (e, targetId) => {
	e.preventDefault()

	document?.getElementById(targetId)?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}

const TabsService = memo(() => {
	const [activeTab, setActiveTab] = useState(0)
	const [prices, setPrices] = useState([])
	useEffect(() => {
		const fetchData = async () => {
			const data = await getServices()
			setPrices(data) // Ждём выполнения
		}
		fetchData()
	}, [])

	const handlers = useSwipeable({
		onSwipedLeft: () => {
			setActiveTab(prev => (prev < tabs.length - 1 ? prev + 1 : prev))
		},
		onSwipedRight: () => setActiveTab(prev => (prev > 0 ? prev - 1 : prev)),
		trackMouse: true,
		preventScrollOnSwipe: true,
	})

	return (
		<section className='flex flex-col gap-8 2xl:flex-row md:gap-5'>
			{/* Табы */}
			<div className='flex justify-between 2xl:flex-col lg:justify-normal gap-4'>
				{tabs.map(({ key, icon, title }, index) => (
					<button
						aria-label={title}
						key={key}
						onClick={() => setActiveTab(index)}
						className={`py-3 lg:p-3 2xl:p-6 lg:bg-white text-primary-blue lg:rounded-3xl lg:w-[18%] 2xl:w-auto after:bg-transparent after:transition-colors max-w-[435px] transition-all duration-300 ${
							activeTab === index ? 'active' : ''
						}`}
					>
						<div className='flex items-center gap-4 flex-col 2xl:flex-row 2xl:gap-8'>
							<div>{icon}</div>
							<h4 className='font-semibold text-left hidden lg:block lg:text-xl 2xl:text-2xl 3xl:text-3xl lg:text-center'>
								{title}
							</h4>
						</div>
					</button>
				))}
			</div>

			{/* Контент табов */}
			<AnimatePresence mode='wait'>
				<motion.div
					key={tabs[activeTab].key}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.4 }}
					className='flex flex-col lg:flex-row gap-5 w-full'
					{...handlers}
				>
					<div className='relative 2xl:max-w-[738px] w-full h-[172px] lg:h-auto lg:max-w-[600px] sm:h-[300px] rounded-3xl'>
						<Image
							src={tabs[activeTab].image}
							alt={`Icon for ${tabs[activeTab].title}`}
							fill={true}
							style={{ objectFit: 'cover' }}
							className='rounded-3xl'
							loading='lazy'
							quality={75}
						/>
					</div>
					<div className='flex flex-col justify-between'>
						<div>
							<h2 className='title-2 font-semibold mb-4'>
								{tabs[activeTab].title}
							</h2>
							<p className='text-sm sm:text-lg font-medium'>
								{tabs[activeTab].description}
							</p>
						</div>
						<ul className='mt-6 mb-14 flex flex-col gap-2 md:gap-5'>
							<p className='title-2 font-semibold'>Co robimy?</p>
							{tabs[activeTab].descriptionList.map((item, index) => (
								<li key={index} className='font-medium'>
									{item}
								</li>
							))}
						</ul>
						<div>
							<p className='font-semibold'>
								Cena:{' '}
								<span className='text-[#FD6D02]'>
									{
										prices?.prices?.find(
											price => price.name === tabs[activeTab].title
										)?.price
									}{' '}
									zł
								</span>
							</p>
							<Link
								href={'#reservation'}
								onClick={e => handleClick(e, 'reservation')}
							>
								<Button className='p-5 mt-4 w-full'>Złóż zgłoszenie</Button>
							</Link>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</section>
	)
})

export default TabsService
