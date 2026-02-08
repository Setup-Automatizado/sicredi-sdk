// Example: Handling Sicredi PIX webhook callbacks with Express
//
// Install express: bun add express @types/express
//
// Sicredi will send POST requests to your webhook URL whenever
// a PIX payment is received for the configured key.

import { parseWebhookPayload } from '@setup-automatizado/sicredi-sdk';
import express from 'express';

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// PIX webhook handler
app.post('/webhook/pix', (req, res) => {
  const result = parseWebhookPayload(req.body);

  if (!result.valid) {
    console.error('Invalid webhook payload:', result.error);
    return res.status(400).json({ error: result.error });
  }

  for (const pix of result.payload!.pix) {
    console.log('Payment received!');
    console.log(`  endToEndId: ${pix.endToEndId}`);
    console.log(`  txid: ${pix.txid}`);
    console.log(`  value: R$ ${pix.valor}`);
    console.log(`  key: ${pix.chave}`);
    console.log(`  timestamp: ${pix.horario}`);

    if (pix.infoPagador) {
      console.log(`  payer info: ${pix.infoPagador}`);
    }

    // Check for refunds (devolucoes)
    if (pix.devolucoes && pix.devolucoes.length > 0) {
      for (const dev of pix.devolucoes) {
        console.log(`  Refund: ${dev.id} - R$ ${dev.valor} (${dev.status})`);
      }
    }

    // Process the payment in your application:
    // - Update order status
    // - Send confirmation email
    // - Trigger fulfillment
    // await processPayment(pix);
  }

  // Always respond with 200 to acknowledge receipt.
  // Sicredi will retry the webhook if it doesn't receive a 200.
  res.status(200).send();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/webhook/pix`);
});
