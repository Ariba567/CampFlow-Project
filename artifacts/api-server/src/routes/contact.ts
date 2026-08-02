import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as contactController from "../controllers/contactController";

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").max(20, "Phone number cannot exceed 20 characters").optional(),
  topic: z.string().trim().min(3, "Topic must be at least 3 characters").max(200, "Topic cannot exceed 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message cannot exceed 2000 characters"),
});

router.post("/", validate(contactSchema), contactController.createContact);

export default router;
