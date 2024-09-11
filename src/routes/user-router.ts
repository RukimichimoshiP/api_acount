import { Router } from "express";
import UserController from "../controllers/user-controller";
import UserMiddleware from "../middlewares/user-middleware";
import LoginMiddleware from "../middlewares/login-middleware";

const userRouter: Router = Router();

userRouter.post('/user', UserMiddleware.validateRequestBodyUser, UserController.createNewUser);
// userRouter.use(LoginMiddleware.authorization);
userRouter.get('/user/me', LoginMiddleware.authorization, UserController.getMyUser);
userRouter.patch('/user/me/update', LoginMiddleware.authorization, UserMiddleware.validateRequestBodyUser, UserController.updateUser);
userRouter.delete('/user/me/delete', LoginMiddleware.authorization, UserController.deleteUser);

export default userRouter;