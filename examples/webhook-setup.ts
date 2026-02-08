import { Sicredi, createDateRange } from '@setup-automatizado/sicredi-sdk';

async function main() {
  const sicredi = new Sicredi({
    clientId: process.env.SICREDI_CLIENT_ID!,
    clientSecret: process.env.SICREDI_CLIENT_SECRET!,
    certificate: {
      cert: './certs/certificado.pem',
      key: './certs/aplicacao.key',
      ca: './certs/CadeiaCompletaSicredi.pem',
    },
    environment: 'sandbox',
  });

  const pixKey = process.env.SICREDI_PIX_KEY!;
  const webhookUrl = 'https://your-domain.com/webhook/pix';

  // --- Configure a webhook for a PIX key ---
  console.log('Configuring webhook...');
  console.log(`  PIX key: ${pixKey}`);
  console.log(`  URL: ${webhookUrl}`);

  await sicredi.webhook.configure(pixKey, webhookUrl);
  console.log('Webhook configured successfully!\n');

  // --- Get webhook configuration ---
  console.log('Getting webhook configuration...');
  const webhook = await sicredi.webhook.get(pixKey);
  console.log('Webhook details:');
  console.log(`  URL: ${webhook.webhookUrl}`);
  console.log(`  Key: ${webhook.chave}`);
  console.log(`  Created: ${webhook.criacao}\n`);

  // --- List all webhooks ---
  console.log('Listing all webhooks...');
  const dateRange = createDateRange(30);
  const list = await sicredi.webhook.list({
    inicio: dateRange.inicio,
    fim: dateRange.fim,
  });

  console.log(`Total webhooks: ${list.parametros.paginacao.quantidadeTotalDeItens}`);
  for (const wh of list.webhooks) {
    console.log(`  - Key: ${wh.chave} | URL: ${wh.webhookUrl}`);
  }

  // --- Delete webhook ---
  console.log('\nDeleting webhook...');
  await sicredi.webhook.delete(pixKey);
  console.log('Webhook deleted successfully!');
}

main().catch(console.error);
