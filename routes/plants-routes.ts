import express from "express";
import * as plantsControllers from "../controllers/plants-controllers.js";
import * as categoryControllers from "../controllers/categories_controllers.js";
const router = express.Router();
//return all the plants
router.route("/allplants").get(plantsControllers.getAllPlants);
//return single plant base on id
router.route("/allplants/:id").get(plantsControllers.getSinglePlant);
//return plant and their info for the New Product section
router.route("/new_product").get(plantsControllers.getPlantCate);
router.route("/category").get(categoryControllers.getAllCategories);
router.route("/category/:id").get(plantsControllers.getPlantList);
router.route("/giftbox/:boxId").get(plantsControllers.getGiftBoxById);
router.route("/products").get(plantsControllers.getGiftBox);
export default router;
