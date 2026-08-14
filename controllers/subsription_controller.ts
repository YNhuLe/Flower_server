import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response, NextFunction } from "express";
import { syncToMailchimp } from "../services/mailchimpSerivice";
const knex = initKnex(configuration);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
*a function that subsribe user's email to promotions/updates newsletter and sync it to mailchimp
write the local DB first, then sync the contact to the mailchimp for the actual sending/compaigns management. 
The return mailchimp contact id is stored into the local DB for future reference, unsubsribe weebhooks can update this row.
@param req - Express request object containing the email in the body
@param res - Express response object used to send back the response
@param next - Express next function for error handling
@returns Promise<void> - A Promise that resolves when the operation is complete. The response is sent back to the client with the status of the subscription.
 *
 */

const subscribeToNewletter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }
    const existingEmail = await knex("subscribtions")
      .select("id", "status")
      .where({ email })
      .first();
    if (existingEmail) {
      res
        .status(200)
        .json({
          message: "Email already subscribed",
          status: existingEmail.status,
        });
      return;
    }

    //sync to mailchimp
    const mailchimpResponse = await syncToMailchimp(email);

    //insert locally, linking the Mailchimp contact id
    const [subscriber] = await knex("subscribtions")
      .insert({
        email,
        status: "pending",
        mailchimp_id: mailchimpResponse.id,
        created_at: knex.fn.now(),
      })
      .returning(["id", "email", "status", "mailchimp_id"]);

    //response to the frontend
    res.status(201).json({ message: "Subscription successful", subscriber });
  } catch (error: any) {
    res.status(500).json({
      error: "An error occurred while processing your subscription",
    });
  }
  next();
};
export { subscribeToNewletter };
