# n8n-nodes-vipps-mobilepay

An n8n community node for the [Vipps MobilePay](https://developer.vippsmobilepay.com) ePayment API. Supports Denmark, Norway, and Finland.

## Features

**VippsMobilepay** (action node)
- Create payment
- Get payment status
- Capture payment
- Cancel payment
- Refund payment

**VippsMobilepayTrigger** (webhook trigger)
- Listen for payment events: `AUTHORIZED`, `CAPTURED`, `REFUNDED`, `CANCELLED`

## Installation

In your n8n instance:

```
Settings > Community Nodes > Install > n8n-nodes-vipps-mobilepay
```

## Credentials

You need a Vipps MobilePay merchant account. Get your credentials from the [developer portal](https://developer.vippsmobilepay.com):

- Client ID
- Client Secret
- Subscription Key (Ocp-Apim-Subscription-Key)
- Merchant Serial Number (MSN)

For testing, use the [sandbox environment](https://developer.vippsmobilepay.com/docs/knowledge-base/test-environment/).

## Development

```bash
npm install
npm run build
```

## License

MIT
