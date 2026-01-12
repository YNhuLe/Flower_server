import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
import generateRecommendation from "../services/gemini.js";
import type { QuizAnswer, AIRecommendation } from "../models/plant-quiz.js";
const knex = initKnex(configuration);

//get the quiz questions and options
const getQuizQuestionOptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const questions = await knex.raw(
      `SELECT q.id, q.question_key, q.question_text, 
        q.type, q.display_order,
        o.option_values
        FROM quiz_questions q
        INNER JOIN quiz_options o ON q.id=o.question_id
        ORDER BY q.display_order, o.id
        
        `
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
        `Error fetching quiz question and options from tables ${error.message}`
      );
  }
};



//post send user's input to server so AI can generate the recommendations
 const postQuizPlantRecommendations = async(
  req: Request, res:Response
 ): Promise<void> =>{
  console.log("req.body:", req.body);
  // const {user_id} = req.body;

  let candidatePlant: any;


  try{

//       const answers = { rows: [
//   { question_key: "avoid_types", answer_value: "toxic" },
//   { question_key: "light", answer_value: "low" },
//   { question_key: "temperature", answer_value: "moderate" }
// ]};


const {user_id,  answers} = req.body;
if (!req.body || !req.body.answers) {
  res.status(400).json({ error: "Missing answers in request body" });
  return;
}

// console.log("Answers: ", answers)
candidatePlant = {rows: await knex('plants')
  .join("plant_sizes", "plant_sizes.plant_id", "plants.id")
  
  .select('*') };

 const avoid = answers.find((ans: QuizAnswer)=> ans.question_key === "avoid_types");
 const lightPref = answers.find((ans: QuizAnswer) => ans.question_key === "sunlight");
 const tempPref = answers.find((ans:QuizAnswer) => ans.question_key==="temperature");
 const humidityPref = answers.find((ans:QuizAnswer) => ans.question_key === "humidity");
const levelPref = answers.find((ans:QuizAnswer) => ans.question_key === "plantinglevel");


// candidatePlant.rows = candidatePlant.rows.filter((plant: any) => {
//   const notAvoided = !avoid || !avoid.answer_value.some((avoidVal: string) =>
//     (plant.avoid_types || "").toLowerCase().includes(avoidVal.toLowerCase())
//   );

//   const matchesLight = !lightPref || plant.light?.toLowerCase() === lightPref.answer_value.toLowerCase();
//   const matchesTemp = !tempPref || plant.temperature_range?.toLowerCase() === tempPref.answer_value.toLowerCase();
//   const matchesHumidity = !humidityPref || plant.humidity?.toLowerCase() === humidityPref.answer_value.toLowerCase();
//   const matchesLevel = !levelPref || plant.plantinglevel?.toLowerCase() === levelPref.answer_value.toLowerCase();

//   return notAvoided && matchesLight && matchesTemp && matchesHumidity && matchesLevel;
// }).slice(0, 30);

// candidatePlant.rows = candidatePlant.rows.filter((plant: any) => {
//   const notAvoided = !avoid || !avoid.answer_value.some((avoidVal: string) =>
//     (plant.avoid_types || "").toLowerCase().includes(avoidVal.toLowerCase())
//   );

//   const matchesLight = !lightPref || (LIGHT_MAP[lightPref.answer_value.toLowerCase() as keyof typeof LIGHT_MAP]?.some(keyword=> plant.light?.toLowerCase().includes(keyword)) ?? false);
//   const matchesTemp = !tempPref || plant.temperature_range?.toLowerCase() === tempPref.answer_value.toLowerCase();
//   const matchesHumidity = !humidityPref || plant.humidity?.toLowerCase() === humidityPref.answer_value.toLowerCase();
//   const matchesLevel = !levelPref || plant.plantinglevel?.toLowerCase() === levelPref.answer_value.toLowerCase();

//   return notAvoided && matchesLight && matchesTemp && matchesHumidity && matchesLevel;
// }).slice(0, 30);

console.log("candidates: ", candidatePlant.rows)


const prompt = `
User preferences: ${JSON.stringify(answers)}
Candidate plants: ${JSON.stringify(candidatePlant.rows)}

Select the top 3 plants ONLY from the candidate list.
For each, include:
- "plant": exact common_name from candidate list
- "benefit": why it fits user preferences
- "scoreMatch": numeric between 0 and 1 (dot decimals)
- "reasoning": "reasoning": a short one‑sentence explanation showing how the plant fits the user's preferences.

Return valid JSON array with up to 3 items.

[
  {
    "plant": "Snake Plant",
    "benefit": "Excellent air purifier, thrives in low light, very low maintenance",
    "scoreMatch": 0.92,
    "reasoning":“Matches low‑light and low‑humidity needs, thrives with minimal care, and avoids restricted plant types.”
  },
  {
    "plant": "Spider Plant",
    "benefit": "Pet-safe, adapts to moderate temperatures, improves indoor air quality",
    "scoreMatch": 0.87,
    "reasoning":“Adaptable to bright‑indirect light, moderate humidity, and beginner‑friendly while avoiding your flagged plant types.”
  },
  {
    "plant": "Peace Lily",
    "benefit": "Handles moderate humidity, removes toxins, adds greenery to shaded rooms",
    "scoreMatch": 0.85,
    "reasoning":“Fits moderate humidity and indirect light preferences, easy to maintain, and safe for your avoid list.”
  }
]

`;

//get recommendations from AI
const recommendations = await generateRecommendation(prompt);

let cleaned = recommendations.trim().replace(/```json|```/g, "");
//convert the recommendation into JSON
const AIResponse:AIRecommendation[] = JSON.parse(cleaned);

//merge AI recommendations with the DB rows
const mergeRecommendations = AIResponse.map((recom : AIRecommendation) =>{
  const match = candidatePlant.rows.find(
    (p: any) => p.common_name.toLowerCase()=== recom.plant.toLowerCase()
  );

  if(!match) return null
  return {
    ...match,
     scoreMatch: recom.scoreMatch,
     reasoning: recom.reasoning
  }
}).filter(Boolean);
//check if the plant from AI recommendation match with any plant in the table;
// const validateAIResponse =AIResponse.filter((recom:AIRecommendation)=> candidatePlant.rows.some((p:any)=>p.common_name.toLowerCase() === recom.plant.toLowerCase()))

res.status(200).json({recommendations: mergeRecommendations})

  }catch(err:any){
      console.error("Gemini error:", err);
    res.status(400)
    .send(`Error sending the user's input into the server! ${err.message}`);
  

  
  }
 }
export { getQuizQuestionOptions, postQuizPlantRecommendations };
