import { useCurrentCalls } from '@/hooks/useCurrentCalls'
import { Controller, useFormContext } from 'react-hook-form'
import Select, { SelectOption } from './ui/select'

const AdminCallSelect = () => {
	const calls = useCurrentCalls()
	const { control, setValue } = useFormContext()

	const handleAutoSelect = () => {
		if (calls.length === 1) {
			setValue('call_id', calls[0].id)
			setValue('phone', calls[0].phone)
		}
	}

	return (
		<div className='flex flex-col gap-2'>
			<Controller
				name='call_id'
				control={control}
				render={({ field }) => (
					<Select
						{...field}
						placeholder='Wybierz trwające połączenie'
						onChange={val => {
							field.onChange(val)
							const call = calls.find(c => c.id === val)
							if (call?.phone) {
								setValue('phone', call.phone)
							}
						}}
					>
						{calls.length === 0 ? (
							<SelectOption value='' disabled>
								Brak aktywnych połączeń
							</SelectOption>
						) : (
							calls.map(call => (
								<SelectOption key={call.id} value={call.id}>
									{call.phone}
								</SelectOption>
							))
						)}
					</Select>
				)}
			/>
			<Button
				type='button'
				onClick={handleAutoSelect}
				className='w-fit'
				disabled={calls.length !== 1}
			>
				Autowybór połączenia
			</Button>
		</div>
	)
}

export default AdminCallSelect
