import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import router from "./routes/index";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

async function connect(): Promise<any> {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI não está definida nas variáveis de ambiente");
        }
        
        await mongoose.connect(mongoUri)
        .then(() => console.log("conectado ao mongodb"))
    } catch (err: any) {
        console.log("erro ao conectar com o mongodb", err);
    }
}

app.use("/api",router);

const port = process.env.PORT || 3000;

app.listen(port, async ()=>{
    await connect(); 
    console.log(`Server is running on port http://localhost:${port}`);
});

