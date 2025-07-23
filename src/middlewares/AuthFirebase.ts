// middlewares/authFirebase.ts
import { auth } from '../config/firebase';
import { Request, Response, NextFunction } from 'express';

export const authFirebase = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // res.status(401).json({ message: "Token não fornecido" });
    res.redirect('/login');
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.body.user = decodedToken;
    next();
  } catch (error) {
     res.status(401).json({ message: "Token inválido ou expirado" });
  }
};
