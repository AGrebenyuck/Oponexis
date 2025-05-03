import { getMember } from '@/actions/zadarma'
import { NextResponse } from 'next/server'

export async function GET() {
	const data = await getMember()

	const prettyJson = JSON.stringify(data, null, 2) // форматирование
	return new NextResponse(prettyJson, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	})
}
