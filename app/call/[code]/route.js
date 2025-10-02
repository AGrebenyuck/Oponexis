// app/call/[code]/route.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { db } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COMPANY_TEL = process.env.NEXT_PUBLIC_COMPANY_TEL || '+48123456789'

function telHref(number) {
	const clean = String(number || '').replace(/\s+/g, '')
	return `tel:${clean}`
}

export async function GET(req, context) {
	const params = await context.params
	const code = params?.code
	if (!code) {
		return NextResponse.json(
			{ ok: false, error: 'missing_code' },
			{ status: 400 }
		)
	}

	const store = await cookies()
	let vid = store.get('opx_vid')?.value
	const hadVid = Boolean(vid)
	if (!hadVid) vid = randomUUID()

	// логируем намерение позвонить (БЕЗ ext)
	try {
		await db.callIntent.create({
			data: {
				partnerCode: code,
				visitorId: vid || null,
				ua: req.headers.get('user-agent') || '',
			},
		})
	} catch (err) {
		console.warn(
			'callIntent.create failed:',
			err?.message || String(err ?? 'unknown')
		)
	}

	const href = telHref(COMPANY_TEL)

	const html = `<!doctype html>
<html lang="pl"><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Łączenie z konsultantem…</title>
<body style="margin:0;background:#fff;color:#000;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;">
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
    <div style="width:100%;max-width:420px;text-align:center;display:grid;gap:12px;">
      <h1 style="margin:0;font-size:22px;font-weight:800;">Łączenie z konsultantem…</h1>
      <p style="margin:0;color:#666;">Jeśli wybieranie nie rozpoczęło się automatycznie, kliknij przycisk poniżej.</p>
      <a href="${href}" style="display:inline-block;width:100%;padding:12px 16px;border-radius:12px;background:#000;color:#fff;text-decoration:none;font-weight:700;">Zadzwoń teraz</a>
      <p style="margin:0;color:#888;font-size:12px;">Partner: ${code}</p>
    </div>
  </div>
  <script>setTimeout(function(){ try{ location.href=${JSON.stringify(
		href
	)} }catch(e){} }, 250);</script>
</body></html>`

	const res = new NextResponse(html, {
		status: 200,
		headers: { 'content-type': 'text/html; charset=utf-8' },
	})

	res.cookies.set('opx_ref_code', code, {
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
		sameSite: 'Lax',
	})
	if (!hadVid) {
		res.cookies.set('opx_vid', vid, {
			path: '/',
			maxAge: 60 * 60 * 24 * 180,
			sameSite: 'Lax',
		})
	}

	return res
}
