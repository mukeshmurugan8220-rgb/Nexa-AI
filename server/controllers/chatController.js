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
  const requestStartTime = Date.now();

  try {
    const {
      message,
      persona = "general",
      conversationHistory = [],
    } = req.body;

    console.log("\n========== NEXAAI DEBUG ==========");
    console.log("Request received:", new Date().toISOString());
    console.log("Message:", message);
    console.log("Persona:", persona);

    // Validate user message
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid message.",
      });
    }

    // Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return res.status(500).json({
        success: false,
        error: "Gemini API key is not configured.",
      });
    }

    // Gemini AI Configuration
    const ai = new GoogleGenAI({
      apiKey,
      vertexai: false,
      httpOptions: {
        timeout: 60000,
      },
    });

    // Process conversation history
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
        const role = item.role === "user" ? "User" : "NexaAI";
        return `${role}: ${item.content}`;
      })
      .join("\n\n");

    // Create AI prompt
    const prompt = `
${personas[persona] || personas.general}

Instructions:
- Remember the previous conversation.
- Understand follow-up questions using conversation history.
- Give clear, accurate and helpful answers.
- Explain technical topics with practical examples.
- Do not unnecessarily ask users to repeat information.
- Maintain a friendly and professional tone.
- Keep simple answers concise.

Previous Conversation:
${formattedHistory || "No previous conversation."}

Current User Message:
${message.trim()}

NexaAI Response:
`;

    console.log("Sending request to Gemini 3.6 Flash...");

    // Measure Gemini API response time
    const geminiStartTime = Date.now();

    const response = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: prompt,
    });

    const geminiTime = (
      (Date.now() - geminiStartTime) / 1000
    ).toFixed(2);

    console.log("Gemini Processing Time:", geminiTime, "seconds");

    const reply = response.output_text;

    if (typeof reply !== "string" || !reply.trim()) {
      console.error("Gemini returned an empty response.");

      return res.status(502).json({
        success: false,
        error: "Gemini returned an empty response. Please try again.",
      });
    }

    const totalTime = (
      (Date.now() - requestStartTime) / 1000
    ).toFixed(2);

    console.log("Total Request Time:", totalTime, "seconds");
    console.log("Gemini response generated successfully.");
    console.log("========== END DEBUG ==========\n");

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
    });

  } catch (error) {
    const totalTime = (
      (Date.now() - requestStartTime) / 1000
    ).toFixed(2);

    console.error("\n========== GEMINI ERROR ==========");
    console.error("Error Message:", error.message);
    console.error("Error Status:", error.status);
    console.error("Total Time Before Error:", totalTime, "seconds");
    console.error("========== END ERROR ==========\n");

    let errorMessage =
      "Unable to generate AI response. Please try again.";

    let statusCode = 500;

    if (error.status === 429) {
      statusCode = 429;
      errorMessage =
        "Gemini API rate limit exceeded. Please try again later.";
    } else if (error.status === 503 || error.status === 504) {
      statusCode = 503;
      errorMessage =
        "Gemini AI is temporarily overloaded. Please try again.";
    } else if (
      error.name === "AbortError" ||
      error.name === "TimeoutError"
    ) {
      statusCode = 504;
      errorMessage =
        "Gemini response timed out. Please try again.";
    } else if (error.status === 400 || error.status === 403) {
      statusCode = error.status;
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};