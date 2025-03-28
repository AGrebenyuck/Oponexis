import { memo } from 'react'
import TabsService from './TabsService'

const ServiceSection = memo(() => {
	return (
		<section
			id='services'
			className='container-padding'
			aria-labelledby='services-section'
		>
			<h2 id='services-section' className='title'>
				Nasze usługi:
			</h2>
			<TabsService />
		</section>
	)
})

export default ServiceSection
