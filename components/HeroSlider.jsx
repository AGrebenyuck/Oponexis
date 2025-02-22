import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import ReviewCardHero from './ReviewCardHero'

const reviews = [
	{
		id: 1,
		image: '/avatar/1.jpg',
		rate: '5',
		name: 'Marek Kowalski',
		title: 'Wymiana opon sezonowa',
		text: 'Świetna sprawa! Mechanik przyjechał na czas, wymienił opony w ekspresowym tempie. Zero stresu, na pewno skorzystam ponownie.',
	},
	{
		id: 2,
		image: '/avatar/2.jpg',
		rate: '4',
		name: 'Piotr Nowak',
		title: 'Wymiana oleju',
		text: 'Dobra usługa, ale małe opóźnienie. Poza tym wszystko w porządku, mechanik zna się na rzeczy. Wygodne rozwiązanie dla zapracowanych.',
	},
	{
		id: 3,
		image: '/avatar/3.jpg',
		rate: '5',
		name: 'Tomasz Zieliński',
		title: 'Serwis klimatyzacji',
		text: 'Klimatyzacja działa jak nowa! Wcześniej ledwo chłodziła, teraz jest super. Szybka i profesjonalna robota, polecam!',
	},
]

const HeroSlider = () => {
	const [currentIndex, setCurrentIndex] = useState(0)
	const intervalRef = useRef(null)

	// Функция запуска таймера
	const startTimer = () => {
		intervalRef.current = setInterval(() => {
			setCurrentIndex(prevIndex => (prevIndex + 1) % reviews.length)
		}, 8000)
	}

	// Функция остановки таймера
	const stopTimer = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
	}

	// Запускаем таймер при маунте
	useEffect(() => {
		startTimer()
		return () => stopTimer() // Очищаем таймер при размонтировании
	}, [])

	const nextIndex = (currentIndex + 1) % reviews.length

	return (
		<div
			className='relative w-[430px] h-[325px]'
			onMouseEnter={stopTimer} // Остановка при наведении
			onMouseLeave={startTimer} // Запуск при уходе
		>
			<AnimatePresence mode='popLayout'>
				{/* Следующий отзыв (силуэт) */}
				<motion.div
					key={`shadow-${reviews[nextIndex].id}`}
					className='absolute -top-9 left-9 w-full scale-95 z-0'
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 0.95 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 1 }}
				>
					<ReviewCardHero review={reviews[nextIndex]} />
				</motion.div>

				{/* Текущий отзыв */}
				<motion.div
					key={reviews[currentIndex].id}
					className='w-full relative z-10'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 1 }}
				>
					<ReviewCardHero
						review={reviews[currentIndex]}
						className={'shadow-[4px_-1px_29px_0_rgba(19,44,67,.7)]'}
					/>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

export default HeroSlider
