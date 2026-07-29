import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import campgroundRouter from "./campgrounds";
import campsiteRouter from "./campsites";
import reservationRouter from "./reservations";
import activityRouter from "./activities";
import reviewRouter from "./reviews";
import pricingRouter from "./pricing";
import paymentRouter from "./payments";
import notificationRouter from "./notifications";
import customerRouter from "./customers";
import managerRouter from "./managers";
import administratorRouter from "./administrators";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/campgrounds", campgroundRouter);
router.use("/campsites", campsiteRouter);
router.use("/reservations", reservationRouter);
router.use("/activities", activityRouter);
router.use("/reviews", reviewRouter);
router.use("/pricing", pricingRouter);
router.use("/payments", paymentRouter);
router.use("/notifications", notificationRouter);
router.use("/customers", customerRouter);
router.use("/managers", managerRouter);
router.use("/administrators", administratorRouter);

export default router;
