'use client'

import { UserButton } from '@clerk/nextjs'
import { ChartNoAxesGantt } from 'lucide-react'

const UserMenu = ({ role }) => {
	return (
		<UserButton
			appearance={{
				elements: {
					avatarBox:
						'w-12 h-12 md:w-14 md:h-14 xl:w-18 xl:h-18 3xl:w-24 3xl:h-24',
				},
			}}
		>
			<UserButton.MenuItems>
				{role === 'admin' && (
					<UserButton.Link
						label='Availability'
						labelIcon={<ChartNoAxesGantt size={15} />}
						href='/availability'
					/>
				)}
				<UserButton.Action label='manageAccount' />
			</UserButton.MenuItems>
		</UserButton>
	)
}

export default UserMenu
