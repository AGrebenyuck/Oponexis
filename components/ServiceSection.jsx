import React from 'react'
import TabsService from './TabsService'

const ServiceSection = () => {
	return (
		<div id='services' className='container-padding'>
			<h2 className='title'>Nasze usługi:</h2>
			<TabsService />
		</div>
	)
}

export default ServiceSection
