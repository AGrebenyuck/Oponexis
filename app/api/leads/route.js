import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { sendEmail, sendTelegram } from '@/lib/notify'
import { db } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
	try {
		const body = await req.json()
		const {
			name,
			phone,
			serviceId,
			serviceName,
			selectedServiceIds,
			selectedServiceNames,
		} = body || {}

		if (!name?.trim() || !phone?.trim() || !serviceId?.toString().trim()) {
			return NextResponse.json(
				{ ok: false, error: 'Brak wymaganych pól' },
				{ status: 400 }
			)
		}

		const ck = await cookies()
		const partnerCode = ck.get('opx_ref_code')?.value || null

		const h = await headers()
		const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
		const ua = h.get('user-agent') || ''

		// анти-флуд (30 сек)
		const recent = await db.lead.findFirst({
			where: {
				OR: [{ phone }, { ip }],
				createdAt: { gte: new Date(Date.now() - 30 * 1000) },
			},
			select: { id: true },
		})
		if (recent) return NextResponse.json({ ok: true, throttled: true })

		const lead = await db.lead.create({
			data: {
				name: name.trim(),
				phone: phone.trim(),
				serviceId: String(serviceId),
				serviceName: serviceName || null,
				partnerCode,
				selectedIds: Array.isArray(selectedServiceIds)
					? selectedServiceIds.map(String)
					: [],
				ua,
				ip,
			},
		})

		const names = Array.isArray(selectedServiceNames)
			? selectedServiceNames.filter(Boolean)
			: []
		const selectedHtml = names.length
			? `<p><b>Wybrane usługi:</b><br/>${names
					.map(n => `• ${escapeHtml(n)}`)
					.join('<br/>')}</p>`
			: lead.selectedIds?.length
			? `<p><b>Wybrane ID:</b> ${lead.selectedIds.join(', ')}</p>`
			: ''

		await sendEmail({
			subject: '🆕 Nowe zgłoszenie (Szybka rezerwacja)',
			html: `
					<h2>Nowe zgłoszenie</h2>
					<p><b>Imię:</b> ${escapeHtml(lead.name)}</p>
					<p><b>Telefon:</b> ${escapeHtml(lead.phone)}</p>
					<p><b>Usługa główna:</b> ${escapeHtml(lead.serviceName || lead.serviceId)}</p>
					${selectedHtml}
					${
						lead.partnerCode
							? `<p><b>Partner:</b> ${escapeHtml(lead.partnerCode)}</p>`
							: ''
					}
					<hr/>
					<p><small>${escapeHtml(ua)} | ${escapeHtml(ip || '')}</small></p>
				`,
		})

		const tgLines = []
		tgLines.push(`🆕 Zgłoszenie:`)
		tgLines.push(`Imię: ${lead.name}`)
		tgLines.push(`Tel: ${lead.phone}`)
		// tgLines.push(`Usługa główna: ${lead.serviceName || lead.serviceId}`)
		if (names.length) {
			tgLines.push(`Wybrane: ${names.join(', ')}`)
		} else if (lead.selectedIds?.length) {
			tgLines.push(`Wybrane ID: ${lead.selectedIds.join(', ')}`)
		}
		if (lead.partnerCode) tgLines.push(`Partner: ${lead.partnerCode}`)

		await sendTelegram(tgLines.join('\n'))

		return NextResponse.json({ ok: true, lead })
	} catch (e) {
		console.error('POST /api/leads failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}

function escapeHtml(s = '') {
	return String(s).replace(
		/[&<>"']/g,
		m =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
				m
			])
	)
}
