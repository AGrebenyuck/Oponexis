'use client'

import { getFirstTouch } from '@/lib/attribution'
import { crmFetch } from '@/lib/crm'
import { trackEvent } from '@/lib/gtm'
import Modal from '@/components/ui/modal'
import Result from '@/components/ui/result'
import { LoaderCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

function getCookie(name) {
	if (typeof document === 'undefined') return ''
	return document.cookie
		.split('; ')
		.find(row => row.startsWith(`${name}=`))
		?.split('=')[1]
}

function normalizePhonePL(raw) {
	const digits = String(raw || '').replace(/\D/g, '')
	const local = digits.startsWith('0048')
		? digits.slice(4)
		: digits.startsWith('48')
			? digits.slice(2)
			: digits
	return local.length === 9 ? `+48${local}` : null
}

export function B2BCallLink({ className = '', children = 'Zadzwoń 733 889 722' }) {
	return (
		<a
			href='tel:+48733889722'
			onClick={() => trackEvent('click_to_call', { call_source: 'b2b_page' })}
			className={className}
		>
			<Phone aria-hidden className='h-5 w-5' />
			<span>{children}</span>
		</a>
	)
}

export function B2BOfferLink({ className = '', children = 'Zapytaj o ofertę' }) {
	const scrollToForm = event => {
		event.preventDefault()
		document.getElementById('b2b-contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
		window.history.replaceState(null, '', '#b2b-contact')
	}

	return (
		<a href='#b2b-contact' onClick={scrollToForm} className={className}>
			{children}
		</a>
	)
}

export default function B2BLeadForm() {
	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')
	const [fleetSize, setFleetSize] = useState('')
	const [privacyAccepted, setPrivacyAccepted] = useState(false)
	const [status, setStatus] = useState('idle')
	const [error, setError] = useState('')

	async function handleSubmit(event) {
		event.preventDefault()
		const cleanName = name.trim()
		const normalizedPhone = normalizePhonePL(phone)

		if (cleanName.length < 2) {
			setError('Podaj imię lub nazwę firmy.')
			return
		}
		if (!normalizedPhone) {
			setError('Podaj poprawny polski numer telefonu.')
			return
		}
		if (!fleetSize) {
			setError('Wybierz liczbę pojazdów.')
			return
		}
		if (!privacyAccepted) {
			setError('Zaakceptuj zgodę na kontakt.')
			return
		}

		setStatus('sending')
		setError('')

		const firstTouch = getFirstTouch() || {}
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 10000)

		try {
			const response = await crmFetch('/api/public/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
				signal: controller.signal,
				body: JSON.stringify({
					name: cleanName,
					phone: normalizedPhone,
					serviceId: 'b2b-fleet',
					serviceName: 'B2B — obsługa floty',
					selectedServiceIds: ['b2b-fleet'],
					selectedServiceNames: [
						'B2B — obsługa floty',
						`Liczba pojazdów: ${fleetSize}`,
					],
					partnerCode: getCookie('opx_ref_code') || null,
					visitorId: getCookie('opx_vid') || null,
					attribution: {
						...firstTouch,
						source: 'b2b_website',
						medium: firstTouch.medium || 'website',
						campaign: firstTouch.campaign || 'fleet_offer',
					},
					privacyAccepted: true,
					marketingSmsAccepted: false,
				}),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.ok) throw new Error(data?.error || 'Nie udało się wysłać formularza.')

			trackEvent('generate_lead', {
				lead_source: 'b2b_page',
				fleet_size: fleetSize,
			})
			setStatus('success')
			setName('')
			setPhone('')
			setFleetSize('')
			setPrivacyAccepted(false)
		} catch (submitError) {
			setStatus('error')
			setError(
				submitError?.name === 'AbortError'
					? 'Przekroczono czas oczekiwania. Spróbuj ponownie.'
					: 'Nie udało się wysłać zgłoszenia. Zadzwoń do nas lub spróbuj ponownie.'
			)
		} finally {
			clearTimeout(timeout)
		}
	}

	return (
		<>
			<form
				id='b2b-contact'
				onSubmit={handleSubmit}
				className='rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(3,15,26,0.24)] sm:p-8'
			>
			<p className='text-xs font-bold uppercase tracking-[0.18em] text-secondary-orange'>Szybki kontakt</p>
			<h2 className='mt-3 text-2xl font-bold sm:text-3xl'>Porozmawiajmy o Twojej flocie</h2>
			<p className='mt-2 text-sm leading-relaxed text-white/65 sm:text-base'>
				Krótko omówimy flotę, termin i przygotujemy indywidualną wycenę.
			</p>

			<div className='mt-6 space-y-3'>
				<label className='block'>
					<span className='sr-only'>Imię lub nazwa firmy</span>
					<input
						type='text'
						value={name}
						onChange={event => setName(event.target.value)}
						placeholder='Imię / firma'
						autoComplete='organization'
						className='h-14 w-full rounded-2xl border border-white/15 bg-[#0e263a] px-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-secondary-orange focus:ring-2 focus:ring-secondary-orange/20'
					/>
				</label>
				<label className='block'>
					<span className='sr-only'>Numer telefonu</span>
					<input
						type='tel'
						value={phone}
						onChange={event => setPhone(event.target.value)}
						placeholder='Telefon'
						autoComplete='tel'
						inputMode='tel'
						className='h-14 w-full rounded-2xl border border-white/15 bg-[#0e263a] px-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-secondary-orange focus:ring-2 focus:ring-secondary-orange/20'
					/>
				</label>
				<label className='block'>
					<span className='sr-only'>Liczba pojazdów</span>
					<select
						value={fleetSize}
						onChange={event => setFleetSize(event.target.value)}
						className='h-14 w-full appearance-none rounded-2xl border border-white/15 bg-[#0e263a] px-4 text-base text-white outline-none transition focus:border-secondary-orange focus:ring-2 focus:ring-secondary-orange/20'
					>
						<option value=''>Liczba pojazdów</option>
						<option value='3–5'>3–5 pojazdów</option>
						<option value='6–10'>6–10 pojazdów</option>
						<option value='więcej niż 10'>Więcej niż 10 pojazdów</option>
					</select>
				</label>
			</div>

			<label className='mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/60'>
				<input
					type='checkbox'
					checked={privacyAccepted}
					onChange={event => setPrivacyAccepted(event.target.checked)}
					className='mt-0.5 h-4 w-4 shrink-0 accent-secondary-orange'
				/>
				<span>
					Wyrażam zgodę na kontakt w sprawie oferty i potwierdzam zapoznanie się z{' '}
					<Link href='/privacy-policy' className='text-white underline underline-offset-2'>polityką prywatności</Link>.
				</span>
			</label>

			{error ? <p role='alert' className='mt-3 text-sm font-semibold text-[#ffb07a]'>{error}</p> : null}

				<button
					type='submit'
					disabled={status === 'sending'}
					className='mt-5 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-white px-6 text-base font-bold text-primary-blue transition hover:bg-secondary-orange hover:text-white disabled:cursor-wait disabled:opacity-70'
				>
					{status === 'sending' ? <LoaderCircle aria-hidden className='mr-2 h-5 w-5 animate-spin' /> : null}
					{status === 'sending' ? 'Wysyłanie…' : 'Zapytaj o ofertę'}
				</button>
			</form>

			<Modal
				visible={status === 'success'}
				onClose={() => {
					setStatus('idle')
				}}
				variant='confirmation'
				closeLabel='Gotowe'
			>
				<Result
					status='success'
					title='Dziękujemy!'
					subTitle='Zgłoszenie przyjęte. Wkrótce do Ciebie oddzwonimy.'
				/>
			</Modal>
		</>
	)
}
