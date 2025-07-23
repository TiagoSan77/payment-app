import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Request, Response } from 'express';

class PixCreate {
  private client: MercadoPagoConfig;
  private payment: Payment;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });
    this.payment = new Payment(this.client);
  }

  public criar = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body) {
        res.status(400).json({ error: 'Request body is missing' });
        return;
      }

      const { transaction_amount, description, payment_method_id, payer, notification_url } = req.body;

      if (
        transaction_amount === undefined ||
        description === undefined ||
        payment_method_id === undefined ||
        !payer?.email ||
        notification_url === undefined
      ) {
        res.status(400).json({ error: 'Missing required fields in request body' });
        return;
      }

      const request = await this.payment.create({
        body: {
          transaction_amount,
          description,
          payment_method_id,
          payer: {
            email: payer.email
          },
          notification_url
        }
      });

      res.json(request);
    } catch (err: any) {
      res.status(500).json({
        error: err.message,
        details: err.response?.body || err
      });
    }
  }

  webhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = req.body;
      console.log('Evento recebido:', event);
      res.status(200).send('Webhook recebido com sucesso');
    }
    catch (err: any) {
      console.error('Erro ao processar webhook:', err);
      res.status(500).send('Erro ao processar webhook');
    }
  }
}

const cliente = new PixCreate();
export default cliente;

