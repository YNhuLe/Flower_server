import express from "express";
import * as userControllers from "../controllers/users_controllers.js";

const router = express.Router();

//add a user to the users table
router.route("/users").post(userControllers.addUser);
router.route("/auth/google").post(userControllers.verifyAuth0Token, userControllers.createOrCreateLoginGoogleUser);

//route for user profile ( read-only)
router.route("/users/me").get(userControllers.verifyAuth0Token, userControllers.getUserProfile);
//route for editing user profile
router.route("")
export default router;