import {
	generateAvailableSlots,
	getAvailableDaysForCalendar,
} from '@/actions/availability'
import useFetch from '@/hooks/useFetch'
import { format } from 'date-fns'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { pl } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { useFormContext } from 'react-hook-form'
import { CalendarArrowLeft, CalendarArrowRight } from '../Icons'
import Button from '../ui/button'

const SecondStep = () => {
	const { setValue, getValues } = useFormContext()

	const [availableDays, setAvailableDays] = useState([])
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState([])
	const serviceDuration = getValues('duration')

	// Загружаем доступные дни
	useEffect(() => {
		async function fetchAvailableDays() {
			const availableDates = await getAvailableDaysForCalendar(new Date())
			setAvailableDays(availableDates)
		}
		fetchAvailableDays()
	}, [])

	const {
		data: availableSlots,
		loading,
		fn: fnGenerateAvailableSlots,
	} = useFetch(generateAvailableSlots)

	useEffect(() => {
		if (selectedDate) {
			setValue('date', format(selectedDate, 'yyyy-MM-dd'))
			setSelectedTime('')

			fnGenerateAvailableSlots(selectedDate, serviceDuration)
		}
	}, [selectedDate])

	useEffect(() => {
		if (selectedTime) {
			setValue('time', selectedTime[0])
			setValue('timeEnd', selectedTime[1])
		}
	})

	return (
		<div className='flex flex-col md:flex-row gap-9 lg:gap-12'>
			<DayPicker
				mode='single'
				weekStartsOn={1}
				locale={pl}
				modifiers={{
					available: availableDays,
				}}
				modifiersClassNames={{
					available: 'bg-white text-primary-blue rounded-full opacity-85',
				}}
				classNames={{
					root: 'relative md:flex-shrink-0',
					month_caption:
						'capitalize text-base lg:text-3xl font-semibold mb-5 lg:mb-11',
					day: 'font-semibold w-[35px] h-[35px] md:w-[55px] md:h-[55px] lg:w-[75px] lg:h-[75px]',
					month_grid: 'w-full border-separate border-spacing-1',
					months: 'w-full',
					weekdays: 'text-center',
					day_button: 'flex justify-center items-center w-full h-full',
					today: '!text-accent-blue',
					nav: `${
						getDefaultClassNames().nav
					} max-w-[67px] lg:max-w-[162px] w-full justify-between`,
					selected: '!opacity-100 !bg-accent-blue !text-white',
				}}
				components={{
					Chevron: ({ orientation, ...chevronProps }) => {
						switch (orientation) {
							case 'right':
								return <CalendarArrowRight className='w-2 h-4 lg:w-4 lg:h-7' />
							case 'left':
								return <CalendarArrowLeft className='w-2 h-4 lg:w-4 lg:h-7' />
						}
					},
				}}
				selected={selectedDate}
				onSelect={setSelectedDate}
			/>
			{loading ? (
				<p>Loading...</p>
			) : selectedDate && availableSlots !== undefined ? (
				<div className='mt-4'>
					<h3 className='mb-2'>
						Wolny czas na{' '}
						{DateTime.fromJSDate(selectedDate).setLocale('pl').toFormat('DDD')}:
					</h3>
					<ul className='flex flex-wrap gap-2 max-h-[540px] overflow-y-auto scrollbar'>
						{availableSlots?.length > 0 ? (
							availableSlots.map((slot, index) => (
								<li key={index}>
									<Button
										onClick={() => {
											setSelectedTime([slot.start, slot.end])
										}}
										type='alternative'
										className={` ${
											selectedTime[0] === slot.start
												? '!bg-accent-blue text-white hover:bg-accent-blue'
												: ''
										}`}
									>
										{slot.start}
									</Button>
								</li>
							))
						) : (
							<p className='text-red-500'>Brak dostępnych terminów</p>
						)}
					</ul>
				</div>
			) : null}
		</div>
	)
}

export default SecondStep
