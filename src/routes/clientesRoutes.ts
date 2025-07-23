import {Router} from "express";
import clientes from "../controllers/clientes";
import { authFirebase } from "../middlewares/AuthFirebase";
const router = Router();

router.get("/listar",clientes.listarClientes);
router.post("/",clientes.criarClientes);
router.put("/:id",clientes.atualizarCliente);
router.delete("/:id",clientes.deletarCliente);
router.get("/filtrar", clientes.filtrarCliente);
router.get('/proximos',clientes.filtro3dias);
router.get('/mapa', clientes.mapa);


export default router;