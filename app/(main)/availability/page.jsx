import { getAvailability } from '@/actions/availability'
import AvailabilityForm from './_components/availability-form'
import { defaultAvailability } from './data'

const AvailabilityPage = async () => {
	const availability = await getAvailability()

	return (
		<AvailabilityForm
			initialData={availability ? availability : defaultAvailability}
		/>
	)
}

export default AvailabilityPage
