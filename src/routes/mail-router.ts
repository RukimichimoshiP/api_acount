import { Router } from "express";
import MailController from "../controllers/mail-controller";
import MailMiddleware from "../middlewares/mail-middleware";

const mailRouter: Router = Router();

mailRouter.get('/acount/confirm-email', MailController.confirmEmail);
mailRouter.post('/acount/resend-confirmation', MailMiddleware.validateRequestBodyMail, MailController.resendConfirmationEmail);

export default mailRouter;