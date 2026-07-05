import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
import generateRecommendation from "../services/gemini.js";
import type { QuizAnswer, AIRecommendation } from "../models/plant-quiz.js";
import { embed } from "../utils/embed.js";
import type { Plant, PlantWithSizes } from "../models/plants.js";

const knex = initKnex(configuration);

/***
 * Controller to get quiz questions and options from the database, format them into a structured JSON object, and send it as a response to the client.
 * The function performs the following steps:
 * 1. Executes a raw SQL query to fetch quiz questions along with their associated options, ordered by display order.
 * 2. Initializes an empty object `formatted` to store the structured quiz data.
 * 3. Iterates through each row of the query result:
 *    - If the question ID does not already exist in `formatted`, it creates a new entry for that question with its details and an empty options array.
 *    - If the current row contains an option value, it appends that option to the corresponding question's options array.
 * 4. Finally, it sends the structured quiz data as a JSON response with a 200 status code. If any error occurs during this process, it catches the error and sends a 500 status code with an error message.
 *
 */
const getQuizQuestionOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questions = await knex.raw(
      `SELECT q.id, q.question_key, q.question_text, 
        q.type, q.display_order,
        o.option_values
        FROM quiz_questions q
        INNER JOIN quiz_options o ON q.id=o.question_id
        ORDER BY q.display_order, o.id
        
        `,
    );

    //create empty object act like a dictionary which key is Id and value is question object with its options

    const formatted: Record<number, any> = {};

    //loop through each row in the questions

    questions.rows.forEach((row: any) => {
      //check if the entry for this formatted for this ID laready exist
      if (!formatted[row.id]) {
        //if not create one with options is an array
        formatted[row.id] = {
          id: row.id,
          key: row.question_key,
          text: row.question_text,
          type: row.type,
          options: [],
        };
      }
      //if the current row has an option_value, then add it into the options array
      if (row.option_values) {
        formatted[row.id].options.push(row.option_values);
      }
    });
    res.status(200).json(formatted);
  } catch (error: any) {
    res
      .status(500)
      .send(
        `Error fetching quiz question and options from tables ${error.message}`,
      );
  }
};

//natural language summary of the AI quiz
function builtQuizSummary(answers: QuizAnswer[]) {
  const map = Object.fromEntries(
    answers.map((a) => [a.question_key, a.answer_value]),
  );

  return `
  
Sunlight: ${map.sunlight},
Temperature: ${map.temperature},
Humidity: ${map.humidity},
Care: ${map.care_level},
PlantType : ${map.plant_interest},
Avoid:${Array.isArray(map.avoid_types) ? map.avoid_types.join(", ") : map.avoid_types}
  
  
  `;
}

//post send user's input to server so AI can generate the recommendations
const postQuizPlantRecommendations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log("req.body:", req.body);
  // const {user_id} = req.body;

  try {
    const { user_id, answers } = req.body;
    if (!answers) {
      res.status(400).json({ error: "Missing answers in request body" });
      return;
    }
    const quizSummary = builtQuizSummary(answers);
    const quizEmbedding = await embed(quizSummary);
    function toPgVector(arr: number[]) {
      return `[${arr.join(",")}]`;
    }

    const vectorMatches = await knex.raw(
      `SELECT *, (plant_embedding <-> (?::vector)) AS distance
  
  FROM plants
  ORDER BY distance ASC
  LIMIT 5`,
      [toPgVector(quizEmbedding)],
    );

    const prompt = `
You are a plant recommendation engine.

User preferences:
${JSON.stringify(answers, null, 2)}

Candidate plants (already pre‑filtered and sorted by vector similarity):
${JSON.stringify(vectorMatches.rows, null, 2)}

From the candidate list, select the **top 3** plants that best match the user's preferences.

For each selected plant, return an object with:
- "plant": exact common_name from the candidate list
- "benefit": a short description of why this plant fits the user's needs
- "scoreMatch": a number between 0 and 1 (decimal)
- "reasoning": 3 bullet points explaining the match less than 50 characters.

Rules:
- Only choose plants from the candidate list.
- Do NOT invent plants or modify names.
- Return **valid JSON array only**, no extra text.

Output format example (structure only, not content):

[
  {
    "plant": "Plant Name",
    "benefit": "Short benefit text",
    "scoreMatch": 0.85,
    "reasoning": [
      "Bullet point 1 explaining the match.",
      "Bullet point 2 explaining the match.",
      "Bullet point 3 explaining the match."
    ]
  }
]
`;

    //get recommendations from AI
    const recommendations = await generateRecommendation(prompt);

    let cleaned = recommendations.trim().replace(/```json|```/g, "");
    //convert the recommendation into JSON
    const AIResponse: AIRecommendation[] = JSON.parse(cleaned);

    //merge AI recommendations with the DB rows
    const mergeRecommendations = await Promise.all(
      AIResponse.map(async (recom: AIRecommendation) => {
        const match = vectorMatches.rows.find(
          (p: Plant) =>
            p.common_name.toLowerCase() === recom.plant.toLowerCase(),
        );
        // console.log("DB match row:", match);

        if (!match) return null;
        const sizes = await knex("plant_sizes")
          .where({ plant_id: match.id })
          .select("*");

        return {
          ...match,
          sizes,
          scoreMatch: recom.scoreMatch,
          reasoning: recom.reasoning,
        } as PlantWithSizes & { scoreMatch: number; reasoning: string[] };
      }),
    ).then((results) => results.filter(Boolean));
    //insert top 3 recommendations into the quiz_sessions table for later retrieval in the chat flow
    const [session] = await knex("quiz_sessions")
      .insert({
        user_id: user_id || null,
        answers: JSON.stringify(answers),
        top3_plant_ids: mergeRecommendations.map((p: any) => p.id),
      })
      .returning("*");
    res.status(200).json({
      session_id: session.id,
      recommendations: mergeRecommendations,
    });
  } catch (err: any) {
    console.error("Gemini error:", err);
    res
      .status(500)
      .send(`Error sending the user's input into the server! ${err.message}`);
  }
};
export {
  getQuizQuestionOptions,
  postQuizPlantRecommendations,
  builtQuizSummary,
};
