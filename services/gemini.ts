import {GoogleGenerativeAI} from "@google/generative-ai";

const generativeAI = new GoogleGenerativeAI(process.env.GEMINI_AI_KEY || "");

const model = generativeAI.getGenerativeModel({model: "gemini-1.5-flash"});


const generateRecommendation = async (prompt : string) :Promise<string> =>{
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export default generateRecommendation;