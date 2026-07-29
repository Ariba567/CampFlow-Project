import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import campgroundRouter from "./campgrounds";
import campsiteRouter from "./campsites";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/campgrounds", campgroundRouter);
router.use("/campsites", campsiteRouter);

export default router;
