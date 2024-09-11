import express from "express";
import cors from 'cors';
import appRouter from './routes';
import * as dotenv from 'dotenv';
import { InitializateServer } from "./utils/InitizeServer";

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

console.clear();

server.use(cors());
server.use(express.json());
server.use(appRouter);

const app = server.listen(PORT, async () => {
    InitializateServer(app);
});