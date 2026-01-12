import express from "express";
import * as saleDataControllers from "../controllers/saleData_controller.js";

const router = express.Router();

router.route("/sales").get(saleDataControllers.getSaleData);

export default router;