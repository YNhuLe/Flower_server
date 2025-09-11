import express  from "express";
import * as giftControllers from "../controllers/gift_controllers.js";

const router = express.Router();

//return all the gifts
router.route("/gifts").get(giftControllers.getAllGifts);

export default router;