import express  from "express";
import * as giftControllers from "../controllers/gift_controllers.js";

const router = express.Router();

//return all the gifts
router.route("/gifts").get(giftControllers.getAllGifts);
router.route("/gift_categories").get(giftControllers.getAllCategories);
export default router;