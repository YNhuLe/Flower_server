import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";
import type { User } from "../models/users";
import validator from "validator";
import { auth } from "express-oauth2-jwt-bearer/dist/index.js";
import cloudinary from "../config/cloudinary.js";
const knex = initKnex(configuration);

/**
 * Add a new user to the database based on the information provided in the request body.
 * This function validates the input data, checks for existing users with the same email or phone number, and inserts a new user record into the "users" table if all validations pass.
 * @param req - Express request object containing user data in the body
 * @param res - Express response object used to send back the result
 * @returns {Promise<void>} - Sends a response with the created user or an error message
 *
 * @returns {200} If user is successfully created and returned in the response
 * @returns {400} If required fields are missing, email format is invalid, phone number format is invalid, or if a user with the same email or phone number already exists
 * @returns {404} If user is not found in the database (not applicable for this function but included for consistency with other functions)
 * @returns {500} If there is an error during database operations or other unexpected errors
 * @returns {409} If a user with the same email or phone number already exists in the database
 */

const addUser = async (req: Request, res: Response): Promise<void> => {
  console.log("addUser req.body:", JSON.stringify(req.body, null, 2));
  const { name, email, phone_number, uid } = req.body;

  if (!name || !email || !phone_number || !uid) {
    res
      .status(400)
      .send("Missing required fields: name, email, phone_number, uid");
    return;
  }

  if (!validator.isEmail(email)) {
    res.status(400).send("Invalid email format");
    return;
  }

  if (typeof phone_number !== "string") {
    res.status(400).json({
      message: "Phone number should be a string!",
    });
    return;
  }
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  if (!phoneRegex.test(phone_number)) {
    res.status(400).json({
      message: "Phone number must be in format: (000) 000-0000",
    });
    return;
  }

  try {
    const existingEmail = await knex<User>("users")
      .where("email", email)
      .first();
    if (existingEmail) {
      res.status(409).json({
        message: "User with this email already exists",
      });
      return;
    }

    const existingPhoneNumber = await knex<User>("users")
      .where("phone_number", phone_number)
      .first();
    if (existingPhoneNumber) {
      res
        .status(409)
        .json({ message: "User with this phone number already exists" });
      return;
    }
  } catch (error: any) {
    res
      .status(500)
      .send(`Error checking existing user: ${error.message || error}`);
    return;
  }

  try {
    const data: User[] = await knex<User>("users")
      .insert({
        name,
        email,
        phone_number,
        auth0_id: uid,
      })
      .returning("*");
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).send(`Error adding user: ${error.message || error}`);
  }
};

/**
 * Checks if the email or phone number provided in the request body already exists in the database.
 *  If either exists, it returns a 409 Conflict response. If both are unique, it proceeds to create a new user record in the "users" table with the provided information and returns the created user object in the response.
* @param req - Express request object containing user data in the body
* @param res - Express response object used to send back the result
* @returns {Promise<void>} - Sends a response with the created user or an error message
*
* @returns {409} If a user with the same email or phone number already exists in the database

*/

const checkFieldsAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { field, value } = req.query as { field: string; value: string };

  if (!field || !value) {
    res.status(400).json({ message: "Field and value are required!" });
    return;
  }

  const allowedFields = ["email", "phone_number"];
  if (!allowedFields.includes(field)) {
    res.status(400).json({
      message: "Invalid field! Allowed fields are email and phone_number",
    });
    return;
  }

  try {
    const existing = await knex("users").where(field, value).first();
    if (existing) {
      res.status(409).json({ message: `${field} already exists` });
      return;
    }
    res.status(200).json({ message: `${field} is available` });
  } catch (error: any) {
    console.error("DB error in checkFieldAvailability:", error);
    res.status(500).json({
      message: `Error checking field availability: ${error.message || error}`,
    });
  }
};

/**
 * Uploads a user's profile picture to Cloudinary and saves the URL to PostgreSQL.
 *
 * @route PATCH /users/:auth0Id/avatar
 * @access Private (requires Auth0 token)
 *
 * @param req - Express request object
 * @param req.params.auth0Id - The user's Auth0 ID from the URL
 * @param req.file - The image file uploaded via multer (memoryStorage)
 * @param res - Express response object
 *
 * @returns {200} Updated user object with new avatar_url
 * @returns {400} If no file uploaded or missing required fields
 * @returns {404} If user not found in database
 * @returns {500} If Cloudinary upload or database update fails
 */
const addProfilePicture = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.params;

    //Guard: check file exists and has buffer ( multer memoryStorage) before starting upload stream
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ message: "No file uploaded or file buffer is empty" });
    }
    const sanitizedPublicId = (auth0Id as string).replace(/[|@#?&]/g, "_");

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          public_id: sanitizedPublicId,
          overwrite: true,
          resource_type: "image",
          transformation: [{ width: 200, height: 200, crop: "fill" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file!.buffer);
    });
    const avatar_url = (uploadResult as any).secure_url;

    if (!avatar_url) {
      return res
        .status(500)
        .json({ message: "Failed to upload image to the cloud storage." });
    }

    //update the user's avatar_url in the database
    const user = await knex("users")
      .where({ auth0_id: auth0Id })
      .update({ avatar_url })
      .returning("*");
    console.log("User found:", user);
    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user[0]);
  } catch (error: any) {
    console.error("addProfilePicture error:", error);
    return res.status(500).json({
      message: `Error adding profile picture: ${error.message || error}`,
    });
  }
};

/**
 * Updates the user's profile information.
 *
 * @route PATCH /users/me
 * @access Private (requires Auth0 token)
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns {200} Updated user object
 * @returns {400} If required user information is missing
 * @returns {500} If database error occurs
 */
const updateUserProfile = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const decoded = req.auth as any;
  const payload = decoded.payload || decoded;
  const auth0Id = payload.sub;

  const { name, phone_number } = req.body;

  if (!name || !phone_number) {
    return res
      .status(400)
      .json({ message: "Name and phone number are required" });
  }

  if (phone_number) {
    if (typeof phone_number !== "string") {
      return res
        .status(400)
        .json({ message: "Phone number should be a string!" });
    }
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(phone_number)) {
      return res
        .status(400)
        .json({ message: "Phone number must be in format: (000) 000-0000" });
    }
  }

  try {
    const updatedUser = await knex("users")
      .where({ auth0_id: auth0Id })
      .update({ name, phone_number })
      .returning("*");

    if (!updatedUser || updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json(updatedUser[0]);
  } catch (error: any) {
    console.error("updateUserProfile error:", error);
    return res
      .status(500)
      .json({ message: `Error updating profile: ${error.message || error}` });
  }
};
/**
 * Adds a new user to the database or retrieves existing user based on Google sign up information from Auth0 token.
 * This function extracts user information from the Auth0 token, checks if a user with the same email already exists in the database, and either creates a new user or returns the existing user.
 *
 * @route POST /auth/google
 * @access Private (requires Auth0 token)
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns {200} Existing user object if user already exists
 * @returns {201} New user object if user is created
 * @returns {400} If required user information is missing in token
 * @returns {500} If database error occurs
 */
const createOrCreateLoginGoogleUser = async (req: Request, res: Response) => {
  const auth0User = req.auth as any;
  if (!auth0User) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  const payload = auth0User.payload || auth0User;
  const email = payload["https://eververdant.com/email"];
  const name = payload["https://eververdant.com/name"];
  const picture = payload["https://eververdant.com/picture"];
  const auth0_id = payload.sub;

  console.log("Extracted data:", { email, name, picture, auth0_id });
  if (!email || !name || !auth0_id) {
    return res
      .status(400)
      .json({ message: "Required user information missing in token." });
  }
  try {
    const existingUser = await knex("users").where("email", email).first();
    if (!existingUser) {
      const [newUser] = await knex("users")
        .insert({
          email,
          name,
          auth0_id,
          avatar_url: picture,
          //in case user already exists with the same email but different auth0_id, we will update the name and auth0_id to the new one, this is for the case when user sign up with email/password first then later sign up with google with the same email, we want to link the google account to the existing user
        })
        .onConflict("email")
        .merge({ name, auth0_id, avatar_url: picture })
        .returning("*");

      if (!newUser) {
        return res.status(500).json({ message: "Failed to create user." });
      }
      return res.status(201).json(newUser);
    }
    return res.status(200).json(existingUser);
  } catch (error: any) {
    console.error("Google sign up error: ", error);
    return res.status(500).json({ message: "Database error", error: error });
  }
};

/**
 * Get the authenticated user's profile information from the database based on the email or Auth0 ID extracted from the Auth0 token.
 * This function checks for the presence of the Auth0 token, extracts the user's email and Auth0 ID from the token, and retrieves the corresponding user record from the "users" table in the database.
 * @param req - Express request object containing the Auth0 token
 * @param res - Express response object used to send back the result
 * @returns  - Sends a response with the user profile or an error message
 *
 * @returns {200} If user profile is successfully retrieved and returned in the response
 * @returns {400} If user is not authenticated or if email/Auth0 ID is missing in the token
 * @returns {404} If user is not found in the database
 * @returns {500} If there is an error during database operations or other unexpected errors
 */
const getUserProfile = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const decoded = req.auth as any;
  const payload = decoded.payload || decoded;

  const email = payload["https://eververdant.com/email"] || payload.email;
  const name = payload["https://eververdant.com/name"] || payload.name;
  const picture = payload["https://eververdant.com/picture"] || payload.picture;
  const auth0_id = payload.sub;
  if (!email || !auth0_id) {
    return res
      .status(400)
      .json({ message: "Email or Auth0 ID not found in token" });
  }
  try {
    console.log("Searching for user with email:", email);
    const user = await knex("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user profile: ", error);
    res.status(500).json({ message: "Database error", error: error });
  }
};

export {
  addUser,
  createOrCreateLoginGoogleUser,
  getUserProfile,
  addProfilePicture,
  updateUserProfile,
  checkFieldsAvailability,
};
