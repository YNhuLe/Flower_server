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

//tools axecutor function definition
const executeTool = async (call: any) => {
    let result;
  switch (call.name) {
    case "get_care_guide":
      result = await knex("plants")
        .where({ slug: call.input.plant_name })
        .select(
          "watering_requirements",
          "humidity_references",
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
        .select("is_pet_friendly", "pet_safety_notes", 'toxicity_notes')
        .first();
      break;

    case 'get_plant_page':
       result = await knex('plants')
        .where({slug: call.input.plant_name})
        .select(
            'page_url','common_name'
        ).first();
        break;

  }

  return {
    type: 'tool_result',
    tool_use_id:call.id,
    content: JSON.stringify(result)
  }
};


// ─── Main chat endpoint ───────────────────────────────────────────────────────
 const postChat = async (req: any, res: any): Promise<void> => {
  try {
    const { session_id, message } = req.body;

//fetch the quiz session data to provide context to the agent
    const session = await knex("quiz_sessions")
      .where({ id: session_id })
      .first();

    if (!session) {
      res.status(404).json({ error: "Session not found" });
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
        content: h.message
      })),
      { role: "user", content: message }
    ];

    //  System prompt with quiz context
    const systemPrompt = `
      You are a friendly plant advisor.

      The user's quiz answers: ${JSON.stringify(session.answers)}
      Their top 3 recommended plants: ${JSON.stringify(top3)}

      Use get_care_guide when asked about watering, light, soil, or care.
      Use check_pet_safety when cats, dogs, or pets are mentioned.
      Use get_plant_page at the end to suggest the product page.
      Keep replies conversational and concise.
    `;

//AGENT LOOP and pick out tools

    console.log("messages being sent:", JSON.stringify(messages, null, 2));
console.log("tools:", JSON.stringify(tools, null, 2));
    let response = await callClaude(systemPrompt, messages, tools);

    while (response.stop_reason === "tool_use") {
      const toolCalls = response.content.filter((c: any) => c.type === "tool_use");
      const toolResults = await Promise.all(toolCalls.map(executeTool));

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await callClaude(systemPrompt, messages, tools);
    }

    const reply = response.content.find((c: any) => c.type === "text")?.text;

 //save the chat history to the database
    await knex("chat_history").insert([
      { session_id, role: "user",      message },
      { session_id, role: "assistant", message: reply }
    ]);

    res.status(200).json({ reply });

  } catch (err: any) {
     console.error("Chat error full details:", err.response?.data || err.message || err);
  res.status(500).json({ 
    error: err.response?.data?.error?.message || err.message || "Unknown error"
  });
  }
};

export { postChat}