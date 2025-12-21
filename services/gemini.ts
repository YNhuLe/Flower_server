import dotenv from "dotenv";
import express from "express";
import { GoogleGenAI } from "@google/genai";
const app = express();

app.use(express.json());

dotenv.config();
dotenv.config({ quiet: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const generateRecommendation = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
};




export default generateRecommendation;







