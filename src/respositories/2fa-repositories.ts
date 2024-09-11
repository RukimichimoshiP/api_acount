import { DatabaseService } from "../database/postgresConnect";
import { ITwoFactorAuth, IUser, uuid } from "../interfaces/interfaces";

const db = new DatabaseService;
export default class FaRepository{
    static async create2FA(userID: uuid, secretKey: string): Promise<ITwoFactorAuth>{
        const client = await db.connect();
        try {
            // Iniciar a transação
            await client.query('BEGIN');

            // Criação de 2FA
            const create2FAQuery = 'INSERT INTO two_factor_auth (key) VALUES ($1) RETURNING *';
            const create2FAResult = await client.query(create2FAQuery, [secretKey]);
            const twoFactorAuth = create2FAResult.rows[0];

            // Integração com o usuário
            const integrate2FAQuery = 'UPDATE users SET two_factor_auth_id = $1 WHERE id = $2 RETURNING *'
            const integrate2FAResult = await client.query(integrate2FAQuery, [twoFactorAuth.id, userID]);

            await client.query('COMMIT');
            return twoFactorAuth;
        } catch (err: any) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async recreate2FA(userID: uuid, secretKey: string, twoFactorID: string): Promise<ITwoFactorAuth>{
        const client = await db.connect();
        try {
            // Iniciar a transação
            await client.query('BEGIN');

            // Remover 2FA antigo
            const remove2FAQuery = 'DELETE FROM two_factor_auth WHERE id = $1';
            const remove2FAResult = await client.query(remove2FAQuery, [twoFactorID]);

            // Criação de 2FA
            const create2FAQuery = 'INSERT INTO two_factor_auth (key) VALUES ($1) RETURNING *';
            const create2FAResult = await client.query(create2FAQuery, [secretKey]);
            const twoFactorAuth = create2FAResult.rows[0];

            // Integração com o usuário
            const integrate2FAQuery = 'UPDATE users SET two_factor_auth_id = $1 WHERE id = $2 RETURNING *'
            const integrate2FAResult = await client.query(integrate2FAQuery, [twoFactorAuth.id, userID]);

            await client.query('COMMIT');
            return twoFactorAuth;
        } catch (err: any) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async remove2FA(twoFactorID: uuid): Promise<void>{
        const query = 'DELETE FROM two_factor_auth WHERE id = $1';
        const { rows } = await db.query(query, [twoFactorID]);
    }

    static async validateTwoFactor(twoFactorID: uuid): Promise<void>{
        const query = 'UPDATE two_factor_auth SET validate = true WHERE id = $1';
        const { rows } = await db.query(query, [twoFactorID]);
    }

    static async findIdTwoFactorWithUserId(userID: uuid): Promise<Partial<IUser | null>>{
        const query = 'SELECT two_factor_auth_id FROM users WHERE id = $1';
        const { rows } = await db.query(query, [userID]);

        return rows[0];
    }

    static async findTwoFactorById(twoFactorID: uuid): Promise<ITwoFactorAuth>{
        const query = 'SELECT * FROM two_factor_auth WHERE id = $1';
        const { rows } = await db.query(query, [twoFactorID]);

        return rows[0];
    }
}