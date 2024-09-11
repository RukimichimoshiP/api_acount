export type uuid = string;
export type email = string;
export type typeName = 'name';
export type validationFunction = () => IValidationResponse;
export type jwt = string;

// Enums
export enum IVerificationType {
    PASSWORD_RESET = 'password_reset',
    EMAIL_CHANGE = 'email_change',
    TWO_FACTOR_AUTH = '2fa_reset'
}

// entities interfaces
export interface IUser{
    id: uuid;
    name: string;
    email: string;
    password: string;
    creation_time: string;
    edition_time: string;
    confirmation_code: string;
    confirmation_code_created_at: string;
    is_confirmed: boolean;
    last_confirmation_email_sent_at: string;
    two_factor_secret: string;
    two_factor_enabled: boolean;
    two_factor_auth_id: uuid;
}

export interface ITwoFactorAuth{
    id: uuid;
    validate: boolean;
    key: string;
    created_at: string;
    validated_at: string | null;
}

export interface ICreateTwoFactorAuth{
    id: uuid;
    validate: boolean;
    key: string;
    created_at: string;
    validated_at: string | null;
    QRUrl: string;
}

export interface ITwoFactorAuthLog{
    id: uuid;
    user_id: uuid;
    success: boolean;
    attempted_at: string;
    ip_address: string;
}

export interface IVerificationCode{
    id: uuid;
    user_id: uuid,
    code: string;
    action_type: IVerificationType;
    created_at: string;
    expires_at: string;
    used_at: string;
}

// response interfaces
export interface IValidationResponse{
    isValid: boolean;
    message: string | null;
}

export interface IAPIResponse<T>{
    success: boolean;
    data: T | null;
    error: null | string;
    messages?: Array<string> | string;
}

export interface ILoginTokenPayload {
    userID: uuid
}

export interface ITempTokenPayload {
    userID: uuid,
    twoFA: boolean
}

export interface ICookieOptions {
    name: string,
    val: jwt,
    options: {
        maxAge: number,
        httpOnly: true,
        sameSite: 'strict',
        secure: true
    }
}

export interface IResultGenerateQRCode{
    otpauhURl: string;
    secret: string
}

export interface IGenerateQR{
    secret: string;
    QRUrl: string;
}

export interface ILoginResponse{
    registeredUser: IUser;
    have2FA: boolean;
}

declare module 'express-serve-static-core'{
    interface Request {
        user?: ILoginTokenPayload;
    }
}