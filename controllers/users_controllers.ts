import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";
import type { User } from "../models/users";
import validator from "validator";

import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
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
      }

      if (existingUser.phone_number === phone_number) {
        res
          .status(400)
          .json({ message: "User with this phone number already exists" });
      }
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
const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: Function,
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded as any;
    next();
  } catch (err: any) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Controller function to add a new user from Google sign up
const createOrCreateLoginGoogleUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const { name = "", email, uid } = req.user;
  try {
    const existingUser = await knex("users").where("email", email).first();
    if (!existingUser) {
      const [newUser] = await knex("users")
        .insert({
          uid,
          email,
          name: name,
          // ,avatar_url: picture
        })
        .returning("*");
      return res.status(201).json(newUser);
    }
    return res.status(200).json(existingUser);
  } catch (error: any) {
    console.error("Google sign up error: ", error);
    return res.status(500).json({ message: "Database error", error: error });
  }
};

export { addUser, verifyFirebaseToken, createOrCreateLoginGoogleUser };
