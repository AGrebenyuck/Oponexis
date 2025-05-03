import { DateTime } from 'luxon'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { usePriceContext } from '../../components/multiStepForm/MultiStepLayout'

const ThirdStep = () => {
	const { getValues } = useFormContext()
	const info = getValues()
	const price = usePriceContext()

	useEffect(() => {
		document?.getElementById('formInfo')?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		})
	}, [])

	return (
		<div id='formInfo'>
			<h2 className='font-semibold mb-5 lg:mb-16'>Dane</h2>
			<table className='border-separate border-spacing-3 lg:border-spacing-y-10'>
				<tbody>
					<tr>
						<td>Name:</td>
						<td className='font-semibold pl-3'>{info.name}</td>
					</tr>
					<tr>
						<td>Telefon:</td>
						<td className='font-semibold pl-3'>{info.phone}</td>
					</tr>
					<tr>
						<td>Email:</td>
						<td className='font-semibold pl-3'>{info.email}</td>
					</tr>
					<tr>
						<td>Adres:</td>
						<td className='font-semibold pl-3'>{info.address}</td>
					</tr>
					<tr>
						<td>Usługa:</td>
						<td className='font-semibold pl-3'>
							{info.serviceName?.join(', ')}
						</td>
					</tr>
					<tr>
						<td>Data:</td>
						<td className='font-semibold pl-3'>{`${info.time}-${
							info.timeEnd
						}, ${DateTime.fromJSDate(new Date(info.date)).toFormat(
							'dd-MM-yyyy'
						)}`}</td>
					</tr>
					<tr>
						<td>Cena:</td>
						<td className='font-semibold pl-3'>
							{price?.isDiscountApplied || price?.discountFromOriginal
								? price?.discountedTotal.toFixed(2)
								: price?.baseTotal}
							zł
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
}

export default ThirdStep
