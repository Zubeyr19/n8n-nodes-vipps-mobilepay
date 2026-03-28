import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VippsMobilepayApi implements ICredentialType {
	name = 'vippsMobilepayApi';
	displayName = 'Vipps MobilePay API';
	documentationUrl = 'https://developer.vippsmobilepay.com/docs/APIs/epayment-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			hint: 'Found in the Vipps MobilePay developer portal',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Subscription Key (Ocp-Apim-Subscription-Key)',
			name: 'subscriptionKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			hint: 'Primary or secondary key from the developer portal',
		},
		{
			displayName: 'Merchant Serial Number (MSN)',
			name: 'merchantSerialNumber',
			type: 'string',
			default: '',
			required: true,
			hint: 'Identifies which sales unit the payment belongs to',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Sandbox (Test)', value: 'sandbox' },
			],
			default: 'sandbox',
		},
	];
}
