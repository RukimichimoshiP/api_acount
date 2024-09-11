import { DatabaseService } from "../database/postgresConnect";
import { IUser, email, uuid } from "../interfaces/interfaces";

const db = new DatabaseService;
export default class UserRepository{
    static async insertNewUser(userInfos: Partial<IUser>): Promise<IUser | void> {
        const query = 'INSERT INTO users (name, email, password, confirmation_code) VALUES ($1, $2, $3, $4) RETURNING *';
        const { rows } = await db.query(query, [...Object.values(userInfos)]);

        return rows[0];
    }

    static async updateUser(userInfos: Partial<IUser>): Promise<IUser>{
        const users: Partial<IUser> = {name: userInfos.name, email: userInfos.email, password: userInfos.password, id: userInfos.id};

        const query = 'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING *';
        const { rows } = await db.query(query, [...Object.values(users)]);

        return rows[0];
    }

    static async deleteUser(userID: uuid): Promise<IUser> {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [userID]);

        return rows[0];
    }

    static async updateTwoFactorEnabledUser(twoFactorEnable: boolean, userID: uuid): Promise<void> {
        const query = 'UPDATE users SET two_factor_enabled = $1 WHERE id = $2';
        const { rows } = await db.query(query, [twoFactorEnable, userID]);
    }

    static async findUserByEmail(email: email): Promise<IUser | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const { rows } = await db.query(query, [email]);
        
        return rows[0];
    }

    static async findUserByID(userID: uuid): Promise<IUser | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const { rows } = await db.query(query, [userID]);

        return rows[0] as IUser;
    }

    static async findUserByCodeConfirmation(codeConfirmation: string): Promise<IUser> {
        const query = 'SELECT * FROM users WHERE confirmation_code = $1';
        const { rows } = await db.query(query, [codeConfirmation]);

        return rows[0];
    }
}