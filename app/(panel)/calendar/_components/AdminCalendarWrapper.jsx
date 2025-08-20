// components/AdminCalendarWrapper.jsx
'use client'

import dynamic from 'next/dynamic'

const AdminCalendar = dynamic(() => import('./AdminCalendar'), {
	ssr: false,
	loading: () => <p>Ładowanie kalendarza...</p>,
})

export default function AdminCalendarWrapper() {
	return <AdminCalendar />
}
