import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  mercadoPagoId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  statusDetail: string;
  transactionAmount: number;
  description: string;
  paymentMethodId: string;
  payerEmail: string;
  externalReference?: string;
  dateCreated: Date;
  dateApproved?: Date;
  qrCode?: string;
  qrCodeBase64?: string;
  processedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  mercadoPagoId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'approved', 'rejected', 'cancelled']
  },
  statusDetail: { type: String },
  transactionAmount: { 
    type: Number, 
    required: true 
  },
  description: { type: String },
  paymentMethodId: { type: String },
  payerEmail: { type: String },
  externalReference: { type: String },
  dateCreated: { type: Date },
  dateApproved: { type: Date },
  qrCode: { type: String },
  qrCodeBase64: { type: String },
  processedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índices para melhor performance
PaymentSchema.index({ payerEmail: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ dateCreated: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
