import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contattoRouter from "./contatto";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contattoRouter);

export default router;
