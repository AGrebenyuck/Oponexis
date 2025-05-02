'use client'
import { getAvailability } from '@/actions/availability'
import Spin from '@/components/ui/spin'
import { useEffect, useState } from 'react'
import AvailabilityForm from './_components/availability-form'
import { defaultAvailability } from './data'

const AvailabilityPage = () => {
	const [availability, setAvailability] = useState(null)

	useEffect(() => {
		getAvailability().then(data => {
			setAvailability(data || defaultAvailability)
		})
	}, [])

	if (!availability) {
		return (
			<div className='py-20 flex justify-center'>
				<Spin size='large' />
			</div>
		)
	}

	return <AvailabilityForm initialData={availability} />
}

export default AvailabilityPage
