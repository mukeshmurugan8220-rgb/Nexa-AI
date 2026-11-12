
import { GoogleGenAI } from "@google/genai";

const personas = {
  general:
    "You are NexaAI, a helpful and friendly AI assistant. Remember the conversation and understand follow-up questions.",
  coding:
    "You are an expert programming and coding assistant. Explain code clearly with examples.",
  study:
    "You are a friendly tutor who explains topics simply.",
  career:
    "You are a professional career advisor.",
  content:
    "You are a creative content writer.",
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sendMessage = async (req, res) => {
  try {
    const {
      message,
      persona = "general",
      conversationHistory = [],
    } = req.body;

    // DEBUG LOGS
    console.log("\n========== NEXAAI DEBUG ==========");
    console.log("Current Message:", message);
    console.log("Previous Messages:", conversationHistory);

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter a message.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Gemini API key is missing.");

      return res.status(500).json({
        success: false,
        error: "Gemini API key is not configured.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      vertexai: false,
    });

    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-12)
      : [];

    const formattedHistory = history
      .filter(
        (item) =>
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
      )
      .map((item) => {
        const role =
          item.role === "user" ? "User" : "NexaAI";

        return `${role}: ${item.content}`;
      })
      .join("\n\n");

    console.log("Formatted History:", formattedHistory);
    console.log("========== END DEBUG ==========\n");

    const prompt = `
${personas[persona] || personas.general}

IMPORTANT:
- Remember the previous conversation.
- Understand follow-up questions using previous messages.
- If the user says "it", "this", "that" or similar words, use the conversation context.
- Treat the previous conversation as important context.
- Give clear, helpful and accurate answers.
- Do not unnecessarily ask the user to repeat previous information.

Previous Conversation:
${formattedHistory || "No previous conversation."}

Current User Message:
${message}

NexaAI Response:
`;

    let interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
      background: true,
    });

    let attempts = 0;

    while (
      interaction.status === "in_progress" &&
      attempts < 20
    ) {
      await sleep(2000);

      interaction = await ai.interactions.get(
        interaction.id
      );

      attempts++;
    }

    if (interaction.status !== "completed") {
      return res.status(502).json({
        success: false,
        error: "AI response failed or timed out. Please try again.",
      });
    }

    return res.json({
      success: true,
      reply: interaction.output_text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to generate AI response.",
    });
  }
};
