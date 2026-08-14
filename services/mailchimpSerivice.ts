import crypto from "crypto";
import axios from "axios";

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY as string;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID as string;

/**
 * pre-configured axios instance for Mailchimp API requests
 * baseURL and auth are set once instead of repeating them for each request. The username can be any string, but the password must be the API key.
 */
const mailchimpClient = axios.create({
  baseURL: `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`,
  auth: {
    username: "anystring",
    password: MAILCHIMP_API_KEY,
  },
  headers: {
    "Content-Type": "application/json",
  },
});
/**
 * syncToMailchimp function to upsert a subscriber to Mailchimp's Audience via the Marketing API.
 * It uses the PUT method, keyed on the MD5 hash of the lowercase email.
 * If the subscriber already exists, it updates their status to "pending".
 * If the subscriber does not exist, it creates a new subscriber with the status "pending".
 
 */

const syncToMailchimp = async (email: string) => {
  const subscriberHash = crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

  try {
    const { data } = await mailchimpClient.put(
      `/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        email_address: email,
        status_if_new: "pending",
      },
    );

    return data;
  } catch (error: any) {
    const detail = error.response?.data?.detail || error.message;
    throw new Error(`Failed to sync subscriber to Mailchimp: ${detail}`);
  }
};

export { syncToMailchimp, mailchimpClient };
