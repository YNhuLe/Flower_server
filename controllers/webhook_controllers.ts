import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
const knex = initKnex(configuration);

const quizWebhook = async (req: Request, res: Response) => {
  try {
    const  event  = req.body;
    console.log("Webhook received:", req.body);

    if (event.type === "quiz.recommendations.ready") {
      await knex("quiz_sessions")
        .where({ id: event.id })
        // .update({ recommendations: event.recommendations });
        .update({ recommendations: JSON.stringify(event.recommendations) });

    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook failed");
  }
};

export default quizWebhook;