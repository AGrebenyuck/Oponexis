'use client'

import { updateAvailability } from '@/actions/availability'
import Button from '@/components/ui/button'
import Checkbox from '@/components/ui/checkBox'
import Input from '@/components/ui/input'
import message from '@/components/ui/message'
import useFetch from '@/hooks/useFetch'
import { availabilitySchema } from '@/lib/validators'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { timeSlots } from '../data'
import Select, { SelectOption } from '@/components/ui/select'

const AvailabilityForm = ({ initialData }) => {
	const {
		register,
		watch,
		control,
		setValue,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(availabilitySchema),
		defaultValues: { ...initialData },
	})

	const {
		fn: fnUpdateAvailability,
		loading,
		data,
		error,
	} = useFetch(updateAvailability)

	useEffect(() => {
		if (data === undefined) return
		if (data?.success) {
			message.success('Operacja zakończona!')
		} else {
			message.error('Błąd żądania! ' + error)
		}
	}, [data])

	const onSubmit = async data => {
		const result = await fnUpdateAvailability(data)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			{[
				'monday',
				'tuesday',
				'wednesday',
				'thursday',
				'friday',
				'saturday',
				'sunday',
			].map(day => {
				const isAvailable = watch(`${day}.isAvailable`)

				return (
					<div key={day} className='flex items-center gap-5 mb-5'>
						<Controller
							name={`${day}.isAvailable`}
							control={control}
							render={({ field }) => (
								<Checkbox
									checked={field.value}
									onChange={checked => {
										setValue(`${day}.isAvailable`, checked)
										if (!checked) {
											setValue(`${day}.startTime`, '09:00')
											setValue(`${day}.endTime`, '17:00')
										}
									}}
									label={day}
									className='capitalize'
								/>
							)}
						/>
						{isAvailable && (
							<>
								<Controller
									name={`${day}.startTime`}
									control={control}
									render={({ field }) => {
										return (
											<Select {...field}>
												{timeSlots.map(time => {
													return (
														<SelectOption key={time} value={time}>
															{time}
														</SelectOption>
													)
												})}
											</Select>
										)
									}}
								/>
								<span>To</span>
								<Controller
									name={`${day}.endTime`}
									control={control}
									render={({ field }) => {
										return (
											<Select {...field}>
												{timeSlots.map(time => {
													return (
														<SelectOption key={time} value={time}>
															{time}
														</SelectOption>
													)
												})}
											</Select>
										)
									}}
								/>
								{errors[day]?.endTime && (
									<span className='text-red-300 text-sm ml-2'>
										{errors[day].endTime.message}
									</span>
								)}
							</>
						)}
					</div>
				)
			})}
			<Controller
				name='timeGap'
				control={control}
				render={({ field }) => (
					<Input
						{...field}
						type='number'
						className='mt-5'
						onChange={e => {
							const newValue = e.target.value ? Number(e.target.value) : ''
							field.onChange(newValue) // ✅ Обновляем значение
						}}
					/>
				)}
			/>
			{errors?.timeGap && (
				<span className='text-red-900'>{errors.timeGap.message}</span>
			)}
			<Button
				onClick={handleSubmit(onSubmit)}
				className='mt-5'
				disabled={loading}
			>
				{loading ? 'Zmienić...' : 'Zmienić'}
			</Button>
		</form>
	)
}

export default AvailabilityForm
