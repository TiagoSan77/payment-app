import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Request, Response } from 'express';
import PaymentModel, { IPayment } from '../models/Payment';

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

  // Consultar pagamento por ID
  public consultarPagamento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Buscar no banco local primeiro
      const localPayment = await PaymentModel.findOne({ mercadoPagoId: id });
      
      // Buscar no MercadoPago para dados atualizados
      const mpPayment = await this.payment.get({ id: parseInt(id) });
      
      res.json({
        local: localPayment,
        mercadoPago: mpPayment,
        synchronized: localPayment?.status === mpPayment.status
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message,
        details: err.response?.body || err
      });
    }
  }

  // Listar pagamentos do usuário
  public listarPagamentos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;
      const { status } = req.query;
      
      let filter: any = {};
      
      if (email) {
        filter.payerEmail = email;
      }
      
      if (status) {
        filter.status = status;
      }
      
      const payments = await PaymentModel.find(filter)
        .sort({ dateCreated: -1 })
        .limit(50);
      
      res.json({
        total: payments.length,
        payments
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message
      });
    }
  }

  webhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = req.body;
      console.log('🔔 Webhook recebido:', JSON.stringify(event, null, 2));

      // Verificar se é um evento de pagamento
      if (event.type === 'payment') {
        const paymentId = event.data?.id;
        
        if (paymentId) {
          console.log(`💳 Processando pagamento ID: ${paymentId}`);
          
          // Buscar detalhes completos do pagamento
          const paymentDetails = await this.payment.get({ id: paymentId });
          
          console.log('📊 Detalhes do pagamento:', {
            id: paymentDetails.id,
            status: paymentDetails.status,
            status_detail: paymentDetails.status_detail,
            transaction_amount: paymentDetails.transaction_amount,
            description: paymentDetails.description,
            payer_email: paymentDetails.payer?.email,
            date_created: paymentDetails.date_created,
            date_approved: paymentDetails.date_approved
          });

          // Processar baseado no status do pagamento
          switch (paymentDetails.status) {
            case 'approved':
              await this.handleApprovedPayment(paymentDetails);
              break;
            case 'pending':
              await this.handlePendingPayment(paymentDetails);
              break;
            case 'rejected':
              await this.handleRejectedPayment(paymentDetails);
              break;
            case 'cancelled':
              await this.handleCancelledPayment(paymentDetails);
              break;
            default:
              console.log(`⚠️ Status não tratado: ${paymentDetails.status}`);
          }
        }
      }

      res.status(200).send('Webhook processado com sucesso');
    }
    catch (err: any) {
      console.error('❌ Erro ao processar webhook:', err);
      res.status(500).send('Erro ao processar webhook');
    }
  }

  // Pagamento aprovado ✅
  private handleApprovedPayment = async (payment: any): Promise<void> => {
    console.log(`✅ PAGAMENTO APROVADO! ID: ${payment.id}`);
    console.log(`💰 Valor: R$ ${payment.transaction_amount}`);
    console.log(`📧 Pagador: ${payment.payer?.email}`);
    
    try {
      // Salvar/atualizar no banco de dados
      await this.savePaymentToDB(payment);
      
      // Implementar suas regras de negócio específicas aqui:
      console.log('🎉 Iniciando processamento do pagamento aprovado...');
      
      // Exemplo de ações que você pode implementar:
      // await this.sendConfirmationEmail(payment.payer?.email, payment);
      // await this.releaseProduct(payment.external_reference);
      // await this.updateOrderStatus(payment.external_reference, 'paid');
      // await this.notifyOtherSystems(payment);
      
      console.log('✅ Pagamento processado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao processar pagamento aprovado:', error);
    }
  }

  // Pagamento pendente ⏳
  private handlePendingPayment = async (payment: any): Promise<void> => {
    console.log(`⏳ Pagamento pendente. ID: ${payment.id}`);
    
    try {
      await this.savePaymentToDB(payment);
      console.log('📋 Pagamento pendente salvo no banco');
      
      // TODO: Implementar notificação de pagamento pendente
      // await this.sendPendingNotification(payment.payer?.email, payment);
    } catch (error) {
      console.error('❌ Erro ao processar pagamento pendente:', error);
    }
  }

  // Pagamento rejeitado ❌
  private handleRejectedPayment = async (payment: any): Promise<void> => {
    console.log(`❌ Pagamento rejeitado. ID: ${payment.id}`);
    console.log(`📄 Motivo: ${payment.status_detail}`);
    
    try {
      await this.savePaymentToDB(payment);
      console.log('📋 Pagamento rejeitado salvo no banco');
      
      // TODO: Implementar notificação de rejeição
      // await this.sendRejectionNotification(payment.payer?.email, payment);
    } catch (error) {
      console.error('❌ Erro ao processar pagamento rejeitado:', error);
    }
  }

  // Pagamento cancelado 🚫
  private handleCancelledPayment = async (payment: any): Promise<void> => {
    console.log(`🚫 Pagamento cancelado. ID: ${payment.id}`);
    
    try {
      await this.savePaymentToDB(payment);
      console.log('📋 Pagamento cancelado salvo no banco');
      
      // TODO: Implementar limpeza de recursos
      // await this.releaseReservations(payment.external_reference);
      // await this.updateInventory(payment.external_reference);
    } catch (error) {
      console.error('❌ Erro ao processar pagamento cancelado:', error);
    }
  }

  // Salvar pagamento no banco de dados
  private savePaymentToDB = async (payment: any): Promise<void> => {
    try {
      const paymentData = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail || '',
        transactionAmount: payment.transaction_amount,
        description: payment.description || '',
        paymentMethodId: payment.payment_method_id || '',
        payerEmail: payment.payer?.email || '',
        externalReference: payment.external_reference,
        dateCreated: payment.date_created ? new Date(payment.date_created) : new Date(),
        dateApproved: payment.date_approved ? new Date(payment.date_approved) : undefined,
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        processedAt: new Date()
      };

      // Usar upsert para atualizar se já existir
      await PaymentModel.findOneAndUpdate(
        { mercadoPagoId: payment.id.toString() },
        paymentData,
        { upsert: true, new: true }
      );

      console.log(`💾 Pagamento ${payment.id} salvo/atualizado no banco`);
    } catch (error) {
      console.error('❌ Erro ao salvar no banco:', error);
      throw error;
    }
  }
}

const cliente = new PixCreate();
export default cliente;
