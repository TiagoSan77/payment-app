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

      // Salva o mapeamento do pagamento com o e-mail real
      try {
        const PaymentUserMap = (await import('../models/PaymentUserMap')).default;
        // O ID do pagamento pode estar em request.id ou request.body.id dependendo da resposta do SDK
        const mercadoPagoId = request.id?.toString() || (request as any).body?.id?.toString();
        if (mercadoPagoId) {
          await PaymentUserMap.create({
            mercadoPagoId,
            email: payer.email
          });
        } else {
          console.error('ID do pagamento não encontrado para mapear PaymentUserMap');
        }
      } catch (err) {
        console.error('Erro ao salvar PaymentUserMap:', err);
      }

      res.json(request);
    } catch (err: any) {
      res.status(500).json({
        error: err.message,
        details: err.response?.body || err
      });
    }
  }

  // Forçar sincronização de um pagamento específico
  public sincronizarPagamento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      console.log(`🔄 Forçando sincronização do pagamento: ${id}`);
      
      // Buscar dados atualizados no MercadoPago
      const mpPayment = await this.payment.get({ id: parseInt(id) });
      
      console.log(`📊 Status atual: ${mpPayment.status}`);
      
      // Forçar salvamento no banco local
      await this.savePaymentToDB(mpPayment);
      
      // Buscar do banco local para confirmar
      const localPayment = await PaymentModel.findOne({ mercadoPagoId: id });
      
      res.json({
        message: '✅ Pagamento sincronizado com sucesso!',
        local: localPayment,
        mercadoPago: {
          id: mpPayment.id,
          status: mpPayment.status,
          status_detail: mpPayment.status_detail,
          transaction_amount: mpPayment.transaction_amount,
          date_approved: mpPayment.date_approved
        },
        synchronized: localPayment?.status === mpPayment.status
      });
    } catch (err: any) {
      console.error('❌ Erro ao sincronizar:', err);
      res.status(500).json({
        error: 'Erro ao sincronizar pagamento',
        details: err.message
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

      // Buscar e-mail real do usuário pelo ID do pagamento
      const PaymentUserMap = (await import('../models/PaymentUserMap')).default;
      const paymentMap = await PaymentUserMap.findOne({ mercadoPagoId: payment.id.toString() });
      const emailReal = paymentMap?.email;

      if (!emailReal) {
        console.warn('E-mail real não encontrado para o pagamento:', payment.id);
        return;
      }

      // Buscar usuário pelo e-mail real no MongoDB
      const { User } = await import('../models/UserScheme');
      const Compra = (await import('../models/Compra')).default;
      const user = await User.findOne({ email: emailReal });

      if (!user) {
        console.warn('Usuário não encontrado para criar compra:', emailReal);
        return;
      }

      // Calcular datas
      const dataPagamento = payment.date_approved ? new Date(payment.date_approved) : new Date();
      const dataVencimento = new Date(dataPagamento);
      dataVencimento.setDate(dataVencimento.getDate() + 30);

      // Criar registro de compra
      const compra = new Compra({
        userId: user._id,
        email: user.email,
        senha: user.password, // cuidado: senha em texto puro, ideal seria não salvar!
        idPagamento: payment.id.toString(),
        dataPagamento,
        dataVencimento,
        status: 'ativo'
      });
      await compra.save();
      console.log('📝 Compra criada com sucesso para usuário:', user.email);

      // Outras ações de negócio podem ser adicionadas aqui
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
