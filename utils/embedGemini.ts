import { GoogleGenAI } from "@google/genai"; // ← new package

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
/**
 * Generates an embedding for the given text using the Gemini API.
 * @param text - The text to embed.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
async function embedWithGemini(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    },
  });

  if (!response.embeddings?.[0]?.values) {
    throw new Error("Invalid embedding response from Gemini");
  }

  return response.embeddings[0].values;
}

export { embedWithGemini };
