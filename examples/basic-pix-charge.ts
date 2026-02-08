import { Sicredi, generateTxId } from '@setup-automatizado/sicredi-sdk';

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

  // Create a PIX immediate charge
  const txid = generateTxId();
  console.log('Creating PIX charge with txid:', txid);

  const charge = await sicredi.cob.create(txid, {
    calendario: { expiracao: 3600 }, // 1 hour
    devedor: {
      cpf: '12345678909',
      nome: 'Fulano de Tal',
    },
    valor: { original: '100.00' },
    chave: process.env.SICREDI_PIX_KEY!,
    solicitacaoPagador: 'Pagamento de servico',
  });

  console.log('Charge created:', charge.status);
  console.log('PIX Copia e Cola:', charge.pixCopiaECola);
  console.log('Location:', charge.location);

  // Query the charge status
  const status = await sicredi.cob.get(txid);
  console.log('Charge status:', status.status);

  // List recent charges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const list = await sicredi.cob.list({
    inicio: thirtyDaysAgo.toISOString(),
    fim: now.toISOString(),
  });
  console.log('Total charges:', list.parametros.paginacao.quantidadeTotalDeItens);
}

main().catch(console.error);
