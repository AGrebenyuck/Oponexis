import { getMember } from '@/actions/zadarma'
import { getCurrentCalls } from '../zadarma-webhook/route'

export async function GET() {
	return Response.json(getCurrentCalls())
}
