import AvailabilityBar from '@/components/availabilityBar'
import FAQSection from '@/components/FAQSection'
import GoogleReviewsSlider from '@/components/GoogleReviewsSlider'
import Hero from '@/components/Hero'
import HowItWorksSection from '@/components/HowItWorksSection'
import OffersGrid from '@/components/OfferGrid'
import QuickReservation from '@/components/QuickReservation'
import TestimonialsSection from '@/components/TestimonialsSection'
import FloatingCallButton from '@/components/ui/floatingCallButton'
import { getHeroReviews } from '@/lib/googleReviewsServer'

export default async function Home() {
	const initialReviews = await getHeroReviews()

	return (
		<>
			<Hero initialReviews={initialReviews} />
			<AvailabilityBar />
			<OffersGrid />
			{/* <OffersSection /> */}
			<HowItWorksSection />
			<QuickReservation />
			{/* <ServiceSection /> */}
			{/* <ReservationSection /> */}
			{/* <TestimonialsSection /> */}
			<GoogleReviewsSlider />
			<FAQSection />
			<FloatingCallButton />
		</>
	)
}
