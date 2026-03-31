import express from "express";
import * as chatControllers from "../controllers/chatController.js";
import * as sessionController from "../controllers/session_controllers.js";
const router = express.Router();

router.route("/chat").post(chatControllers.postChat);
router.route("/session/:session_id").get(sessionController.getSessionById);
router.route('/chat/:user_id/history').get(chatControllers.getChatHistory)
router.route("/session/user/:user_id").get(sessionController.getSessionByUserId);
export default router;