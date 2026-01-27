import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
import generateRecommendation from "../services/gemini.js";
import type { QuizAnswer, AIRecommendation } from "../models/plant-quiz.js";
import {embed} from "../utils/embed.js";


const knex = initKnex(configuration);

//get the quiz questions and options
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
      .status(400)
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
Care: ${map.care_commitment},
RoomType: ${map.room_type},
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

  let candidatePlant: any;

  try {
    const { user_id, answers } = req.body;
    if (!answers) {
      res.status(400).json({ error: "Missing answers in request body" });
      return;
    }
    const quizSummary = builtQuizSummary(answers);
    const quizEmbedding = embed(quizSummary);
    if (!req.body || !req.body.answers) {
      res.status(400).json({ error: "Missing answers in request body" });
      return;
    }

    const vectorMatches = await knex.raw(
      `SELECT *, (plant_embedding <-> ?) AS distance
  
  FROM plants
  ORDER BY distance ASC
  LIMIT 30`,
      [quizEmbedding],
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
- "reasoning": one sentence explaining the match

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
    "reasoning": "One sentence explaining the match."
  }
]
`;

    //get recommendations from AI
    const recommendations = await generateRecommendation(prompt);

    let cleaned = recommendations.trim().replace(/```json|```/g, "");
    //convert the recommendation into JSON
    const AIResponse: AIRecommendation[] = JSON.parse(cleaned);

    //merge AI recommendations with the DB rows
    const mergeRecommendations = AIResponse.map((recom: AIRecommendation) => {
      const match = vectorMatches.rows.find(
        (p: any) => p.common_name.toLowerCase() === recom.plant.toLowerCase(),
      );

      if (!match) return null;
      return {
        ...match,
        scoreMatch: recom.scoreMatch,
        reasoning: recom.reasoning,
      };
    }).filter(Boolean);
    res.status(200).json({ recommendations: mergeRecommendations });
  } catch (err: any) {
    console.error("Gemini error:", err);
    res
      .status(400)
      .send(`Error sending the user's input into the server! ${err.message}`);
  }
};
export {
  getQuizQuestionOptions,
  postQuizPlantRecommendations,
  builtQuizSummary,
};
