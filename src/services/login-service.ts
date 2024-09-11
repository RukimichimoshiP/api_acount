import { ICookieOptions, ILoginResponse, ILoginTokenPayload, ITempTokenPayload, IUser, email } from "../interfaces/interfaces";
import FaRepository from "../respositories/2fa-repositories";
import UserRepository from "../respositories/user-repository";
import { UnauthorizedError, ConflictError, GoneAccessError } from "../utils/err";
import { comparePassword } from "../utils/hash-password";
import { createToken, generateTempToken } from "../utils/token";

export default class LoginService {
    static async authenticateUser(userInfos: Partial<IUser>): Promise<ILoginResponse> {
        const registeredUser:IUser | null = await UserRepository.findUserByEmail(userInfos.email as email);

        if(!registeredUser) {
            throw new UnauthorizedError('Service layer');
        }

        if(!registeredUser?.is_confirmed){
            throw new GoneAccessError('Service layer', 'Unconfirmed email');
        }

        const validPassword = await comparePassword(userInfos.password as string, registeredUser.password);

        if(!validPassword){
            throw new UnauthorizedError('Service layer');
        }

        if(registeredUser.two_factor_enabled){
            return {registeredUser, have2FA: true};
        }

        return {registeredUser, have2FA: false};
    }

    static createSessionCookie(authenticateUser: Partial<IUser>): ICookieOptions {
        const payload:ILoginTokenPayload = {
            userID: authenticateUser.id as string
        };

        const tokenOption = { expiresIn: '8h' };
        const sessionToken = createToken(payload, tokenOption);

        const cookieOptions:ICookieOptions = {
            name: 'session_token',
            val: sessionToken,
            options: {
                maxAge: 8 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'strict',
                secure: true
            }
        };

        return cookieOptions;
    }

    static createTempToken(authenticateUser: Partial<IUser>): string {
        const payload: ITempTokenPayload = {
            userID: authenticateUser.id as string,
            twoFA: true
        }

        const tokenOption = { expiresIn: '5m' };
        const tempToken = generateTempToken(payload, tokenOption);

        return tempToken;
    }
}