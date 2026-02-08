import {
  Sicredi,
  createDateRange,
  formatDateOnly,
  generateTxId,
} from '@setup-automatizado/sicredi-sdk';

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

  // --- Create a Boleto Hibrido (PIX with due date) ---
  const txid = generateTxId();
  console.log('Creating Boleto Hibrido with txid:', txid);

  // Due date: 30 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const cobv = await sicredi.cobv.create(txid, {
    calendario: {
      dataDeVencimento: formatDateOnly(dueDate),
      validadeAposVencimento: 30, // valid for 30 days after due date
    },
    devedor: {
      cnpj: '12345678000195',
      nome: 'Empresa Exemplo LTDA',
    },
    valor: {
      original: '1500.00',
      multa: {
        modalidade: 2, // Percentage
        valorPerc: '2.00', // 2% penalty after due date
      },
      juros: {
        modalidade: 2, // Percentage per month
        valorPerc: '1.00', // 1% interest per month
      },
      desconto: {
        modalidade: 1, // Fixed value discount up to a date
        descontoDataFixa: [
          {
            data: formatDateOnly(new Date(dueDate.getTime() - 10 * 24 * 60 * 60 * 1000)),
            valorPerc: '50.00', // R$ 50.00 discount if paid 10 days before due date
          },
          {
            data: formatDateOnly(new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000)),
            valorPerc: '25.00', // R$ 25.00 discount if paid 5 days before due date
          },
        ],
      },
    },
    chave: process.env.SICREDI_PIX_KEY!,
    solicitacaoPagador: 'Fatura mensal - Contrato #12345',
    infoAdicionais: [
      { nome: 'Contrato', valor: '#12345' },
      { nome: 'Competencia', valor: '01/2026' },
    ],
  });

  console.log('Boleto Hibrido created:', cobv.status);
  console.log('Due date:', cobv.calendario.dataDeVencimento);
  console.log('PIX Copia e Cola:', cobv.pixCopiaECola);
  console.log('Location:', cobv.location);

  // --- Update the charge (e.g., change the value) ---
  console.log('\nUpdating charge value...');
  const updated = await sicredi.cobv.update(txid, {
    valor: {
      original: '1600.00',
      multa: {
        modalidade: 2,
        valorPerc: '2.00',
      },
      juros: {
        modalidade: 2,
        valorPerc: '1.00',
      },
    },
    solicitacaoPagador: 'Fatura mensal atualizada - Contrato #12345',
  });
  console.log('Updated value:', updated.valor.original);

  // --- Query the charge ---
  console.log('\nQuerying charge...');
  const queried = await sicredi.cobv.get(txid);
  console.log('Current status:', queried.status);
  console.log('Current value:', queried.valor.original);

  // --- List recent Boleto Hibrido charges ---
  console.log('\nListing recent charges...');
  const dateRange = createDateRange(30);
  const list = await sicredi.cobv.list({
    inicio: dateRange.inicio,
    fim: dateRange.fim,
  });
  console.log('Total charges:', list.parametros.paginacao.quantidadeTotalDeItens);

  for (const cob of list.cobs) {
    console.log(`  - ${cob.txid}: ${cob.status} (R$ ${cob.valor.original})`);
  }

  // --- Cancel the charge ---
  console.log('\nCancelling charge...');
  const cancelled = await sicredi.cobv.cancel(txid);
  console.log('Cancelled status:', cancelled.status);
}

main().catch(console.error);
