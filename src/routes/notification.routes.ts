import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "../controllers/notification.controller";

const router = Router();

// All routes are protected with authentication middleware
router.get("/", authenticate, getNotificationsController);
router.patch("/:id/read", authenticate, markNotificationAsReadController);
router.patch("/read-all", authenticate, markAllNotificationsAsReadController);

export default router;

