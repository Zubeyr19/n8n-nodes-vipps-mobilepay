import { ICredentialDataDecryptedObject, IExecuteFunctions, IHookFunctions, IWebhookFunctions } from 'n8n-workflow';

export async function getAccessToken(
	this: IExecuteFunctions | IHookFunctions | IWebhookFunctions,
	credentials: ICredentialDataDecryptedObject,
	baseUrl: string,
): Promise<string> {
	const response = await this.helpers.request({
		method: 'POST',
		url: `${baseUrl}/accesstoken/get`,
		headers: {
			'client_id': credentials.clientId as string,
			'client_secret': credentials.clientSecret as string,
			'Ocp-Apim-Subscription-Key': credentials.subscriptionKey as string,
		},
		json: true,
	});

	return response.access_token as string;
}

export async function vippsApiRequest(
	this: IExecuteFunctions | IHookFunctions | IWebhookFunctions,
	method: string,
	url: string,
	token: string,
	credentials: ICredentialDataDecryptedObject,
	body?: object,
): Promise<object> {
	const options: Record<string, unknown> = {
		method,
		url,
		headers: {
			Authorization: `Bearer ${token}`,
			'Ocp-Apim-Subscription-Key': credentials.subscriptionKey as string,
			'Merchant-Serial-Number': credentials.merchantSerialNumber as string,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	return this.helpers.request(options as Parameters<typeof this.helpers.request>[0]);
}
