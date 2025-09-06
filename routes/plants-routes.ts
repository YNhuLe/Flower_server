import express from "express";
import * as plantsControllers from "../controllers/plants-controllers.js";

const router = express.Router();
//return all the plants
router.route("/allplants").get(plantsControllers.getAllPlants);
//return single plant base on id
router.route("/allplants/:id").get(plantsControllers.getSinglePlant)
router.route("/category/:id").get(plantsControllers.getPlantList)
router.route("/giftbox/:boxId").get(plantsControllers.getGiftBoxById)
router.route("/products").get(plantsControllers.getGiftBox)
export default router;
