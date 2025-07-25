import { auth } from "../config/firebase";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export class AuthService {
  // Criar usuário com Firebase Admin SDK
  async register(email: string, password: string): Promise<any> {
    try {
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: false,
      });
      console.log("Usuário criado:", userRecord.uid);
      return userRecord;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  // Método para usar em rotas Express
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      // Cria usuário no Firebase
      const userRecord = await this.register(email, password);

      // Cria usuário no MongoDB
      try {
        const { User } = await import('../models/UserScheme');
        await User.create({
          name: name || '',
          email,
          password
        });
      } catch (mongoErr) {
        console.error('Erro ao criar usuário no MongoDB:', mongoErr);
        // Não retorna erro para o cliente se já existir, apenas loga
      }

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        uid: userRecord.uid,
        email: userRecord.email
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro ao criar usuário',
        details: error.message
      });
    }
  }

  // Método de login - gerar token JWT para API
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      // Buscar usuário pelo email
      const userRecord = await auth.getUserByEmail(email);
      
      if (!userRecord) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Gerar token JWT para uso direto na API
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
      const apiToken = jwt.sign(
        {
          uid: userRecord.uid,
          email: userRecord.email,
          iss: 'pix-mercadopago-app',
          aud: 'api-users'
        },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      res.status(200).json({
        message: 'Login realizado com sucesso',
        uid: userRecord.uid,
        email: userRecord.email,
        token: apiToken,
        expiresIn: '24h',
        note: 'Use este token diretamente na API com Authorization: Bearer'
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      if (error.code === 'auth/user-not-found') {
        res.status(401).json({ error: 'Usuário não encontrado' });
      } else {
        res.status(500).json({
          error: 'Erro ao fazer login',
          details: error.message
        });
      }
    }
  }

  // Obter informações do usuário
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      
      if (!uid) {
        res.status(400).json({ error: 'UID é obrigatório' });
        return;
      }

      const userRecord = await auth.getUser(uid);
      
      res.status(200).json({
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      });
    } catch (error: any) {
      console.error('Erro ao obter informações do usuário:', error);
      
      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ error: 'Usuário não encontrado' });
      } else {
        res.status(500).json({
          error: 'Erro ao obter informações do usuário',
          details: error.message
        });
      }
    }
  }

  // Verificar token JWT
  verifyToken = async (req: Request, res: Response, next: any): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
      
      // Primeiro, tenta verificar como token JWT da nossa API
      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        (req as any).user = decoded;
        next();
        return;
      } catch (jwtError) {
        // Se falhar, tenta verificar como token do Firebase
        try {
          const decodedToken = await auth.verifyIdToken(token);
          (req as any).user = decodedToken;
          next();
          return;
        } catch (firebaseError) {
          res.status(401).json({ error: 'Token inválido' });
          return;
        }
      }
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
}

// Instância exportada para uso em outras partes da aplicação
const authService = new AuthService();
export default authService;
