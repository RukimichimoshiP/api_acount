import { DatabaseService } from "../database/postgresConnect";
import { IUser, IVerificationCode, uuid, IVerificationType } from "../interfaces/interfaces";

const db = new DatabaseService;
export default class MailRepository{
    static async confirmEmail(codeConfirm: string): Promise<void>{
        const query = 'UPDATE users SET is_confirmed = true WHERE confirmation_code = $1'

        const { rows } = await db.query(query, [codeConfirm]);
    }

    static async resendConfirmationEmail(email: string, newConfirmationCode: string): Promise<void>{
        const query = 'UPDATE users SET confirmation_code = $1, last_confirmation_email_sent_at = CURRENT_TIMESTAMP WHERE email = $2';

        const { rows } = await db.query(query, [newConfirmationCode, email]);
    }

    static async getLastShipment(email: string): Promise<Partial<IUser>> {
        const query = 'SELECT last_confirmation_email_sent_at FROM users WHERE email = $1';

        const { rows } = await db.query(query, [email]);
        return rows[0];
    }

    static async saveCode6Digits(userID: uuid, code: string, verificationType: IVerificationType, expiresAt: Date): Promise<IVerificationCode> {
        const query = 'INSERT INTO verification_codes (user_id, code, action_type, created_at, expires_at) VALUES ($1, $2, $3, NOW(), $4) RETURNING *';

        const { rows } = await db.query(query, [userID, code, verificationType, expiresAt]);
        return rows[0];
    }

    static async verifyCode6Digits(userID: uuid, verificationType: IVerificationType): Promise<IVerificationCode> {
        const query = 'SELECT code, created_at, expires_at, used_at FROM verification_codes WHERE user_id = $1 AND action_type = $2 ORDER BY created_at DESC LIMIT 1';

        const { rows } = await db.query(query, [userID, verificationType]);
        return rows[0];
    }

    static async markAsReadCode6Digits(userID: uuid, verificationType: IVerificationType, code: string): Promise<void> {
        const query = 'UPDATE verification_codes SET used_at = NOW() WHERE user_id = $1 AND action_type = $2 AND code = $3'
        const { rows } = await db.query(query, [userID, verificationType, code]);
    }
}