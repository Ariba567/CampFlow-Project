import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import campgroundRouter from "./campgrounds";
import campsiteRouter from "./campsites";
import reservationRouter from "./reservations";
import activityRouter from "./activities";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/campgrounds", campgroundRouter);
router.use("/campsites", campsiteRouter);
router.use("/reservations", reservationRouter);
router.use("/activities", activityRouter);

export default router;
