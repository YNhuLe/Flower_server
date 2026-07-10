import initKnex from "knex";
import configuration from "../knexfile";
import callClaude from "../services/claude";
const knex = initKnex(configuration);
//tools definition so the agent call
const tools = [
  {
    name: "get_care_guide",
    description: "Get care instructions for a plant by its slug.",
    input_schema: {
      type: "object",
      properties: {
        plant_name: { type: "string" },
      },
      required: ["plant_name"],
    },
  },
  {
    name: "check_pet_safety",
    description: "Check if a plant is safe for cats or dogs",
    input_schema: {
      type: "object",
      properties: {
        plant_name: { type: "string" },
      },
      required: ["plant_name"],
    },
  },
  {
    name: "get_plant_page",
    description: "Get the product page url for a plant.",
    input_schema: {
      type: "object",
      properties: {
        plant_name: { type: "string" },
      },
      required: ["plant_name"],
    },
  },
];

/**
 * Execute a tool call based on its name and input.
 *
 * @param call - The tool call object containing name, input, and id.
 * @returns The result of the tool execution.
 */
const executeTool = async (call: any) => {
  let result;
  switch (call.name) {
    case "get_care_guide":
      result = await knex("plants")
        .where({ slug: call.input.plant_name })
        .select(
          "watering_requirements",
          "humidity_preference",
          "light",
          "temperature_range",
          "soil_type",
          "fertilizer_info",
          "growth_habit",
        )
        .first();
      break;
    case "check_pet_safety":
      result = await knex("plants")
        .where({ slug: call.input.plant_name })
        .select("is_pet_friendly", "toxicity_notes")
        .first();
      break;

    case "get_plant_page":
      result = await knex("plants")
        .where({ slug: call.input.plant_name })
        .select("page_url", "common_name")
        .first();
      break;
  }

  return {
    type: "tool_result",
    tool_use_id: call.id,
    content: JSON.stringify(result),
  };
};

/**/
const createChatSession = async (req: any, res: any): Promise<void> => {
  try {
    const { user_id, quiz_sessions_id } = req.body;
    if (!user_id || !quiz_sessions_id) {
      return res
        .status(400)
        .json({ error: "user_id , quiz_session_id are required" });
    }

    const [chatSession] = await knex("chat_sessions")
      .insert({ user_id, quiz_sessions_id, title: "Plant chat" })
      .returning("*");

    res.status(201).json(chatSession);
  } catch (serror: any) {
    console.error("Error creating chat session:", serror);
    res.status(500).json({ error: serror.message });
  }
};

// ─── Main chat endpoint ───────────────────────────────────────────────────────
/**
 * Handle a chat request with the AI plant advisor.
 *
 * Endpoint
 *   POST /api/chat
 *
 * Description
 *   Processes a user's message in a quiz session, sends the conversation
 *   context to the AI model, and returns the generated reply.
 *
 * Database Tables
 *   quiz_sessions  – stores quiz answers and recommended plants
 *   plants         – stores plant information
 *   chat_history   – stores conversation messages
 *
 * Query Logic
 *   - Retrieve session using session_id
 *   - Fetch top 3 plants using session.top3_plant_ids
 *   - Load chat history ordered by created_at ASC
 *   - Save user message and AI reply to chat_history
 *
 * Request Body
 *   { session_id: number, message: string }
 *
 * Success Response
 *   { reply: string }
 *
 * Errors
 *   404 – Session not found
 *   500 – Chat or database error
 */
const postChat = async (req: any, res: any): Promise<void> => {
  try {
    const { session_id, message } = req.body;

    //fetch the quiz session data to provide context to the agent
    const chatSession = await knex("chat_sessions")
      .where({ id: session_id })
      .first();

    if (!chatSession) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const session = await knex("quiz_sessions")
      .where({ id: chatSession.quiz_sessions_id })
      .first();

    if (!session) {
      res.status(404).json({ error: "Quiz session not found" });
      return;
    }

    // get top 3 recommoendations from the plants table based on the session.top3_plant_ids array
    const top3 = await knex("plants")
      .whereIn("id", session.top3_plant_ids)
      .select("common_name", "slug", "is_pet_friendly");

    const history = await knex("chat_history")
      .where({ session_id })
      .orderBy("created_at", "asc");

    // Construct messages for Claude
    const messages = [
      ...history.map((h: any) => ({
        role: h.role,
        content: h.message,
      })),
      { role: "user", content: message },
    ];

    //  System prompt with quiz context and instructions for the agent
const systemPrompt = `
You are a friendly plant advisor.

User profile: ${JSON.stringify(session.answers)}
Top 3 plants: ${JSON.stringify(top3)}

Rules:
- Use get_care_guide for watering, light, soil or care questions
- Use check_pet_safety when pets, cats or dogs are mentioned
- Use get_plant_page to suggest the product page at the end
- Keep replies short, warm and conversational

- If the user asks about ONE specific topic (e.g. just watering, just light, just humidity),
  answer ONLY that topic in 1-2 short sentences. Do NOT show the full care guide format below —
  just give a brief, friendly, focused tip using the relevant emoji, e.g.:
  💧 Water it once the top inch of soil feels dry — usually every 7-10 days.

- Only use the FULL "Complete Care Guide" format below if the user asks for a full/complete
  care guide, or asks a broad question like "how do I take care of this plant".

When showing a full care guide, format it like this:
**Complete Care Guide for [Plant Name]:**
💧 **Watering:** [watering info]
☀️ **Light:** [light info]
🌡️ **Temperature:** [temperature info]
💨 **Humidity:** [humidity info]
🌱 **Fertilizing:** [fertilizing info]
🌿 **Soil:** [soil info]

For pet safety, format it like this:
✅ **Pet Safe:** Yes — safe for cats and dogs
⚠️ **Pet Safety:** [plant name] is toxic to [cats/dogs] — [toxicity notes]

For product page suggestions, format it like this:
🛒 🛒 [View {Plant Name}]({page_url})
`;

    //AGENT LOOP and pick out tools

    console.log("messages being sent:", JSON.stringify(messages, null, 2));
    console.log("tools:", JSON.stringify(tools, null, 2));
    let response = await callClaude(systemPrompt, messages, tools);

    while (response.stop_reason === "tool_use") {
      const toolCalls = response.content.filter(
        (c: any) => c.type === "tool_use",
      );
      const toolResults = await Promise.all(toolCalls.map(executeTool));

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await callClaude(systemPrompt, messages, tools);
    }

    const reply = response.content.find((c: any) => c.type === "text")?.text;
    if (!reply) {
      throw new Error("No text response from Claude");
    }
    // const { session_id, message } = req.body;
    const sessionId = Number(session_id);
    //save the chat history to the database

    try {
      await knex("chat_history").insert([
        { session_id: sessionId, role: "user", message },
        { session_id: sessionId, role: "assistant", message: reply },
      ]);

      res.status(200).json({ reply });
    } catch (err: any) {
      res.status(500).json({
        error: "Failed to save chat history",
        details: err.message || err,
      });
    }
  } catch (err: any) {
    console.error(
      "Chat error full details:",
      err.response?.data || err.message || err,
    );

    res.status(500).json({
      error:
        err.response?.data?.error?.message || err.message || "Unknown error",
    });
  }
};
//--------------------------Get the chat from the chat_history table based on the session_id
/** 
 * API route: GET /chat/:user_id/history
 * 
 * Database table: chat_history, quiz_sessions
 * 
 * Description:
 * This endpoint queries the `chat_history` table and returns all messages
 * associated with a given user's most recent session. Messages are ordered chronologically
 * based on their creation timestamp.
 * @param req - The request object containing the user_id parameter.
 * @param res - The response object used to send the chat history.
* @returns A JSON response containing the chat history or an error message.
 
**/

const getChatHistory = async (req: any, res: any) => {
  try {
    const { user_id } = req.params;
    const session = await knex("quiz_sessions")
      .where({ user_id })
      .orderBy("created_at", "desc")
      .first();

    if (!session) {
      return res.status(404).json({ error: "No session found for this user" });
    }
    const history = await knex("chat_history")
      .where("session_id", session.id)
      .orderBy("created_at", "asc")
      .select("role", "message", "created_at");
    res.status(200).json({ history, session_id: session.id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
};
export { postChat, getChatHistory, createChatSession };
