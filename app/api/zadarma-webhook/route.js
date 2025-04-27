let activeCalls = {}

export async function GET(request) {
	const { searchParams } = new URL(request.url)
	const zdEcho = searchParams.get('zd_echo')
	if (zdEcho) return new Response(zdEcho, { status: 200 })

	return new Response('Only POST is allowed', { status: 405 })
}

export async function POST(request) {
	const data = await request.formData()
	const event = data.get('event')
	const callId = data.get('pbx_call_id')

	let phone = data.get('caller_id')

	if (event === 'NOTIFY_OUT_START' && callId && phone) {
		phone = data.get('destination')
		activeCalls[callId] = {
			id: callId,
			phone,
			timestamp: Date.now(),
		}
	} else if (event === 'NOTIFY_OUT_END' && callId) {
		delete activeCalls[callId]
	}
	if (event === 'NOTIFY_START' && callId && phone) {
		activeCalls[callId] = {
			id: callId,
			phone,
			timestamp: Date.now(),
		}
	} else if (event === 'NOTIFY_END' && callId) {
		delete activeCalls[callId]
	}

	const now = Date.now()
	for (const id in activeCalls) {
		if (now - activeCalls[id].timestamp > 3 * 60 * 1000) {
			delete activeCalls[id]
		}
	}

	return new Response('OK', { status: 200 })
}

export function getCurrentCalls() {
	return Object.values(activeCalls)
}
