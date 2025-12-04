import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
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
    if(row.option_values){
formatted[row.id].options.push(row.option_values)
    }
  });
  res.status(200).json(formatted)
  } catch (error:any) {
    res.status(400)
    .send(`Error fetching quiz question and options from tables ${error.message}`)
  }
};

export{
    getQuizQuestionOptions
}