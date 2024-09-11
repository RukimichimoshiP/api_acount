import { Request, Response } from "express";
import LoginService from "../services/login-service";
import { IAPIResponse, ICookieOptions, IUser } from "../interfaces/interfaces";
import createResponse from "../utils/response";
import { ConflictError, GoneAccessError, UnauthorizedError } from "../utils/err";

export default class LoginController{
    static async handleLoginRequest(req: Request, res: Response): Promise<void> {
        try {
            res.clearCookie('session_token');
            const authenticateUser = await LoginService.authenticateUser(req.body);

            let result;
            if(authenticateUser.have2FA){
                result = {message: 'Two-factor authentication required.', tempToken: LoginService.createTempToken(authenticateUser.registeredUser)};

            }else{
                const sessionCookie: ICookieOptions = LoginService.createSessionCookie(authenticateUser.registeredUser);
                res.cookie(sessionCookie.name, sessionCookie.val, sessionCookie.options);
                result = 'logged in successfully';
            }

            const response = createResponse(true, result, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response:IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof UnauthorizedError){
                response.error = err.errorMessage;
                res.status(err.code).json(response);
            }else if(err instanceof ConflictError || err instanceof GoneAccessError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }

    static logout(req: Request, res: Response):void {
        try {
            res.clearCookie('session_token');
        res.status(200).json({message: 'Logout Successful'});
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');
            res.status(500).json(response);
            console.error(err);
        }
    }
}