import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";
import type { User } from "../models/users";
import validator from "validator";
const knex = initKnex(configuration);

const addUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email,  phone_number, uid } = req.body;

  if (!name || !email || !phone_number || !uid) {
    res
      .status(400)
      .send(
        "Missing required fields: name, email, phone_number, uid",
      );
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

export { addUser };
