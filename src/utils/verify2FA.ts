import dotenv from 'dotenv';
import speakeasy from 'speakeasy';
dotenv.config();

export default function verifyOTP(otp: string, userKey: string): boolean{
    const key = userKey;

    const verified = speakeasy.totp.verify({
        secret: key,
        encoding: 'base32',
        token: otp
    })

    return verified;
}