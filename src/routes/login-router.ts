import { Router } from "express";
import LoginMiddleware from "../middlewares/login-middleware";
import LoginController from "../controllers/login-controller";

const loginRouter: Router = Router();

loginRouter.post('/login', LoginMiddleware.validateBodyToLogin, LoginController.handleLoginRequest);
loginRouter.delete('/logout', LoginMiddleware.authorization, LoginController.logout);

export default loginRouter;