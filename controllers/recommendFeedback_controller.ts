import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";

const knex = initKnex(configuration);

/**
 * Controller to handle feedback submission for plant recommendations. It performs the following steps:
 * 1. Extracts the `session_id`, `plant_id`, and `feedback` from the request body.
 * 2. Validates the presence of `session_id`, `plant_id`, and `feedback`. If any are missing, it responds with a 400 status code and an error message.
 * 3. Upserts the feedback into the recommend_feedback table, inserting when it doesn't exist yet, and updating if it already exists.
 * @param req - The Express request object: {session_id: number, plant_id: number, feedback: 1 | -1}
 * @param res - The Express response object.
 * Errors: 400 - missing, invalid fields
 * 500 - database error
 * 404 - session or plant not found
 */

const postRecommendFeedback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  //  const { session_id, plant_id, feedback} = req.body;
  const { feedback } = req.body;
  const session_id = Number(req.body.quiz_session_id);
  const plant_id = Number(req.body.plant_id);

  if (!session_id || !plant_id || feedback === undefined) {
    res
      .status(400)
      .json({
        error: "Missing required fields: quiz_session_id, plant_id, feedback",
      });
    return;
  }

  if (![1, -1].includes(feedback)) {
    res.status(400).json({ error: "Invalid feedback value, must be 1 or -1" });
    return;
  }

  const [session, plant] = await Promise.all([
    knex("quiz_sessions").where({ id: session_id }).first(),
    knex("plants").where({ id: plant_id }).first(),
  ]);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }

  if (!session.top3_plant_ids.includes(Number(plant_id))) {
    res
      .status(400)
      .json({
        error: "Plant is not in the top 3 recommendations for this session",
      });
    return;
  }

  try {
    await knex("recommend_feedback")
      .insert({
        quiz_session_id: session_id,
        plant_id,
        user_id: session.user_id ?? null,
        feedback,
      })
      .onConflict(["quiz_session_id", "plant_id"])
      .merge({ feedback, created_at: knex.fn.now() });

    res.status(200).json({ message: "Feedback submitted succesfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: `Failed to save feedback: ${error.message}` });
  }
};

export { postRecommendFeedback };
