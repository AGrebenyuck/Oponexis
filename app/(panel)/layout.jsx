'use client'

import HeaderPanel from '@/components/headerPanel'
import FloatButton from '@/components/ui/floatButton'

import { EditOutlined } from '@ant-design/icons'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarLoader } from 'react-spinners'

const navItems = [
	{
		label: 'Grafik pracy',
		href: '/availability',
	},
	{
		label: 'Usługi',
		href: '/services',
	},
	{
		label: 'Promokody',
		href: '/promocodes',
	},
	{
		label: 'Rezerwacje',
		href: '/reservation',
	},
	{
		label: 'Wydarzenia',
		href: '/events',
	},
]

const AppLayout = ({ children }) => {
	const { isLoaded } = useUser()
	const pathname = usePathname()
	const router = useRouter()

	return (
		<>
			<HeaderPanel />
			{!isLoaded && <BarLoader width={'100%'} color='#36d7d7' />}
			<div className='flex flex-col bg-primary-blue md:flex-row'>
				<aside className='hidden md:block w-64 bg-white'>
					<nav className='mt-8'>
						<ul>
							{navItems.map(item => (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`flex items-center px-4 py-4 text-gray-700 hover:bg-gray-100 ${
											pathname === item.href ? 'bg-blue-100' : ''
										}`}
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</aside>
				<main className='flex-1 overflow-y-auto p-4 md:p-8'>
					<header className='flex justify-between items-center mb-4'>
						<h2 className='text-5xl md:text-6xl gradient-title pt-2 md:pt-0 text-center md:text-left w-full'>
							{navItems.find(item => item.href === pathname)?.label || 'Panel'}
						</h2>
					</header>
					{children}
				</main>
				<nav className='md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md overflow-x-auto z-50'>
					<FloatButton
						key={pathname}
						type='primary'
						icon={<EditOutlined />}
						tooltip='Menu'
						menu={navItems.map(item => ({
							label: item.label,
							tooltip: item.label,
							onClick: () => router.push(item.href),
							className: `${
								pathname === item.href ? '!bg-accent-blue text-white' : ''
							}`,
						}))}
					/>
				</nav>
			</div>
		</>
	)
}

export default AppLayout
