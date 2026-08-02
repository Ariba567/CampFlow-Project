import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema } from "../middleware/validate";
import User from "../models/User";
import { sanitiseUser } from "../services/authService";

const router = Router();

const roleSchema = z.object({
  role: z.enum(["customer", "manager", "admin"]),
});

/** Allows an administrator to move an existing account between supported roles. */
router.patch(
  "/:id/role",
  authenticate,
  authorize("admin"),
  validate(mongoIdSchema, "params"),
  validate(roleSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id).exec();

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.role = req.body.role;
    await user.save();
    res.status(200).json({ message: "User role updated successfully.", data: sanitiseUser(user) });
  },
);

export default router;
