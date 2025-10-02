import HeaderPanel from '@/components/headerPanel'
import PartnerStats from './PartnerStats'

export default async function PartnerPublicPage({ params }) {
	const { code } = await params
	return (
		<>
			<HeaderPanel />
			<PartnerStats code={code} />
		</>
	)
}
