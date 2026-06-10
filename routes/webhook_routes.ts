import express from "express";
import quizWebhook from "../controllers/webhook_controllers.js";

const router = express.Router();

router.post("/quiz-webhook", quizWebhook);

export default router;
