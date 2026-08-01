import axios from "axios";



const callClaude = async (
  systemPrmpt: string,
  messages: any[],
  tools: any[],
) => {
  console.log(
    "Inside callClaude, key exists:",
    !!process.env.ANTHROPIC_API_KEY,
  );
  console.log(
    "Key value being sent:",
    process.env.ANTHROPIC_API_KEY?.slice(0, 15),
  );

  const claudeApi = axios.create({
    baseURL: "https://api.anthropic.com/v1",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
  });

  try {
    const response = await claudeApi.post("/messages", {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: systemPrmpt,
      tools,
      messages,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};
export default callClaude;
