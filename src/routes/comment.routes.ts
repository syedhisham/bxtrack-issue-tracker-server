import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController,
} from "../controllers/comment.controller";

const router = Router();

// All routes are protected with authentication middleware
router.post("/", authenticate, createCommentController);
router.get("/issue/:issueId", authenticate, getCommentsController);
router.patch("/:id", authenticate, updateCommentController);
router.delete("/:id", authenticate, deleteCommentController);

export default router;

