import express from "express";
import * as userControllers from "../controllers/users_controllers.js";

const router = express.Router();

//add a user to the users table
router.route("/users").post(userControllers.addUser);

export default router;