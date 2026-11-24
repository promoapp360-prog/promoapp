import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contattoRouter from "./contatto";
import checkoutRouter from "./checkout";
import adminRouter from "./admin";
import adminFinanceRouter from "./admin-finance";
import lavoriRouter from "./lavori";
import accontoRouter from "./acconto";
import gestionaliRouter from "./gestionali";
import recensioniRouter from "./recensioni";
import proxyRouter from "./proxy";
import visitsRouter from "./visits";
import siteControlsRouter from "./site-controls";
import { adminAuthorization } from "../middlewares/adminAuthorization";

const router: IRouter = Router();
router.use(adminAuthorization);

router.use(healthRouter);
router.use(contattoRouter);
router.use(visitsRouter);
router.use(siteControlsRouter);
router.use(checkoutRouter);
router.use(adminFinanceRouter);
router.use(adminRouter);
router.use(lavoriRouter);
router.use(accontoRouter);
router.use(gestionaliRouter);
router.use(recensioniRouter);
router.use(proxyRouter);

export default router;
