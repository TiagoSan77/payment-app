import { Schema, model, Document } from 'mongoose';

export interface ICompra extends Document {
  userId: string;
  email: string;
  senha: string;
  idPagamento: string;
  dataPagamento: Date;
  dataVencimento: Date;
  status: 'ativo' | 'vencido';
}

const CompraSchema = new Schema<ICompra>({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  senha: { type: String, required: true },
  idPagamento: { type: String, required: true },
  dataPagamento: { type: Date, required: true },
  dataVencimento: { type: Date, required: true },
  status: { type: String, enum: ['ativo', 'vencido'], required: true }
});

export default model<ICompra>('Compra', CompraSchema);
