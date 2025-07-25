import { Schema, model, Document } from 'mongoose';

export interface IPaymentUserMap extends Document {
  mercadoPagoId: string;
  email: string;
}

const PaymentUserMapSchema = new Schema<IPaymentUserMap>({
  mercadoPagoId: { type: String, required: true, unique: true },
  email: { type: String, required: true }
});

export default model<IPaymentUserMap>('PaymentUserMap', PaymentUserMapSchema);
