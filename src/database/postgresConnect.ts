import * as sql from 'pg';
import { config } from 'dotenv';
import { amb, dbMessage } from '../utils/InitizeServer';

config();

export class DatabaseService {
    private pool: sql.Pool;
    private USER = process.env.DB_USER || '';
    private PASSWORD = process.env.DB_PASSWORD || '';
    private SERVER = process.env.DB_HOST || '';
    private DATABASE = process.env.DB_DATABASE_NAME || '';
    private PORT = process.env.DB_PORT || 5432;

    constructor() {
        this.pool = new sql.Pool({
            user: this.USER,
            password: this.PASSWORD,
            host: this.SERVER,
            database: this.DATABASE,
            port: Number(this.PORT)
        });
    }

    async query(query: string, params: any[]): Promise<any>{
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            return result;
        } catch (error) {
            console.error(`[${amb}][${dbMessage}] Error connecting to database`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    async connect(): Promise<sql.PoolClient>{
        const client = await this.pool.connect();
        return client;
    }

    async end(): Promise<void>{
        await this.pool.end();
    }
}