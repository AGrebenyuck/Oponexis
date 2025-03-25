import { getMember } from '@/actions/zadarma'
import MultiStepLayout from './multiStepForm/MultiStepLayout'

const ReservationSection = () => {
	return (
		<div id='reservation' className='container-padding'>
			<h2 className='title mb-10 lg:mb-32'>Rezerwacja usługi</h2>
			<MultiStepLayout />
			{/* <button onClick={getMember()}>check</button> */}
		</div>
	)
}

export default ReservationSection
