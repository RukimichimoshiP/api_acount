import { InvalidDataError } from "../utils/err";
import { IAPIResponse, validationFunction } from "../interfaces/interfaces";
import { Request, Response, NextFunction } from "express";
import createResponse from "../utils/response";

export default class ValidationMiddleware {
    static async validateRequest (
        req: Request,
        res: Response,
        next: NextFunction,
        validationFunctions: Array<validationFunction>
    ): Promise<void> {
        try {
            const messages:Array<string> = [];

            validationFunctions.forEach(validation => {
                const validationResult = validation();

                if(!validationResult.isValid){
                    messages.push(validationResult.message as string);
                }
            });

            if(messages.length > 0){
                throw new InvalidDataError('Middleware', messages);
            }

            next();
        } catch (err: any) {
            if(err instanceof Error){
                const response:IAPIResponse<null> = createResponse(false, null, 'Internet server erro.');

                if(err instanceof InvalidDataError){
                    response.error = err.errorMessage;
                    response.messages = err.messages;
                    res.status(400).json(response);
                    return;
                }else{
                    res.status(500).json(response);
                }
                console.error(err);
            }
        }
    }
}