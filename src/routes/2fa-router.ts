import { Router } from 'express';
import FaController from '../controllers/2fa-controller';
import LoginMiddleware from '../middlewares/login-middleware';
import OTPMiddleware from '../middlewares/otp-middleware';

const faRouter: Router = Router();

faRouter.post('/two_factors/create', LoginMiddleware.authorization, FaController.create2FA);
faRouter.get('/two_factors/verify', OTPMiddleware.validateBodyToVerifyOTP, FaController.verify2FA);
faRouter.get('/two_factors/verify_create', LoginMiddleware.authorization, OTPMiddleware.validateBodyToVerifyOTP, FaController.verifyCreate2FA);
faRouter.post('/two_factors/recreate', LoginMiddleware.authorization, FaController.recreate2FA);
faRouter.get('/two_factors/verify_code', LoginMiddleware.authorization, FaController.verifyCode6Digits);

export default faRouter;