'use client'

import { crmFetch } from '@/lib/crm'
import { useState } from 'react'

export default function UnsubscribePage() {
	const [phone, setPhone] = useState('')
	const [state, setState] = useState('idle')
	async function submit(event) {
		event.preventDefault()
		setState('sending')
		try {
			const response = await crmFetch('/api/public/marketing/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
			if (!response.ok) throw new Error('request_failed')
			setState('done')
		} catch { setState('error') }
	}
	return <main className='container-padding mx-auto max-w-md py-10'>
		<h1 className='text-2xl font-bold'>Rezygnacja z marketingowych SMS</h1>
		{state === 'done' ? <p className='mt-4'>Gotowe. Numer nie będzie wykorzystywany do kolejnych marketingowych SMS-ów.</p> : <form onSubmit={submit} className='mt-5 space-y-3'>
			<label className='block text-sm font-medium'>Numer telefonu<input required value={phone} onChange={event => setPhone(event.target.value)} className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900' placeholder='+48 000 000 000' /></label>
			<button disabled={state === 'sending'} className='rounded-lg bg-primary-blue px-4 py-2 font-semibold text-white'>{state === 'sending' ? 'Zapisywanie…' : 'Zrezygnuj z SMS-ów'}</button>
			{state === 'error' ? <p className='text-sm text-red-600'>Spróbuj ponownie lub napisz na info@oponexis.pl.</p> : null}
		</form>}
	</main>
}
