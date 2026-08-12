/**
 * Email service for handling email-related operations.
 * @params email: string - The email address to send the confirmation to.
 * @params confirmationLink: string - The link to confirm the subscription.
 * @returns Promise<void> - A promise that resolves when the email is sent.
 * 
 */

const sendConfirmationEmail = async (email: string): Promise<void> => {
  console.log(`Sending confirmation email to ${email} `);
};

export  { sendConfirmationEmail };