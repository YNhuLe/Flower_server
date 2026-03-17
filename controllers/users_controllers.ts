import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";
import type { User } from "../models/users";
import validator from "validator";
import serviceAccount from "../serviceAccountKey.json";
import { auth } from "express-oauth2-jwt-bearer/dist/index.js";

const knex = initKnex(configuration);

// Controller function to add a new user from Email/Passwword sign up
const addUser = async (req: Request, res: Response): Promise<void> => {
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
    const existingUser = await knex<User>("users")
      .where("email", email)
      .first();
    if (existingUser) {
      if (existingUser.email === email) {
        res.status(400).json({
          message: "User with this email already exists",
        });
        return;
      }

      if (existingUser.phone_number === phone_number) {
        res
          .status(400)
          .json({ message: "User with this phone number already exists" });
      }
      return;
    }
  } catch (error: any) {
    res
      .status(400)
      .send(`Error checking existing user: ${error.message || error}`);
    return;
  }

  try {
    const data: User[] = await knex<User>("users")
      .insert(req.body)
      .returning("*");
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(400).send(`Error adding user: ${error.message || error}`);
  }
};

//Verify the token that being sent from the Firebase
if (!process.env.AUTH0_AUDIENCE) {
  throw new Error("MIssing AUTH0_AUDIENCE in environment variables.");
}

const verifyAuth0Token = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});
// Controller function to add a new user from Google sign up
const createOrCreateLoginGoogleUser = async (req: Request, res: Response) => {
  const auth0User = req.auth as any;
  if (!auth0User) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  const email = auth0User["https://eververdant.com/email"];
  const name = auth0User["https://eververdant.com/name"];
  const auth0_id = auth0User.sub;


  if( !email || !name || !auth0_id) {
    return res.status(400).json({ message: "Required user information missing in token." });
  }
  try {
    const existingUser = await knex("users").where("email", email).first();
    if (!existingUser) {
      const [newUser] = await knex("users")
        .insert({
          email,
          name,
          auth0_id,
          // ,avatar_url: picture
          //in case user already exists with the same email but different auth0_id, we will update the name and auth0_id to the new one, this is for the case when user sign up with email/password first then later sign up with google with the same email, we want to link the google account to the existing user
        }).onConflict("email").merge({ name, auth0_id })
        .returning("*");

        if( !newUser){
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

//get user
const getUserProfile = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const decoded = req.auth as any;
 
  const email = decoded["https://eververdant.com/email"] || decoded.email;
  const name = decoded["https://eververdant.com/name"] || decoded.name;
  const auth0_id = decoded.sub;
  console.log("Decoded token in getUserProfile: ", email, name, decoded);
  if (!email || !auth0_id) {
    return res.status(400).json({ message: "Email or Auth0 ID not found in token" });
  }
try{
  const user = await knex("users").where(email ? { email } : { auth0_id }).first();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
}catch(error: any){
  console.error("Error fetching user profile: ", error);
  res.status(500).json({ message: "Database error", error: error });
}

};
export {
  addUser,
  verifyAuth0Token,
  createOrCreateLoginGoogleUser,
  getUserProfile,
};
