export interface Env {
	SENDGRID_API_KEY: string; // Add this to your Cloudflare environment variables
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname === '/submit') {
			try {
				const contentType = request.headers.get('Content-Type') || '';
				if (!contentType.includes('application/json')) {
					return new Response('Invalid Content-Type', { status: 400 });
				}

				const body = (await request.json()) as { email: string; message: string };
				const { email, message } = body;

				// Validate form data
				if (!email || !message) {
					return new Response('Missing email or message', { status: 400 });
				}

				// Send email using SendGrid
				const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						personalizations: [{ to: [{ email }] }],
						from: { email: 'japumfrey@gmail.com' }, // Replace with your verified single sender email
						subject: 'New Submission',
						content: [{ type: 'text/plain', value: message }],
					}),
				});

				// Log SendGrid response for debugging
				const sendgridResponseText = await sendgridResponse.text();
				console.log('SendGrid Response:', sendgridResponse.status, sendgridResponseText);

				if (!sendgridResponse.ok) {
					return new Response(`Failed to send email: ${sendgridResponseText}`, { status: 500 });
				}

				return new Response('Email sent successfully', { status: 200 });
			} catch (error) {
				// Log error details for debugging
				console.error('Error sending email:', error);
				return new Response('Internal Server Error', { status: 500 });
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};
