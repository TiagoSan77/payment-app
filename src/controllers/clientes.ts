import { Request, Response } from "express";
import cliente from "../models/clientes";

class Clientes {
    async criarClientes(req: Request, res: Response): Promise<void> {
        try {
            const { nome, numero, dataVenc, mensagem, dataEnvio, servidor } = req.body;
            const novoCliente = new cliente({ nome, numero, dataVenc, mensagem, dataEnvio, servidor });
            const save = await novoCliente.save();
            res.status(201).json(save);
        }
        catch (err) {
            console.error("Erro ao criar cliente:", err);
            res.status(500).json({ error: "Erro ao criar cliente" });
        }
    }
    async listarClientes(req: Request, res: Response): Promise<void> {
        try {
            const clientes = await cliente.find();
            res.json(clientes);
        } catch (error) {
            res.status(500).json({ error: "Erro ao listar clientes" });
        }
    }


    async atualizarCliente(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { nome, numero, dataVenc, mensagem, dataEnvio, servidor } = req.body;
            const clienteAtualizado = await cliente.findByIdAndUpdate(
                id,
                { nome, numero, dataVenc, mensagem, dataEnvio, servidor },
                { new: true }
            );
            if (!clienteAtualizado) {
                res.status(404).json({ error: "Cliente não encontrado" });
                return;
            }
            res.json(clienteAtualizado);
        } catch (error) {
            res.status(500).json({ error: "Erro ao atualizar cliente" });
        }
    }

    async deletarCliente(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const clienteDeletado = await cliente.findByIdAndDelete(id);
            if (!clienteDeletado) {
                res.status(404).json({ error: "Cliente não encontrado" });
                return;
            }
            res.json({ message: "Cliente deletado com sucesso" });
        } catch (error) {
            res.status(500).json({ error: "Erro ao deletar cliente" });
        }
    }

    async filtrarCliente(req: Request, res: Response): Promise<void> {
        try {
            const dataString = req.query.dataVenc as string;
            const dataVenc = new Date(dataString);
            if (isNaN(dataVenc.getTime())) {
                res.status(400).json({ error: "Data inválida" });
            }
            const startOfDay = new Date(dataVenc);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(dataVenc);
            endOfDay.setUTCHours(23, 59, 59, 999);
            const clientesFiltrados = await cliente.find({
                dataVenc: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
            res.json(clientesFiltrados);
        } catch (error) {
            console.error("Erro detalhado:", error);
            res.status(500).json({ error: "Erro ao filtrar clientes" });
        }
    }

    async filtro3dias(_req: Request, res: Response): Promise<void> {
        try {
            const hoje = new Date();
            const inicioUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));

            const fimUTC = new Date(inicioUTC);
            fimUTC.setUTCDate(fimUTC.getUTCDate() + 3);
            fimUTC.setUTCHours(23, 59, 59, 999);

            console.log("Início UTC:", inicioUTC.toISOString());
            console.log("Fim UTC:", fimUTC.toISOString());

            const clientesProximos = await cliente.find({
                dataVenc: {
                    $gte: inicioUTC,
                    $lte: fimUTC
                }
            });

            res.json(clientesProximos);
        } catch (error) {
            console.error("Erro ao filtrar clientes próximos:", error);
            res.status(500).json({ error: "Erro ao filtrar clientes próximos" });
        }
    }
    async mapa(_req: Request, res: Response): Promise<void> {
        try {
            const vencimentos = await cliente.find(
                { dataVenc: { $exists: true } },
                { dataVenc: 1, nome: 1, _id: 0 }
            );

            const diasDaSemana = [
                "domingo",
                "segunda-feira",
                "terça-feira",
                "quarta-feira",
                "quinta-feira",
                "sexta-feira",
                "sábado"
            ];
            const formatador = new Intl.DateTimeFormat("pt-BR", {
                timeZone: "UTC",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });

            const vencimentosComDia = vencimentos.map(v => {
                const data = new Date(v.dataVenc);
                const diaSemana = diasDaSemana[data.getUTCDay()];
                const dataFormatada = formatador.format(data);
                return {
                    nome: v.nome,
                    dataVenc: v.dataVenc,
                    dataFormatada,
                    diaSemana
                };
            });


            res.json(vencimentosComDia);
        } catch (err: any) {
            console.error("Erro ao buscar vencimentos:", err);
            res.status(500).json({ error: "Erro ao buscar vencimentos" });
        }
    }

}
const clientes = new Clientes();
export default clientes;