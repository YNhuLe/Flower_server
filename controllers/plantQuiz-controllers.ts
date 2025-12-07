import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
import generateRecommendation from "../services/gemini.js";
import type { QuizAnswer } from "../models/plant-quiz.js";
     
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

  const {user_id} = req.body;
  try{

    const answers = await knex.raw(`
      
      SELECT q.question_key, a.answer_value 
      FROM quiz_answers a
      JOIN quiz_questions  q
      ON a.question_id = q.id
      WHERE a.user_id`, [user_id])
    let candidatePlant = await knex.raw(`
      SELECT common_name, light, humidity, avoid_types, planting_level FROM plants`);

   
      const avoid = answers.rows.find((avoinPlant: QuizAnswer) => avoinPlant.question_key === "avoid_types");
      if(avoid){
        candidatePlant.rows = candidatePlant.rows.filter((plant: any)=> !plant.avoid_types.includes(avoid.answer_value)).slice(0, 30);
      };


      //set the prompt and output format 
      const prompt = `
User preferences: ${JSON.stringify(answers.rows)}
Candidate plants: ${JSON.stringify(candidatePlant.rows)}

Recommend the top 3 plants that best fit the user’s needs.
Return the result as JSON in this format:
[
  { "plant": "Snake Plant", "reason": "Thrives in low light and minimal care" },
  { "plant": "Peace Lily", "reason": "Handles moderate temps and improves air quality" }
]
`;

const recommendations = await generateRecommendation(prompt);
const validateRecommendation = JSON.parse(recommendations);





  }catch(err:any){
    res.status(400)
    .send(`Error sending the user's input into the server!!!`);
  }
 }
export { getQuizQuestionOptions, postQuizPlantRecommendations };
