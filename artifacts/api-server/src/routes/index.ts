import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountRouter from "./account";
import profileRouter from "./profile";
import billingRouter from "./billing";
import privacyRouter from "./privacy";
import roastRouter from "./roast";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(accountRouter);
router.use(profileRouter);
router.use(billingRouter);
router.use(roastRouter);
router.use(privacyRouter);

export default router;
