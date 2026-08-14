import express from "express";
import * as subscriptionControllers from "../controllers/subsription_controller.js";

const router = express.Router();
router.route("/subscribe").post(subscriptionControllers.subscribeToNewletter);
export default router;