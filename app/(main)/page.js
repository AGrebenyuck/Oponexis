import AvailabilityBar from '@/components/availabilityBar'
import FAQSection from '@/components/FAQSection'
import GoogleReviewsSlider from '@/components/GoogleReviewsSlider'
import Hero from '@/components/Hero'
import HowItWorksSection from '@/components/HowItWorksSection'
import OfferGrid from '@/components/OfferGrid'
import QuickReservation from '@/components/QuickReservation'
import FloatingCallButton from '@/components/ui/floatingCallButton'
import { getServices } from '@/lib/crm'
import { getHeroReviews } from '@/lib/googleReviewsServer'

export const revalidate = 300

export default async function Home() {
	const [initialReviews, initialServices] = await Promise.all([
		getHeroReviews(),
		getServices().catch(() => null),
	])

	return (
		<>
			<Hero initialReviews={initialReviews} />
			<AvailabilityBar />
			<OfferGrid initialServices={initialServices} />
			<HowItWorksSection />
			<QuickReservation initialServices={initialServices} />
			<GoogleReviewsSlider initialData={initialReviews} />
			<FAQSection />
			<FloatingCallButton />
		</>
	)
}
