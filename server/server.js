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
  "https://nexa-ai.vercel.app",
];

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/nexa-[a-z0-9-]+-mukesh-s-projects13\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      console.log("Blocked Origin:", origin);
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NexaAI Backend is running!",
  });
});

app.use("/api/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`NexaAI Server running on port ${PORT}`);
});