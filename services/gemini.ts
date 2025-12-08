import {GoogleGenerativeAI} from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const generativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = generativeAI.getGenerativeModel({model: "gemini-3-pro-preview"});


const generateRecommendation = async (prompt : string) :Promise<string> =>{
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export default generateRecommendation;