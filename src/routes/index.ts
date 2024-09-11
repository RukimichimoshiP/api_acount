import { Router } from "express";
import cookieParser from "cookie-parser";
import userRouter from "./user-router";
import loginRouter from "./login-router";
import mailRouter from "./mail-router";
import faRouter from "./2fa-router";

const appRouter: Router = Router();
appRouter.use(cookieParser());

appRouter.use('/api/v1', loginRouter);
appRouter.use('/api/v1', userRouter);
appRouter.use('/api/v1', mailRouter);
appRouter.use('/api/v1', faRouter);


export default appRouter;