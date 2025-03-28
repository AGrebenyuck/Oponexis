import MultiStepLayout from './multiStepForm/MultiStepLayout'

const ReservationSection = () => {
	return (
		<section id='reservation' className='container-padding'>
			<h2 className='title mb-10 lg:mb-32'>Rezerwacja usługi</h2>
			<MultiStepLayout />
		</section>
	)
}

export default ReservationSection
