import express from "express";
import * as plantsControllers from "../controllers/plants-controllers";

const router = express.Router();
router.route("/allplants").get(plantsControllers.getAllPlants);

export default router;
