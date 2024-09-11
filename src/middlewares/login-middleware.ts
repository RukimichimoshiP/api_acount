import { NextFunction, Request, Response } from "express";
import { RequestBodyValidator } from "../utils/validation";
import { validationFunction, IAPIResponse, jwt } from "../interfaces/interfaces";
import ValidationMiddleware from ".";
import { UnauthorizedError, UnauthorizedSessionError } from "../utils/err";
import createResponse from "../utils/response";
import { verifyToken } from "../utils/token";

export default class LoginMiddleware {
    static async validateBodyToLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        const requestBodyValidator = new RequestBodyValidator();

        const validationFunctions: Array<validationFunction> = [
            () => requestBodyValidator.validateUserEmail(req.body.email),
            () => requestBodyValidator.validateUserPassword(req.body.password)
        ];

        await ValidationMiddleware.validateRequest(req, res, next, validationFunctions);
    }

    static async authorization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sessionToken:jwt | undefined = req.cookies.session_token;

            if(!sessionToken){
                throw new UnauthorizedSessionError('Middlware layer(login)');
            }

            const tokenDecoded = verifyToken(sessionToken);
            if(!tokenDecoded){
                throw new UnauthorizedSessionError('Middleware layer(login)');
            }

            const { userID } = tokenDecoded;
            req.user = { userID };

            next();
        } catch (err: any) {
            const response:IAPIResponse<null> = createResponse(true, null, 'Internal server error');

            if(err instanceof UnauthorizedError){
                response.error = err.errorMessage;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
            console.error(err);
        }
    }
}