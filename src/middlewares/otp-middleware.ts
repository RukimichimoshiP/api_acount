import { NextFunction, Request, Response } from "express";
import { RequestBodyValidator } from "../utils/validation";
import { validationFunction, IAPIResponse } from "../interfaces/interfaces";
import ValidationMiddleware from ".";
import { UnauthorizedError, UnauthorizedSessionError } from "../utils/err";
import createResponse from "../utils/response";
import { verifyToken } from "../utils/token";

export default class OTPMiddleware {
    static async validateBodyToVerifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>{
        const requestBodyValidator = new RequestBodyValidator();

        const validationFunctions: Array<validationFunction> = [
            () => requestBodyValidator.validateOTP(req.body.otp)
        ];

        await ValidationMiddleware.validateRequest(req, res, next, validationFunctions);
    }
}