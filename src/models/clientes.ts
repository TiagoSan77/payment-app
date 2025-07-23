import mongoose from "mongoose";

const clientesSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  numero: { type: String, required: true },
  dataVenc: { type: Date, default: Date.now },
  mensagem: { type: String },
  dataEnvio: { type: Date, default: Date.now },
  servidor: { type: String, enum: ["brpro", "unitv"] },
  horaEnvio:{Type:String}
  // statusMensagem:{type:String, enum:["pendente", "enviado", "erro"], default: "pendente"},
});

const cliente = mongoose.model("clientes", clientesSchema);
export default cliente;
