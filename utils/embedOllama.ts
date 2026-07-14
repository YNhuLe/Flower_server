import axios from "axios";

async function embedWithOllama(text: string): Promise<number[]> {
  const baseURL = process.env.OLLAMA_API_URL || "http://localhost:11434";
  const response = await axios.post(`${baseURL}/api/embed`, {
    model: "nomic-embed-text",
    input: text,
  });

  const data = response.data;

  if (!data?.embeddings?.[0]) {
    throw new Error("Invalid embedding response from Ollama");
  }

  return data.embeddings[0];
}

export { embedWithOllama };
