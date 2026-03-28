import {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { getAccessToken, vippsApiRequest } from '../shared/GenericFunctions';

export class VippsMobilepayTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vipps MobilePay Trigger',
		name: 'vippsMobilepayTrigger',
		icon: 'file:vippsmobilepay.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when a Vipps MobilePay payment event occurs',
		defaults: { name: 'Vipps MobilePay Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'vippsMobilepayApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Payment Authorized',
						value: 'epayments.payment.authorized.v1',
						description: 'Fires when a customer authorizes a payment',
					},
					{
						name: 'Payment Captured',
						value: 'epayments.payment.captured.v1',
						description: 'Fires when a payment is captured',
					},
					{
						name: 'Payment Refunded',
						value: 'epayments.payment.refunded.v1',
						description: 'Fires when a payment is refunded',
					},
					{
						name: 'Payment Cancelled',
						value: 'epayments.payment.cancelled.v1',
						description: 'Fires when a payment is cancelled',
					},
					{
						name: 'Payment Created',
						value: 'epayments.payment.created.v1',
						description: 'Fires when a new payment is created',
					},
				],
				default: 'epayments.payment.authorized.v1',
				required: true,
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return false;

				const credentials = await this.getCredentials('vippsMobilepayApi');
				const baseUrl =
					credentials.environment === 'production'
						? 'https://api.vipps.no'
						: 'https://apitest.vipps.no';

				try {
					const token = await getAccessToken.call(this, credentials, baseUrl);
					const response = await vippsApiRequest.call(
						this,
						'GET',
						`${baseUrl}/webhooks/v1/webhooks/${webhookData.webhookId}`,
						token,
						credentials,
					) as { id?: string };
					return !!response.id;
				} catch {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('vippsMobilepayApi');
				const baseUrl =
					credentials.environment === 'production'
						? 'https://api.vipps.no'
						: 'https://apitest.vipps.no';

				const token = await getAccessToken.call(this, credentials, baseUrl);
				const response = await vippsApiRequest.call(
					this,
					'POST',
					`${baseUrl}/webhooks/v1/webhooks`,
					token,
					credentials,
					{ url: webhookUrl, events: [event] },
				) as { id?: string };

				if (!response.id) return false;

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return true;

				const credentials = await this.getCredentials('vippsMobilepayApi');
				const baseUrl =
					credentials.environment === 'production'
						? 'https://api.vipps.no'
						: 'https://apitest.vipps.no';

				try {
					const token = await getAccessToken.call(this, credentials, baseUrl);
					await vippsApiRequest.call(
						this,
						'DELETE',
						`${baseUrl}/webhooks/v1/webhooks/${webhookData.webhookId}`,
						token,
						credentials,
					);
					delete webhookData.webhookId;
					return true;
				} catch {
					return false;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData();
		return {
			workflowData: [
				this.helpers.returnJsonArray({ ...body, _headers: headers }),
			],
		};
	}
}
