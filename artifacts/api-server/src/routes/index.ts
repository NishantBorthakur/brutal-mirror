import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import privacyRouter from "./privacy";
import roastRouter from "./roast";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(roastRouter);
router.use(privacyRouter);

export default router;
