import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contattoRouter from "./contatto";
import checkoutRouter from "./checkout";
import adminRouter from "./admin";
import lavoriRouter from "./lavori";
import accontoRouter from "./acconto";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contattoRouter);
router.use(checkoutRouter);
router.use(adminRouter);
router.use(lavoriRouter);
router.use(accontoRouter);

export default router;
