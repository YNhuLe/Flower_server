import express from "express";
import * as searchController from "../controllers/searchControllers";

const router = express.Router();

router.get("/search", searchController.getSearchResults);

export default router;