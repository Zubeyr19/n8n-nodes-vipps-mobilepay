import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { getAccessToken, vippsApiRequest } from '../shared/GenericFunctions';

export class VippsMobilepay implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vipps MobilePay',
		name: 'vippsMobilepay',
		icon: 'file:vippsmobilepay.svg',
		group: ['finance'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the Vipps MobilePay ePayment API',
		defaults: { name: 'Vipps MobilePay' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'vippsMobilepayApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Payment',
						value: 'createPayment',
						description: 'Initiate a new payment request',
						action: 'Create a payment',
					},
					{
						name: 'Get Payment',
						value: 'getPayment',
						description: 'Retrieve details of a payment by reference',
						action: 'Get a payment',
					},
					{
						name: 'Capture Payment',
						value: 'capturePayment',
						description: 'Capture an authorized payment',
						action: 'Capture a payment',
					},
					{
						name: 'Cancel Payment',
						value: 'cancelPayment',
						description: 'Cancel a payment that has not been captured',
						action: 'Cancel a payment',
					},
					{
						name: 'Refund Payment',
						value: 'refundPayment',
						description: 'Refund a captured payment',
						action: 'Refund a payment',
					},
					{
						name: 'Get Payment Event Log',
						value: 'getEventLog',
						description: 'Get the full event history for a payment',
						action: 'Get payment event log',
					},
				],
				default: 'createPayment',
			},

			// ── Create Payment fields ──────────────────────────────────────────
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				required: true,
				description: 'Unique identifier for this payment (lowercase, max 50 chars)',
				displayOptions: {
					show: { operation: ['createPayment', 'getPayment', 'capturePayment', 'cancelPayment', 'refundPayment', 'getEventLog'] },
				},
			},
			{
				displayName: 'Amount (minor units)',
				name: 'amount',
				type: 'number',
				default: 0,
				required: true,
				description: 'Amount in minor currency units (e.g. 1000 = 10.00 DKK)',
				displayOptions: { show: { operation: ['createPayment', 'capturePayment', 'refundPayment'] } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{ name: 'DKK (Danish Krone)', value: 'DKK' },
					{ name: 'NOK (Norwegian Krone)', value: 'NOK' },
					{ name: 'EUR (Euro)', value: 'EUR' },
				],
				default: 'DKK',
				displayOptions: { show: { operation: ['createPayment'] } },
			},
			{
				displayName: 'Payment Description',
				name: 'paymentDescription',
				type: 'string',
				default: '',
				description: 'Short description shown to the customer',
				displayOptions: { show: { operation: ['createPayment'] } },
			},
			{
				displayName: 'Return URL',
				name: 'returnUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'URL to redirect the customer to after payment',
				displayOptions: { show: { operation: ['createPayment'] } },
			},
			{
				displayName: 'User Flow',
				name: 'userFlow',
				type: 'options',
				options: [
					{ name: 'Web Redirect', value: 'WEB_REDIRECT' },
					{ name: 'Native Redirect', value: 'NATIVE_REDIRECT' },
					{ name: 'Push Message', value: 'PUSH_MESSAGE' },
					{ name: 'QR', value: 'QR' },
				],
				default: 'WEB_REDIRECT',
				displayOptions: { show: { operation: ['createPayment'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('vippsMobilepayApi');
		const operation = this.getNodeParameter('operation', 0) as string;

		const baseUrl =
			credentials.environment === 'production'
				? 'https://api.vipps.no'
				: 'https://apitest.vipps.no';

		const token = await getAccessToken.call(this, credentials, baseUrl);

		for (let i = 0; i < items.length; i++) {
			try {
				const reference = this.getNodeParameter('reference', i) as string;
				let responseData: object = {};

				if (operation === 'createPayment') {
					const amount = this.getNodeParameter('amount', i) as number;
					const currency = this.getNodeParameter('currency', i) as string;
					const returnUrl = this.getNodeParameter('returnUrl', i) as string;
					const userFlow = this.getNodeParameter('userFlow', i) as string;
					const paymentDescription = this.getNodeParameter('paymentDescription', i) as string;

					responseData = await vippsApiRequest.call(
						this,
						'POST',
						`${baseUrl}/epayment/v1/payments`,
						token,
						credentials,
						{
							amount: { value: amount, currency },
							paymentMethod: { type: 'WALLET' },
							reference,
							returnUrl,
							userFlow,
							paymentDescription,
						},
					);
				} else if (operation === 'getPayment') {
					responseData = await vippsApiRequest.call(
						this,
						'GET',
						`${baseUrl}/epayment/v1/payments/${reference}`,
						token,
						credentials,
					);
				} else if (operation === 'capturePayment') {
					const amount = this.getNodeParameter('amount', i) as number;
					const currency = 'DKK';
					responseData = await vippsApiRequest.call(
						this,
						'POST',
						`${baseUrl}/epayment/v1/payments/${reference}/capture`,
						token,
						credentials,
						{ modificationAmount: { value: amount, currency } },
					);
				} else if (operation === 'cancelPayment') {
					responseData = await vippsApiRequest.call(
						this,
						'POST',
						`${baseUrl}/epayment/v1/payments/${reference}/cancel`,
						token,
						credentials,
					);
				} else if (operation === 'refundPayment') {
					const amount = this.getNodeParameter('amount', i) as number;
					const currency = 'DKK';
					responseData = await vippsApiRequest.call(
						this,
						'POST',
						`${baseUrl}/epayment/v1/payments/${reference}/refund`,
						token,
						credentials,
						{ modificationAmount: { value: amount, currency } },
					);
				} else if (operation === 'getEventLog') {
					responseData = await vippsApiRequest.call(
						this,
						'GET',
						`${baseUrl}/epayment/v1/payments/${reference}/events`,
						token,
						credentials,
					);
				}

				returnData.push({ json: responseData as Record<string, unknown> });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
