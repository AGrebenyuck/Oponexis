'use client'

import { SettingsIcon } from '@/components/Icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export default function ReservationMenu({ options = [] }) {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					className='p-2 rounded-full hover:bg-gray-200 transition'
					title='Opcje'
				>
					<SettingsIcon />
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align='end'
					sideOffset={8}
					className='z-50 min-w-[160px] overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none data-[side=top]:animate-slideDownAndFade data-[side=bottom]:animate-slideUpAndFade'
					asChild
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.15 }}
					>
						{options.map((item, index) => (
							<DropdownMenu.Item
								key={index}
								onSelect={item.onClick}
								className={clsx(
									'cursor-pointer px-4 py-2 text-sm text-gray-800',
									'hover:bg-gray-100 transition-colors w-full text-left outline-none'
								)}
							>
								{item.label}
							</DropdownMenu.Item>
						))}

						<DropdownMenu.Arrow
							className='fill-white drop-shadow-md'
							width={12}
							height={6}
						/>
					</motion.div>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
