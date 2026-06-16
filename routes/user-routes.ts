import express from "express";
import * as userControllers from "../controllers/users_controllers.js";
import multer from "multer";
import { verifyAuth0Token } from "../middleware/auth.js";
import uploadAvatar from "../middleware/uploadAvatar.js";
const router = express.Router();



//add a user to the users table
router.route("/users").post(userControllers.addUser);
router.route("/auth/google").post(verifyAuth0Token, userControllers.createOrCreateLoginGoogleUser);
//check if the eimal or phone number already exists in the database
router.get("/users/check-existing", userControllers.checkFieldsAvailability);
//update user profile picture
//router.patch('/users/profile/:auth0Id/avatar', verifyAuth0Token, userControllers.addProfilePicture);
//route for user profile ( read-only)
router.route("/users/me").get(verifyAuth0Token, userControllers.getUserProfile);
router.patch("/users/me", verifyAuth0Token, userControllers.updateUserProfile);
//route for editing user profile
router.patch("/users/profile/:auth0Id/avatar", verifyAuth0Token, uploadAvatar.single('avatar'),userControllers.addProfilePicture);
export default router;