import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import debounce from 'lodash.debounce'
import { useEffect, useRef, useState } from 'react'
import {
	MapContainer,
	Marker,
	Polygon,
	TileLayer,
	useMap,
	useMapEvents,
} from 'react-leaflet'
import Input from './input'

const allowedArea = [
	[50.6435, 17.8788],
	[50.6391, 17.963],
	[50.6625, 18.0052],
	[50.6903, 18.0058],
	[50.7112, 17.9818],
	[50.7135, 17.9278],
	[50.6927, 17.8826],
	[50.6606, 17.8579],
	[50.6435, 17.8788],
]

const getPolygonCenter = polygon => {
	const lats = polygon.map(point => point[0])
	const lngs = polygon.map(point => point[1])
	const lat = (Math.min(...lats) + Math.max(...lats)) / 2
	const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2
	return [lat, lng]
}

const formatAddress = address => {
	const { road, house_number, postcode, city, town, village, suburb } = address
	const cityName = city || town || village || ''
	return [road, house_number, suburb, cityName, postcode]
		.filter(Boolean)
		.join(', ')
}

const AddressInput = () => {
	const [address, setAddress] = useState('')
	const [suggestions, setSuggestions] = useState([])
	const [selectedLocation, setSelectedLocation] = useState(null)
	const [isOutOfBounds, setIsOutOfBounds] = useState(false)
	const [showMap, setShowMap] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const isInsideAllowedArea = (lat, lon) => {
		const x = lat,
			y = lon
		let inside = false
		for (
			let i = 0, j = allowedArea.length - 1;
			i < allowedArea.length;
			j = i++
		) {
			const xi = allowedArea[i][0],
				yi = allowedArea[i][1]
			const xj = allowedArea[j][0],
				yj = allowedArea[j][1]
			const intersect =
				yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
			if (intersect) inside = !inside
		}
		return inside
	}

	const debouncedFetchSuggestions = useRef(
		debounce(async query => {
			if (!query) return
			try {
				setIsLoading(true)
				const viewbox = '17.82,50.72,18.06,50.63' // [west, north, east, south]
				const response = await axios.get(
					`https://nominatim.openstreetmap.org/search`,
					{
						params: {
							format: 'json',
							q: query,
							limit: 7,
							countrycodes: 'pl',
							bounded: 1,
							viewbox,
							addressdetails: 1,
							'accept-language': 'pl',
						},
					}
				)

				const seen = new Set()
				const filtered = response.data.filter(item => {
					const formatted = formatAddress(item.address)
					if (seen.has(formatted)) return false
					seen.add(formatted)
					return true
				})

				setSuggestions(filtered)
			} catch (error) {
				console.error('Ошибка получения подсказок:', error)
			} finally {
				setIsLoading(false)
			}
		}, 400)
	).current

	const handleSelectAddress = async addressData => {
		const formatted = formatAddress(addressData.address)
		setAddress(formatted)
		setSuggestions([])
		const { lat, lon } = addressData
		setSelectedLocation([parseFloat(lat), parseFloat(lon)])
		setIsOutOfBounds(!isInsideAllowedArea(parseFloat(lat), parseFloat(lon)))
	}

	return (
		<div className='relative w-full'>
			<div className='flex gap-2 items-center'>
				<Input
					value={address}
					onChange={e => {
						setAddress(e.target.value)
						debouncedFetchSuggestions(e.target.value)
					}}
					className='border p-2 w-full'
					placeholder='Wprowadź adres...'
				/>
				<button
					type='button'
					className='text-sm text-blue-500 whitespace-nowrap border p-3 rounded-md'
					onClick={() => setShowMap(!showMap)}
				>
					Mapa
				</button>
			</div>

			{isLoading && <div className='text-sm mt-1'>Szukam adresów...</div>}

			{suggestions.length > 0 && (
				<ul className='absolute border-white bg-primary-blue border w-full z-10'>
					{suggestions.map(item => (
						<li
							key={item.place_id}
							className='p-2 cursor-pointer hover:bg-gray-200'
							onClick={() => handleSelectAddress(item)}
						>
							{formatAddress(item.address)}
						</li>
					))}
				</ul>
			)}

			{isOutOfBounds && (
				<div className='text-red-500 mt-2'>
					Adres znajduje się poza obsługiwanym obszarem. Możesz wybrać
					lokalizację ręcznie.
				</div>
			)}

			{showMap && (
				<div className='mt-4'>
					<MapContainer
						center={getPolygonCenter(allowedArea)}
						zoom={13}
						style={{ height: '400px', width: '100%' }}
					>
						<TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
						<Polygon positions={allowedArea} color='blue' />
						{selectedLocation && <Marker position={selectedLocation} />}
						<MapClickHandler
							setSelectedLocation={setSelectedLocation}
							setIsOutOfBounds={setIsOutOfBounds}
							setAddress={setAddress}
							isInsideAllowedArea={isInsideAllowedArea}
							showMap={setShowMap}
						/>
					</MapContainer>
				</div>
			)}
		</div>
	)
}

export default AddressInput

const MapClickHandler = ({
	setSelectedLocation,
	setIsOutOfBounds,
	setAddress,
	isInsideAllowedArea,
	showMap,
}) => {
	const map = useMap()

	useMapEvents({
		click: async e => {
			const { lat, lng } = e.latlng
			setSelectedLocation([lat, lng])
			//setIsOutOfBounds(!isInsideAllowedArea(lat, lng))

			try {
				const res = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pl&addressdetails=1`
				)
				const data = await res.json()
				if (data?.address) {
					setAddress(formatAddress(data.address))
				}
				if (!isInsideAllowedArea(lat, lng)) {
					alert('Wybrana lokalizacja znajduje się poza obsługiwanym obszarem.')
					return
				}
				showMap(false)
			} catch (error) {
				console.error('Reverse geocoding error:', error)
			}
		},
	})

	useEffect(() => {
		map.invalidateSize()
	}, [map])

	return null
}
