// app/api/leads/route.js
import { sendEmail } from '@/lib/notify'
import { db } from '@/lib/prisma'
import { sendLeadToTelegram } from '@/lib/telegramBot'
import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

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

		// создаём лид
		const lead = await db.lead.create({
			data: {
				name: name.trim(),
				phone: phone.trim(),
				serviceId: String(serviceId),
				serviceName: serviceName || null,
				selectedIds: Array.isArray(selectedServiceIds)
					? selectedServiceIds.map(String)
					: [],
				selectedNames: Array.isArray(selectedServiceNames)
					? selectedServiceNames
					: [],
				partnerCode,
				ua,
				ip,
				status: 'new',
				monthKey: new Date().toISOString().slice(0, 7), // например: "2025-10"
			},
		})

		// уведомления
		await sendEmail({
			subject: '🆕 Nowe zgłoszenie (Szybka rezerwacja)',
			html: `
        <h2>Nowe zgłoszenie</h2>
        <p><b>Imię:</b> ${lead.name}</p>
        <p><b>Telefon:</b> ${lead.phone}</p>
        
        ${
					lead.selectedNames?.length
						? `<p><b>Wybrane usługi:</b> ${lead.selectedNames.join(', ')}</p>`
						: ''
				}
        ${lead.partnerCode ? `<p><b>Partner:</b> ${lead.partnerCode}</p>` : ''}
        <p><small>${lead.ua}</small></p>
      `,
		})

		await sendLeadToTelegram({
			id: lead.id,
			name: lead.name,
			phone: lead.phone,
			services: lead.selectedNames?.length
				? lead.selectedNames
				: [lead.serviceName],
		})
		return NextResponse.json({ ok: true, lead })
	} catch (e) {
		console.error('POST /api/leads failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
