
const API_URL = "http://localhost:5000/api/chat";

export const sendMessageToAI = async (
  message,
  persona = "general",
  conversationHistory = []
) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        persona,
        conversationHistory,
      }),
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response from NexaAI server.");
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to generate AI response. Please try again."
      );
    }

    if (!data.reply) {
      throw new Error("NexaAI returned an empty response. Please try again.");
    }

    return data.reply;

  } catch (error) {
    console.error("AI Service Error:", error);

    if (error.name === "TypeError") {
      throw new Error(
        "NexaAI is temporarily unavailable. Please check your connection and try again."
      );
    }

    throw error;
  }
};
