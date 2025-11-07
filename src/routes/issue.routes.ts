import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createIssueController,
  getIssuesController,
  getIssueByIdController,
  updateIssueController,
  getIssueSummaryController,
  getMyIssuesController,
  getMentionedIssuesController,
} from "../controllers/issue.controller";

const router = Router();

// All routes are protected with authentication middleware
router.post("/", authenticate, createIssueController);
router.get("/", authenticate, getIssuesController);
router.get("/my-issues", authenticate, getMyIssuesController);
router.get("/mentioned", authenticate, getMentionedIssuesController);
router.get("/summary", authenticate, getIssueSummaryController);
router.get("/:id", authenticate, getIssueByIdController);
router.patch("/:id", authenticate, updateIssueController);

export default router;

