// app/order/page.jsx
import { getServices } from '@/actions/service'
import OrderPageClient from './OrderPageClient'

export default async function OrderPage(props) {
	const params = await props.searchParams
	const data = await getServices()
	const services = data?.prices || []

	return <OrderPageClient params={params} services={services} />
}
