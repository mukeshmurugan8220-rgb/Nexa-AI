import { GoogleGenAI } from "@google/genai";

const personas = {
  general:
    "You are NexaAI, a helpful and friendly AI assistant. Remember the conversation and understand follow-up questions.",

  coding:
    "You are an expert programming and coding assistant. Explain code clearly with examples.",

  study:
    "You are a friendly tutor who explains topics simply and clearly.",

  career:
    "You are a professional career advisor who provides practical career guidance.",

  content:
    "You are a creative content writer who creates engaging and high-quality content.",
};

export const sendMessage = async (req, res) => {
  try {
    const {
      message,
      persona = "general",
      conversationHistory = [],
    } = req.body;

    console.log("========== NEXAAI DEBUG ==========");
    console.log("Message:", message);
    console.log("Persona:", persona);

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid message.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
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
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
      )
      .map((item) => {
        const role =
          item.role === "user" ? "User" : "NexaAI";

        return `${role}: ${item.content}`;
      })
      .join("\n\n");

    const prompt = `
${personas[persona] || personas.general}

Instructions:
- Remember the previous conversation.
- Understand follow-up questions using conversation history.
- Give clear, accurate and helpful answers.
- Explain technical topics with practical examples.
- Do not unnecessarily ask users to repeat information.
- Maintain a friendly and professional tone.

Previous Conversation:
${formattedHistory || "No previous conversation."}

Current User Message:
${message.trim()}

NexaAI Response:
`;

    console.log("Sending request to Gemini 3.8 Flash...");

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: prompt,
    });

    const reply = response.output_text;

    if (!reply || !reply.trim()) {
      return res.status(502).json({
        success: false,
        error: "Gemini returned an empty response. Please try again.",
      });
    }

    console.log("Gemini response generated successfully.");
    console.log("========== END DEBUG ==========");

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
    });

  } catch (error) {
    console.error("========== GEMINI ERROR ==========");
    console.error("Error Message:", error.message);
    console.error("Error Status:", error.status);
    console.error("========== END ERROR ==========");

    return res.status(500).json({
      success: false,
      error: error.message || "Unable to generate AI response.",
    });
  }
};