import nodemailer from 'nodemailer'

const {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS,
	EMAIL_FROM,
	EMAIL_TO,
	TELEGRAM_BOT_TOKEN,
	TELEGRAM_CHAT_ID,
} = process.env

let transporter
if (SMTP_HOST) {
	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT || 587),
		secure: Number(SMTP_PORT) === 465,
		auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
	})
}

export async function sendEmail({ subject, html }) {
	if (!transporter || !EMAIL_FROM || !EMAIL_TO) return
	try {
		await transporter.sendMail({
			from: EMAIL_FROM,
			to: EMAIL_TO,
			subject,
			html,
		})
	} catch (e) {
		console.error('sendEmail failed:', e)
	}
}

export async function sendTelegram(text) {
	if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return
	try {
		const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: TELEGRAM_CHAT_ID,
				text,
				parse_mode: 'HTML',
				disable_web_page_preview: true,
			}),
		})
	} catch (e) {
		console.error('sendTelegram failed:', e)
	}
}
