import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://nexa-ai-wtjo.vercel.app",
  "https://mukeshmurugan8220-rgb.github.io",
];

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Backend Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NexaAI Backend is running!",
  });
});

// Chat API
app.use("/api/chat", chatRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 NexaAI server running on port ${PORT}`);
});