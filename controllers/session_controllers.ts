import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
const knex = initKnex(configuration);
//GET /session/:session_id for guest users
const getSessionById = async (req: any, res: any) => {
  try {
    const { session_id } = req.params;

    //look up the session in the DB by session_id, if not found return 404
    const session = await knex("quiz_sessions")
      .where({ id: session_id })
      .first();

    if (!session) {
      res.status(404).json({ error: "Session not found!" });
      return;
    }

    //fetch top 3 plants recommended from the plants table based on the session.top3_plant_ids array
    const recommendations = await knex("plants")
      .whereIn("id", session.top3_plant_ids)
      .select("*");
    //loop through each plant and fetch its sizes from the plant_sizes tables, combine plants and the sizes into the object return to frontend
    const sizes = await Promise.all(
      recommendations.map(async (plant: any) => {
        const plantSizes = await knex("plant_sizes")
          .where({ plant_id: plant.id })
          .select("*");
        return { ...plant, plantSizes };
      }),
    );

    res.status(200).json({
      session_id: session.id,
      recommendations: sizes,
    });
  } catch (error: any) {
    res.status(400).json({
      error: `Error fetching session data: ${error.message}`,
    });
  }
};

//GET /session/user/:user_id for logged in users by user_id

const getSessionByUserId = async (req: any, res: any) => {
  const { user_id } = req.params;
  //find session by user_id, order by created_at desc to get the most recent session, if not found return 404
  try {
    const session = await knex("quiz_sessions")
      .where({ user_id })
      .orderBy("created_at", "desc")
      .first();

    if (!session) {
      res.status(404).json({ error: "Session not found for this user!" });
      return;
    }

    const recommendations = await knex("plants")
      .whereIn("id", session.top3_plant_ids)
      .select("*");
    //loop through each plant and fetch its sizes from the plant_sizes table, combines plants and the sizes into the object return to frontend
    const sizes = await Promise.all(
      recommendations.map(async (plant: any) => {
        const plantSizes = await knex("plant_sizes")
          .where({ plant_id: plant.id })
          .select("*");
        return { ...plant, plantSizes };
      }),
    );

    //return 200OK with the session_id and the recommendations data
    res.status(200).json({
      session_id: session.id,
      recommendations: sizes,
    });
  } catch (error: any) {
    res.status(400).json({
      error: `Error fetching session data by user_id: ${error.message}`,
    });
  }
};

export { getSessionById, getSessionByUserId };
