import { useEffect, useState } from 'react'

export const useCurrentCalls = () => {
	const [calls, setCalls] = useState([])

	useEffect(() => {
		const fetchCalls = async () => {
			const res = await fetch('/api/current-calls')
			const data = await res.json()
			setCalls(data)
		}

		fetchCalls()
		const interval = setInterval(fetchCalls, 5000)
		return () => clearInterval(interval)
	}, [])

	return calls
}
